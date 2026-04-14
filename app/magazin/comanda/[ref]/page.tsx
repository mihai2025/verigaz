// app/magazin/comanda/[ref]/page.tsx
// Confirmare comandă — pagina publică cu status plată + items.
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getServiceRoleSupabase } from "@/lib/supabase/server"

type Params = { ref: string }

export const metadata: Metadata = {
  title: "Comanda ta — verigaz",
  robots: { index: false, follow: false },
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { ref } = await params
  const admin = getServiceRoleSupabase()
  const { data: order } = await admin
    .from("shop_orders")
    .select(
      "public_ref, items, subtotal, delivery_label, delivery_price, total, currency, " +
      "payment_status, fulfillment_status, paid_at, shipped_at, tracking_url, tracking_number, " +
      "buyer_name, buyer_email, buyer_phone, billing_address, created_at",
    )
    .eq("public_ref", ref)
    .maybeSingle()

  if (!order) notFound()

  const items = Array.isArray(order.items)
    ? (order.items as Array<{ nume: string; qty: number; price: number; slug: string; sku?: string | null }>)
    : []
  const addr = order.billing_address as { street?: string; city?: string; county?: string; zip?: string } | null

  const paid = order.payment_status === "paid"
  const pending = order.payment_status === "pending"
  const failed = order.payment_status === "failed"

  return (
    <div className="order-confirmation container">
      <header className="booking-hero">
        <div className={`booking-check ${paid ? "" : failed ? "booking-check--failed" : "booking-check--pending"}`} aria-hidden="true">
          {paid ? "✓" : failed ? "✗" : "…"}
        </div>
        <h1 className="booking-title">
          {paid ? "Comandă confirmată" : failed ? "Plată eșuată" : "Plată în curs"}
        </h1>
        <p className="booking-lead">
          Număr de referință: <code className="booking-ref">{order.public_ref as string}</code>
        </p>
        {pending && (
          <p className="booking-lead">
            Dacă tocmai ai plătit, pagina se actualizează în câteva secunde.
          </p>
        )}
      </header>

      <section className="booking-card">
        <h2>Produse</h2>
        <ul className="checkout-summary">
          {items.map((i, idx) => (
            <li key={idx}>
              <Link href={`/magazin/${i.slug}`}>{i.nume}</Link> × {i.qty} — <strong>{(i.price * i.qty).toFixed(2)} lei</strong>
            </li>
          ))}
        </ul>
        <div className="checkout-totals">
          <div>Subtotal: {Number(order.subtotal).toFixed(2)} lei</div>
          <div>Livrare ({order.delivery_label as string}): {Number(order.delivery_price).toFixed(2)} lei</div>
          <div><strong>Total: {Number(order.total).toFixed(2)} {order.currency as string}</strong></div>
        </div>
      </section>

      <section className="booking-card">
        <h2>Livrare</h2>
        <p>{order.buyer_name as string}</p>
        <p className="dash-subtle">
          {order.buyer_phone as string} · {order.buyer_email as string}
        </p>
        {addr && (
          <p>
            {addr.street}, {addr.city}{addr.county ? `, ${addr.county}` : ""}
            {addr.zip && <> · {addr.zip}</>}
          </p>
        )}
        <p>Status livrare: <strong>{order.fulfillment_status as string}</strong></p>
        {order.tracking_url && (
          <p>
            <a href={order.tracking_url as string} target="_blank" rel="noreferrer" className="shop-btn shop-btn--ghost">
              Urmărește coletul →
            </a>
          </p>
        )}
      </section>

      <div className="booking-actions">
        <Link href="/magazin" className="shop-btn shop-btn--ghost">Continuă cumpărăturile</Link>
        <Link href="/" className="shop-btn shop-btn--ghost">Acasă</Link>
      </div>
    </div>
  )
}
