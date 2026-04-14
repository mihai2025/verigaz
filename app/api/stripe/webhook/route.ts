// app/api/stripe/webhook/route.ts
//
// Stripe webhook handler — procesează evenimentele pentru shop_orders.
// Eventurile tratate:
//   - checkout.session.completed → marchează comanda paid + scade stocul
//   - payment_intent.payment_failed → payment_status='failed'
//   - charge.refunded → payment_status='refunded'
//
// Endpoint-ul trebuie configurat în Stripe Dashboard → Webhooks cu secretul
// în STRIPE_WEBHOOK_SECRET.
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe/client"
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { writeAudit } from "@/lib/audit/log"
import { sendEmail } from "@/lib/email/resend"
import { sendSms } from "@/lib/sms/smsadvert"
import { SMS_TEMPLATES, applyVerigazTemplate } from "@/lib/sms/templates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handlePaid(session: Stripe.Checkout.Session) {
  const admin = getServiceRoleSupabase()
  const orderId = session.metadata?.orderId
  if (!orderId) {
    console.error("[stripe webhook] missing orderId in metadata")
    return
  }

  const { data: order } = await admin
    .from("shop_orders")
    .select("id, public_ref, items, buyer_email, buyer_phone, buyer_name, total, payment_status")
    .eq("id", orderId)
    .maybeSingle()
  if (!order) return
  if (order.payment_status === "paid") return // idempotent

  // Scade stocul pentru produsele cu manage_stock
  const items = Array.isArray(order.items) ? (order.items as Array<{ productId: string; qty: number }>) : []
  for (const it of items) {
    await admin.rpc("decrement_product_stock", { p_id: it.productId, p_qty: it.qty }).then(
      () => {},
      async () => {
        // Fallback dacă nu există RPC — update direct
        const { data: p } = await admin
          .from("shop_products")
          .select("stock, manage_stock")
          .eq("id", it.productId)
          .maybeSingle()
        if (p?.manage_stock) {
          await admin
            .from("shop_products")
            .update({ stock: Math.max(0, (p.stock as number) - it.qty) })
            .eq("id", it.productId)
        }
      },
    )
  }

  await admin
    .from("shop_orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string | null,
      fulfillment_status: "processing",
    })
    .eq("id", orderId)

  await writeAudit({
    actorUserId: null,
    actorRole: "stripe",
    action: "order.paid",
    entityType: "shop_orders",
    entityId: orderId,
    summary: `${order.public_ref} · ${order.total} RON`,
    metadata: { sessionId: session.id },
  })

  // Notificări client
  const smsBody = applyVerigazTemplate(SMS_TEMPLATES.comanda_confirmata, {
    REF: order.public_ref as string,
    TOTAL: String(order.total),
  })
  await sendSms(order.buyer_phone as string, smsBody).catch(() => null)

  await sendEmail({
    to: order.buyer_email as string,
    subject: `Comanda ${order.public_ref} confirmată — verigaz`,
    html: `<p>Mulțumim, <strong>${order.buyer_name}</strong>!</p>
<p>Comanda <code>${order.public_ref}</code> a fost confirmată și se procesează.</p>
<p>Total plătit: <strong>${order.total} RON</strong></p>
<p>Poți urmări comanda la: <a href="https://verificari-gaze.ro/magazin/comanda/${order.public_ref}">verificari-gaze.ro/magazin/comanda/${order.public_ref}</a></p>`,
  }).catch(() => null)
}

