// app/dashboard/magazin-produse/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import ProductFormClient from "../ProductFormClient"

type Params = { id: string }

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect(`/login?redirect=/dashboard/magazin-produse/${id}`)
  const { role, firmId } = await getUserRole(u.user.id)
  if (role === "user") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const [prodRes, catsRes] = await Promise.all([
    admin.from("shop_products").select("*").eq("id", id).maybeSingle(),
    admin.from("shop_categories").select("id, nume").eq("is_active", true).order("sort_order"),
  ])

  if (!prodRes.data) notFound()
  if (role === "firm_owner" && prodRes.data.seller_firm_id !== firmId) redirect("/dashboard/magazin-produse")

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/magazin-produse">Produse</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{prodRes.data.nume as string}</span>
      </nav>
      <h1 className="dash-title">Editează produs</h1>
      <ProductFormClient
        mode="edit"
        productId={id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial={prodRes.data as any}
        categories={(catsRes.data ?? []) as unknown as { id: number; nume: string }[]}
      />
    </div>
  )
}
