// app/dashboard/magazin-comenzi/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import OrderActions from "./OrderActions"

type Params = { id: string }

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect(`/login?redirect=/dashboard/magazin-comenzi/${id}`)
  const { role, firmId } = await getUserRole(u.user.id)
  if (role === "user") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: order } = await admin
    .from("shop_orders")
    .select("*, gas_firms:seller_firm_id(brand_name, legal_name)")
    .eq("id", id)
    .maybeSingle()

  if (!order) notFound()
  if (role === "firm_owner" && order.seller_firm_id !== firmId) redirect("/dashboard/magazin-comenzi")

  const items = Array.isArray(order.items)
    ? (order.items as Array<{ nume: string; qty: number; price: number; sku?: string | null; slug: string }>)
    : []
  const addr = order.billing_address as { street?: string; city?: string; county?: string; zip?: string } | null

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/magazin-comenzi">Comenzi</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{order.public_ref as string}</span>
      </nav>

      <h1 className="dash-title">
        Comanda <code>{order.public_ref as string}</code>
        <span className={`dash-status dash-status--${order.payment_status}`}>
          plată: {order.payment_status as string}
        </span>
        <span className={`dash-status dash-status--${order.fulfillment_status}`}>
          livrare: {order.fulfillment_status as string}
        </span>
      </h1>

      <section className="dash-card">
        <h2>Client</h2>
        <dl className="dash-dl">
          <dt>Nume</dt><dd>{order.buyer_name as string}</dd>
          <dt>Telefon</dt><dd><a href={`tel:${order.buyer_phone}`}>{order.buyer_phone as string}</a></dd>
          <dt>Email</dt><dd>{order.buyer_email as string}</dd>
          {order.cui && (<><dt>CUI (factură)</dt><dd>{order.cui as string}</dd></>)}
        </dl>
      </section>

      <section className="dash-card">
        <h2>Produse</h2>
        <ul className="checkout-summary">
          {items.map((i, idx) => (
            <li key={idx}>
              <Link href={`/magazin/${i.slug}`}>{i.nume}</Link>
              {i.sku && <span className="dash-subtle"> · SKU: {i.sku}</span>}
              {" × "}{i.qty}{" — "}<strong>{(i.price * i.qty).toFixed(2)} lei</strong>
            </li>
          ))}
        </ul>
        <div className="checkout-totals">
          <div>Subtotal: {Number(order.subtotal).toFixed(2)} lei</div>
          <div>Livrare ({order.delivery_label as string}): {Number(order.delivery_price).toFixed(2)} lei</div>
          <div><strong>Total: {Number(order.total).toFixed(2)} {order.currency as string}</strong></div>
        </div>
      </section>

      <section className="dash-card">
        <h2>Livrare</h2>
        {addr && (
          <p>
            {addr.street}, {addr.city}{addr.county ? `, ${addr.county}` : ""}
            {addr.zip && <> · {addr.zip}</>}
          </p>
        )}
        {order.notes && <p>Observații client: <em>{order.notes as string}</em></p>}
      </section>

      <OrderActions
        orderId={order.id as string}
        currentStatus={order.fulfillment_status as string}
        trackingUrl={(order.tracking_url as string | null) ?? ""}
        trackingNumber={(order.tracking_number as string | null) ?? ""}
        internalNote={(order.internal_notes as string | null) ?? ""}
      />
    </div>
  )
}
