// app/dashboard/magazin-produse/nou/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import ProductFormClient from "../ProductFormClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/magazin-produse/nou")
  const { role } = await getUserRole(data.user.id)
  if (role === "user") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: cats } = await admin
    .from("shop_categories")
    .select("id, nume")
    .eq("is_active", true)
    .order("sort_order")

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/magazin-produse">Produse</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Adaugă produs</span>
      </nav>
      <h1 className="dash-title">Adaugă produs nou</h1>
      <ProductFormClient mode="create" categories={(cats ?? []) as { id: number; nume: string }[]} />
    </div>
  )
}
