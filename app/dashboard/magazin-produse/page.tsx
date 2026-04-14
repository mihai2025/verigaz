// app/dashboard/magazin-produse/page.tsx
// Listă produse gestionate de firmă (sau toate pentru admin).
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

export default async function Page() {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/magazin-produse")

  const { role, firmId } = await getUserRole(u.user.id)
  if (role === "user") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  let query = admin
    .from("shop_products")
    .select("id, slug, nume, price, stock, manage_stock, is_active, is_featured, category_id, " +
            "shop_categories(nume), gas_firms:seller_firm_id(brand_name, legal_name)")
    .order("created_at", { ascending: false })
    .limit(200)
  if (role === "firm_owner" && firmId) query = query.eq("seller_firm_id", firmId)

  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (data ?? []) as any[]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Produse magazin</h1>
      <p>
        <Link href="/dashboard/magazin-produse/nou" className="dash-btn dash-btn--primary">
          + Adaugă produs
        </Link>
      </p>

      {products.length === 0 ? (
        <p className="dash-note">Nu ai încă produse listate.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Produs</th>
              <th>Categorie</th>
              <th>Preț</th>
              <th>Stoc</th>
              <th>Status</th>
              {role === "admin" && <th>Vânzător</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cat = Array.isArray(p.shop_categories) ? p.shop_categories[0] : p.shop_categories
              const seller = Array.isArray(p.gas_firms) ? p.gas_firms[0] : p.gas_firms
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/magazin/${p.slug}`}>{p.nume}</Link>
                    {p.is_featured && <span className="dash-badge"> recomandat</span>}
                  </td>
                  <td>{cat?.nume ?? "—"}</td>
                  <td>{p.price} lei</td>
                  <td>{p.manage_stock ? p.stock : "∞"}</td>
                  <td>{p.is_active ? "activ" : "inactiv"}</td>
                  {role === "admin" && <td>{seller ? (seller.brand_name || seller.legal_name) : "platformă"}</td>}
                  <td>
                    <Link href={`/dashboard/magazin-produse/${p.id}`} className="dash-btn dash-btn--ghost">
                      Editează →
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
