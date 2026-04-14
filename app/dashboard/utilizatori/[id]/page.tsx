// app/dashboard/utilizatori/[id]/page.tsx
// Admin — detaliu user + editare + atribuire firmă.
export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import UserEditClient from "./UserEditClient"

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect(`/login?redirect=/dashboard/utilizatori/${id}`)
  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const admin = getServiceRoleSupabase()

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, email, full_name, phone, role, firm_id, created_at, updated_at")
    .eq("user_id", id)
    .maybeSingle()

  if (!profile) notFound()

  const { data: authUserRes } = await admin.auth.admin.getUserById(id)
  const authUser = authUserRes?.user ?? null

  const [firmRes, firmsRes] = await Promise.all([
    profile.firm_id
      ? admin.from("gas_firms").select("id, slug, brand_name, legal_name").eq("id", profile.firm_id as string).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("gas_firms")
      .select("id, brand_name, legal_name, owner_user_id")
      .order("legal_name")
      .limit(2000),
  ])

  const currentFirm = (firmRes.data as { id: string; slug: string; brand_name: string | null; legal_name: string } | null)
  const allFirms = ((firmsRes.data ?? []) as Array<{
    id: string
    brand_name: string | null
    legal_name: string
    owner_user_id: string | null
  }>).map((f) => ({
    id: f.id,
    name: f.brand_name || f.legal_name,
    ownerId: f.owner_user_id,
  }))

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/utilizatori">Utilizatori</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{profile.email ?? id.slice(0, 8)}</span>
      </nav>

      <h1 className="dash-title">{profile.email ?? "—"}</h1>
      <div className="dash-subtle" style={{ marginBottom: 20 }}>
        UID: <code>{id}</code>
        {" · "}Creat: {new Date(profile.created_at as string).toLocaleDateString("ro-RO")}
        {authUser?.email_confirmed_at
          ? <> · <span className="dash-status dash-status--approved">email confirmat</span></>
          : <> · <span className="dash-status dash-status--pending">email neconfirmat</span></>}
      </div>

      <UserEditClient
        userId={id}
        initial={{
          email: profile.email ?? (authUser?.email ?? ""),
          fullName: (profile.full_name as string | null) ?? null,
          phone: (profile.phone as string | null) ?? null,
          role: (profile.role as string | null) ?? "user",
          firmId: (profile.firm_id as string | null) ?? null,
        }}
        currentFirm={currentFirm}
        firms={allFirms}
      />
    </div>
  )
}
