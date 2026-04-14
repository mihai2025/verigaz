// app/dashboard/cont/page.tsx
// Profil utilizator — date din auth.users + profiles, editabile.
export const dynamic = "force-dynamic"
export const revalidate = 0

import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import ContEditClient from "./ContEditClient"

export default async function ContPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/cont")

  const admin = getServiceRoleSupabase()
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone, email, role, firm_id, created_at")
    .eq("user_id", data.user.id)
    .maybeSingle()

  return (
    <div className="dash-page">
      <h1 className="dash-title">Contul meu</h1>
      <p className="dash-lead">
        Actualizează datele personale. Emailul se modifică doar prin suport.
      </p>
      <ContEditClient
        email={data.user.email ?? ""}
        fullName={(profile?.full_name as string | null) ?? null}
        phone={(profile?.phone as string | null) ?? null}
        role={(profile?.role as string | null) ?? "user"}
        createdAt={(profile?.created_at as string | null) ?? null}
      />
    </div>
  )
}
