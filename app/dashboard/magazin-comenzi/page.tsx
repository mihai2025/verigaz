// app/dashboard/magazin-comenzi/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = { searchParams: Promise<{ status?: string }> }
const FULFILLMENT_TABS = ["pending", "processing", "shipped", "delivered", "returned", "cancelled"] as const

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/magazin-comenzi")

  const { role, firmId } = await getUserRole(u.user.id)
  if (role === "user") redirect("/dashboard")

  const sp = await searchParams
  const status = (FULFILLMENT_TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "processing"

  const admin = getServiceRoleSupabase()
  let query = admin
    .from("shop_orders")
    .select("id, public_ref, buyer_name, buyer_phone, buyer_email, total, currency, " +
            "payment_status, fulfillment_status, seller_firm_id, created_at, " +
            "gas_firms:seller_firm_id(brand_name, legal_name)")
    .eq("fulfillment_status", status)
    .order("created_at", { ascending: false })
    .limit(100)
  if (role === "firm_owner" && firmId) query = query.eq("seller_firm_id", firmId)

  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (data ?? []) as any[]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Comenzi magazin</h1>
      <nav className="dash-tabs">
        {FULFILLMENT_TABS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/magazin-comenzi?status=${s}`}
            className={`dash-tab ${status === s ? "dash-tab--active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="dash-note">Nicio comandă în „{status}".</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Ref.</th>
              <th>Client</th>
              <th>Total</th>
              <th>Plată</th>
              {role === "admin" && <th>Vânzător</th>}
              <th>Creată</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const seller = Array.isArray(o.gas_firms) ? o.gas_firms[0] : o.gas_firms
              return (
                <tr key={o.id}>
                  <td><code>{o.public_ref}</code></td>
                  <td>
                    {o.buyer_name}
                    <div className="dash-subtle">{o.buyer_phone} · {o.buyer_email}</div>
                  </td>
                  <td>{Number(o.total).toFixed(2)} {o.currency}</td>
                  <td>
                    <span className={`dash-status dash-status--${o.payment_status}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  {role === "admin" && (
                    <td>{seller ? (seller.brand_name || seller.legal_name) : "platformă"}</td>
                  )}
                  <td>{new Date(o.created_at).toLocaleDateString("ro-RO")}</td>
                  <td>
                    <Link href={`/dashboard/magazin-comenzi/${o.id}`} className="dash-btn dash-btn--ghost">
                      Deschide →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
