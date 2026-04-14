// app/dashboard/sms-templates/nou/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import NewSmsTemplateClient from "./NewSmsTemplateClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/sms-templates/nou")
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") redirect("/dashboard")

  return (
    <div className="dash-page">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/dashboard/sms-templates">SMS Templates</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Adaugă</span>
      </nav>
      <h1 className="dash-title">Adaugă template SMS</h1>
      <NewSmsTemplateClient />
    </div>
  )
}
