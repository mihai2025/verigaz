// app/api/stripe/checkout/route.ts
//
// Creează Stripe Checkout Session pentru comanda din coș.
// Pașii:
//   1. Validează items + prețuri (anti-tampering: re-lookup DB pentru fiecare produs)
//   2. Creează shop_orders cu payment_status='pending' + public_ref
//   3. Creează Stripe session cu metadata.orderId → webhook face match
//   4. Returnează session.url → client face window.location = url
import { NextResponse } from "next/server"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getStripe, siteUrl } from "@/lib/stripe/client"

export const runtime = "nodejs"

type Item = { productId: string; qty: number }
type CheckoutBody = {
  items: Item[]
  buyer: { name: string; phone: string; email: string }
  billingAddress: { street: string; city: string; county: string; zip?: string }
  business: { cui: string; companyName: string } | null
  delivery: { key: string; label: string; price: number }
  notes: string | null
}

async function genOrderRef(): Promise<string> {
  const admin = getServiceRoleSupabase()
  const year = new Date().getFullYear()
  const prefix = `VG-ORD-${year}-`
  const { data } = await admin
    .from("shop_orders")
    .select("public_ref")
    .ilike("public_ref", `${prefix}%`)
    .order("public_ref", { ascending: false })
    .limit(1)
  let next = 1
  if (data && data.length > 0) {
    const n = Number((data[0].public_ref as string).slice(prefix.length))
    if (!Number.isNaN(n)) next = n + 1
  }
  return `${prefix}${String(next).padStart(6, "0")}`
}

export async function POST(request: Request) {
  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 })
  }
  if (!body.buyer?.email || !body.buyer?.phone || !body.buyer?.name) {
    return NextResponse.json({ error: "missing_buyer" }, { status: 400 })
  }
  if (!body.billingAddress?.street || !body.billingAddress?.city) {
    return NextResponse.json({ error: "missing_address" }, { status: 400 })
  }

  // ── Anti-tampering: re-fetch prețuri din DB ─────────────────
  const admin = getServiceRoleSupabase()
  const ids = body.items.map((i) => i.productId)
  const { data: products, error: prodErr } = await admin
    .from("shop_products")
    .select("id, slug, nume, price, stock, manage_stock, sku, is_active, image_url")
    .in("id", ids)
  if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 })

  const byId = new Map((products ?? []).map((p) => [p.id as string, p]))
  const enrichedItems: Array<{ productId: string; slug: string; nume: string; price: number; qty: number; sku: string | null; image_url: string | null }> = []
  for (const it of body.items) {
    const p = byId.get(it.productId)
    if (!p || !p.is_active) {
      return NextResponse.json({ error: `product_unavailable:${it.productId}` }, { status: 400 })
    }
    if (p.manage_stock && (p.stock as number) < it.qty) {
      return NextResponse.json({ error: `insufficient_stock:${p.slug}` }, { status: 400 })
    }
    enrichedItems.push({
      productId: p.id as string,
      slug: p.slug as string,
      nume: p.nume as string,
      price: p.price as number,
      qty: Math.max(1, Math.min(99, it.qty)),
      sku: (p.sku as string | null) ?? null,
      image_url: (p.image_url as string | null) ?? null,
    })
  }

  const subtotal = enrichedItems.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryPrice = Number(body.delivery?.price ?? 0)
  const total = +(subtotal + deliveryPrice).toFixed(2)

  const publicRef = await genOrderRef()

  // ── Link la auth user dacă e cazul ──────────────────────────
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id ?? null
  let customerId: string | null = null
  if (userId) {
    const { data: existing } = await admin
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
    customerId = existing?.id ?? null
  }

  // ── Insert shop_orders ──────────────────────────────────────
  const { data: order, error: orderErr } = await admin
    .from("shop_orders")
    .insert({
      public_ref: publicRef,
      customer_id: customerId,
      buyer_email: body.buyer.email.trim(),
      buyer_name: body.buyer.name.trim(),
      buyer_phone: body.buyer.phone.trim(),
      billing_address: body.billingAddress,
      shipping_address: body.billingAddress,
      cui: body.business?.cui ?? null,
      items: enrichedItems,
      subtotal,
      delivery_key: body.delivery.key,
      delivery_label: body.delivery.label,
      delivery_price: deliveryPrice,
      total,
      currency: "RON",
      payment_status: "pending",
      payment_provider: "stripe",
      notes: body.notes,
    })
    .select("id, public_ref")
    .single()
  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message ?? "order_insert_failed" }, { status: 500 })
  }

  // ── Creează Stripe Checkout Session ─────────────────────────
  const stripe = getStripe()
  const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] =
    enrichedItems.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: "ron",
        unit_amount: Math.round(i.price * 100),
        product_data: {
          name: i.nume,
          ...(i.image_url ? { images: [i.image_url] } : {}),
          metadata: { product_id: i.productId, sku: i.sku ?? "" },
        },
      },
    }))

  if (deliveryPrice > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "ron",
        unit_amount: Math.round(deliveryPrice * 100),
        product_data: { name: `Livrare: ${body.delivery.label}` },
      },
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: body.buyer.email,
    success_url: `${siteUrl()}/magazin/comanda/${publicRef}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/magazin/checkout?canceled=1`,
    metadata: {
      orderId: order.id as string,
      publicRef,
    },
    payment_intent_data: {
      metadata: { orderId: order.id as string, publicRef },
    },
  })

  // Save session_id pt. match la webhook
  await admin
    .from("shop_orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id)

  return NextResponse.json({ ok: true, url: session.url, publicRef })
}
