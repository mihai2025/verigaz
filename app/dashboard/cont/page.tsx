// app/dashboard/cont/page.tsx
// Profil utilizator — date din auth.users + profiles.
import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"

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
      <dl className="dash-dl">
        <dt>Email</dt><dd>{data.user.email}</dd>
        <dt>Nume</dt><dd>{profile?.full_name || <em>nesetat</em>}</dd>
        <dt>Telefon</dt><dd>{profile?.phone || <em>nesetat</em>}</dd>
        <dt>Rol</dt><dd>{profile?.role ?? "user"}</dd>
        <dt>Cont creat</dt>
        <dd>{profile?.created_at ? new Date(profile.created_at as string).toLocaleDateString("ro-RO") : "—"}</dd>
      </dl>
      <p className="dash-note">Editarea datelor va fi disponibilă într-o iterație viitoare.</p>
    </div>
  )
}