async function handleFailed(pi: Stripe.PaymentIntent) {
  const admin = getServiceRoleSupabase()
  const orderId = pi.metadata?.orderId
  if (!orderId) return
  await admin
    .from("shop_orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId)
    .eq("payment_status", "pending")
  await writeAudit({
    actorUserId: null,
    actorRole: "stripe",
    action: "order.failed",
    entityType: "shop_orders",
    entityId: orderId,
  })
}

async function handleRefunded(charge: Stripe.Charge) {
  const admin = getServiceRoleSupabase()
  const orderId = charge.metadata?.orderId ?? charge.payment_intent
    ? (await getStripe().paymentIntents.retrieve(charge.payment_intent as string)).metadata?.orderId
    : null
  if (!orderId) return
  await admin
    .from("shop_orders")
    .update({ payment_status: "refunded" })
    .eq("id", orderId)
  await writeAudit({
    actorUserId: null,
    actorRole: "stripe",
    action: "order.refunded",
    entityType: "shop_orders",
    entityId: orderId,
  })
}

async function handleSubscriptionEvent(
  sub: Stripe.Subscription,
  event: "created" | "updated" | "deleted",
) {
  const admin = getServiceRoleSupabase()
  const firmId = sub.metadata?.firmId
  const plan = sub.metadata?.plan
  const subRowId = sub.metadata?.subscriptionRowId
  if (!firmId || !plan) {
    console.warn("[stripe webhook] subscription missing metadata:", sub.id)
    return
  }

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "pending",
    incomplete_expired: "expired",
  }
  const status = event === "deleted" ? "canceled" : (statusMap[sub.status] ?? sub.status)

  const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
  const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null

  const patch: Record<string, unknown> = {
    status,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    stripe_price_id: sub.items.data[0]?.price?.id ?? null,
    started_at: sub.start_date ? new Date(sub.start_date * 1000).toISOString() : null,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    expires_at: periodEnd,
    trial_end: trialEnd,
    canceled_at: canceledAt,
    cancel_at_period_end: sub.cancel_at_period_end,
  }

  if (subRowId) {
    await admin.from("firm_subscriptions").update(patch).eq("id", subRowId)
  } else {
    const { data: existing } = await admin
      .from("firm_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle()
    if (existing) {
      await admin.from("firm_subscriptions").update(patch).eq("id", existing.id)
    } else {
      await admin.from("firm_subscriptions").insert({
        firm_id: firmId,
        plan,
        billing_period: "yearly",
        amount: (sub.items.data[0]?.price?.unit_amount ?? 0) / 100,
        currency: (sub.items.data[0]?.price?.currency ?? "RON").toUpperCase(),
        ...patch,
      })
    }
  }

  // Sync gas_firms.plan
  if (status === "active" || status === "trialing") {
    await admin
      .from("gas_firms")
      .update({ plan, plan_valid_until: periodEnd, plan_updated_at: new Date().toISOString() })
      .eq("id", firmId)
  } else if (status === "canceled" || status === "expired") {
    const { data: other } = await admin
      .from("firm_subscriptions")
      .select("id")
      .eq("firm_id", firmId)
      .in("status", ["active", "trialing"])
      .neq("stripe_subscription_id", sub.id)
      .limit(1)
    if (!other || other.length === 0) {
      await admin
        .from("gas_firms")
        .update({ plan: "free", plan_valid_until: null, plan_updated_at: new Date().toISOString() })
        .eq("id", firmId)
    }
  }

  await writeAudit({
    actorUserId: null,
    actorRole: "stripe",
    action: `subscription.${event}`,
    entityType: "firm_subscriptions",
    entityId: sub.id,
    summary: `${plan} · ${status}`,
    metadata: { firmId, plan, stripeStatus: sub.status },
  })
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 })

  const sig = request.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 })

  const payload = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret)
  } catch (err) {
    console.error("[stripe webhook] verification failed:", err)
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        // Subscription sessions sunt tratate prin customer.subscription.created.
        if (session.mode !== "subscription") await handlePaid(session)
        break
      }
      case "customer.subscription.created":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, "created")
        break
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, "updated")
        break
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, "deleted")
        break
      case "payment_intent.payment_failed":
        await handleFailed(event.data.object as Stripe.PaymentIntent)
        break
      case "charge.refunded":
        await handleRefunded(event.data.object as Stripe.Charge)
        break
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err)
    return NextResponse.json({ error: "handler_error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
