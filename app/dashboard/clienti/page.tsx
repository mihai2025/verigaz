// app/dashboard/clienti/page.tsx
// Clienți firmă + adrese + echipamente instalate, cu bulină status.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { getFirmEquipmentCatalog } from "@/lib/equipment/catalog"
import ClientiClient from "./ClientiClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/clienti")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Clienți</h1>
        <p className="dash-note">
          Doar firmele pot vedea lista de clienți.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const admin = getServiceRoleSupabase()

  // 1. Găsește customers asociați acestei firme (prin istorie bookings)
  const { data: bks } = await admin
    .from("bookings")
    .select("customer_id, property_id")
    .eq("firm_id", firmId)

  const customerIds = [...new Set((bks ?? []).map((b) => b.customer_id as string))]
  const propertyIds = [...new Set((bks ?? []).map((b) => b.property_id as string))]

  if (customerIds.length === 0) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Clienți</h1>
        <p className="dash-note">Nu ai încă clienți. Așteaptă prima programare.</p>
      </div>
    )
  }

  // 2. Încarcă customers + properties + equipments + reminders
  const [custRes, propRes, equipRes, remRes, catalog] = await Promise.all([
    admin
      .from("customers")
      .select("id, full_name, first_name, last_name, company_name, customer_type, phone, email, cnp, cui")
      .in("id", customerIds),
    admin
      .from("properties")
      .select("id, customer_id, address, block_name, apartment, floor, " +
              "judete:judet_id(nume), localitati:localitate_id(nume)")
      .in("id", propertyIds),
    admin
      .from("property_equipments")
      .select("id, property_id, equipment_type_id, firm_equipment_type_id, " +
              "brand, model, serial_number, manufacture_date, installation_date, " +
              "last_verificare_at, next_verificare_due, last_revizie_at, next_revizie_due, " +
              "observations, is_active")
      .in("property_id", propertyIds),
    admin
      .from("reminders")
      .select("id, equipment_id, property_id, reminder_type, status, scheduled_for, " +
              "sent_at, response_at, response_booking_id")
      .eq("firm_id", firmId)
      .in("property_id", propertyIds),
    getFirmEquipmentCatalog(firmId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (custRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = (propRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipments = (equipRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reminders = (remRes.data ?? []) as any[]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Clienți & echipamente</h1>
      <p className="dash-subtle">
        Toți clienții care au avut programare cu firma ta. Fiecare cu adresele și
        echipamentele instalate.
      </p>

      <ClientiClient
        customers={customers}
        properties={properties}
        equipments={equipments}
        reminders={reminders}
        catalog={catalog}
      />
    </div>
  )
}
