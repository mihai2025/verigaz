// app/dashboard/sms-templates/page.tsx
// Admin — catalog SMS templates pentru reminder-e.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import SmsTemplatesClient from "./SmsTemplatesClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/sms-templates")
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") redirect("/dashboard")

  const admin = getServiceRoleSupabase()
  const { data: templates } = await admin
    .from("sms_templates_admin")
    .select("id, reminder_type, template, description, is_active, max_chars, updated_at")
    .order("reminder_type")

  return (
    <div className="dash-page">
      <h1 className="dash-title">SMS Templates — admin</h1>
      <p className="dash-subtle">
        Catalog editabil de template-uri SMS folosite de dispatcher pentru reminder-e.
        Placeholderele disponibile:
      </p>
      <div className="dash-card">
        <ul className="dash-placeholders">
          <li><code>{"{FIRMA}"}</code> — numele firmei care trimite (max 50 char)</li>
          <li><code>{"{DATA}"}</code> — data scadenței în format DD.MM.YYYY</li>
          <li><code>{"{ECHIPAMENT}"}</code> — „instalatiei de gaz" / „centralei termice" / „detectorului de gaz"</li>
          <li><code>{"{ACTIUNE}"}</code> — „verificarea" / „revizia" / „service-ul"</li>
          <li><code>{"{TELEFON}"}</code> — telefonul firmei</li>
          <li><code>{"{ADRESA}"}</code> — adresa clientului</li>
          <li><code>{"{LINK}"}</code> — shortlink programare (via Bitly)</li>
          <li><code>{"{REF}"}</code> — fallback: primele 8 char ale booking id dacă {"{LINK}"} nu merge</li>
        </ul>
        <p className="dash-subtle">
          Diacriticele sunt eliminate automat. Textul e clip-uit la max_chars (default 160).
        </p>
      </div>

      <Link href="/dashboard/sms-templates/nou" className="dash-btn dash-btn--primary">
        + Adaugă template
      </Link>

      <SmsTemplatesClient
        templates={
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (templates ?? []) as any[]
        }
      />
    </div>
  )
}
