"use server"

import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { getStripe, siteUrl } from "@/lib/stripe/client"
import { PLANS, getStripePriceId, type PlanKey } from "@/lib/plans/plans"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true; url: string } | { ok: false; error: string }

export async function createSubscriptionCheckout(plan: PlanKey): Promise<Result> {
  if (plan === "free") return { ok: false, error: "Nu e necesar checkout pentru planul gratuit." }

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false, error: "Doar firmele pot face upgrade." }

  const priceId = getStripePriceId(plan)
  if (!priceId) {
    return { ok: false, error: `Stripe price ID pentru planul ${plan} nu e configurat (env: ${PLANS[plan].stripePriceIdEnv}).` }
  }

  const admin = getServiceRoleSupabase()
  const { data: firm } = await admin
    .from("gas_firms")
    .select("id, brand_name, legal_name, email")
    .eq("id", firmId)
    .maybeSingle()
  if (!firm) return { ok: false, error: "Firma nu a fost găsită." }

  // Insert pending subscription row — va fi update-at de webhook la succes
  const { data: sub, error: insErr } = await admin
    .from("firm_subscriptions")
    .insert({
      firm_id: firmId,
      plan,
      billing_period: "yearly",
      amount: PLANS[plan].priceYearly,
      currency: "RON",
      status: "pending",
      stripe_price_id: priceId,
    })
    .select("id")
    .single()
  if (insErr || !sub) return { ok: false, error: insErr?.message ?? "Eroare la inițiere." }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: firm.email ?? data.user.email ?? undefined,
    success_url: `${siteUrl()}/dashboard/abonament?checkout=success`,
    cancel_url: `${siteUrl()}/dashboard/abonament?checkout=canceled`,
    metadata: {
      firmId,
      plan,
      subscriptionRowId: sub.id as string,
    },
    subscription_data: {
      metadata: {
        firmId,
        plan,
        subscriptionRowId: sub.id as string,
      },
    },
  })

  await admin
    .from("firm_subscriptions")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", sub.id)

  await writeAudit({
    actorUserId: data.user.id,
    actorRole: "firm_owner",
    action: "subscription.checkout_started",
    entityType: "firm_subscriptions",
    entityId: sub.id as string,
    summary: `${plan} · ${PLANS[plan].priceYearly} RON/an`,
    metadata: { firmId, plan, sessionId: session.id },
  })

  if (!session.url) return { ok: false, error: "Stripe n-a returnat URL." }
  return { ok: true, url: session.url }
}

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<Result> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false, error: "Acces refuzat." }

  const admin = getServiceRoleSupabase()
  const { data: sub } = await admin
    .from("firm_subscriptions")
    .select("firm_id, stripe_subscription_id, status")
    .eq("id", subscriptionId)
    .maybeSingle()
  if (!sub || sub.firm_id !== firmId) return { ok: false, error: "Abonament invalid." }
  if (!sub.stripe_subscription_id) return { ok: false, error: "Lipsește ID Stripe." }

  const stripe = getStripe()
  if (atPeriodEnd) {
    await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
      cancel_at_period_end: true,
    })
    await admin
      .from("firm_subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("id", subscriptionId)
  } else {
    await stripe.subscriptions.cancel(sub.stripe_subscription_id as string)
    await admin
      .from("firm_subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", subscriptionId)
  }

  await writeAudit({
    actorUserId: data.user.id,
    actorRole: "firm_owner",
    action: atPeriodEnd ? "subscription.cancel_at_period_end" : "subscription.cancel_now",
    entityType: "firm_subscriptions",
    entityId: subscriptionId,
  })

  return { ok: true, url: "/dashboard/abonament" }
}
