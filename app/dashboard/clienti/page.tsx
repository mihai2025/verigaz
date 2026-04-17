// app/dashboard/clienti/page.tsx
// Clienți firmă + adrese + echipamente instalate, cu bulină status.
export const dynamic = "force-dynamic"
export const revalidate = 0

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

  // 1. Clienții firmei — UNION: bookings + contracts + firm_customer_links
  const [bksRes, contractsRes, linksRes] = await Promise.all([
    admin.from("bookings").select("customer_id, property_id").eq("firm_id", firmId),
    admin.from("contracts").select("customer_id, property_id").eq("firm_id", firmId),
    admin.from("firm_customer_links").select("customer_id").eq("firm_id", firmId),
  ])

  const customerIds = [...new Set([
    ...((bksRes.data ?? []).map((b) => b.customer_id as string)),
    ...((contractsRes.data ?? []).map((c) => c.customer_id as string)),
    ...((linksRes.data ?? []).map((l) => l.customer_id as string)),
  ].filter(Boolean))]

  const propertyIdsFromBookings = [...new Set((bksRes.data ?? []).map((b) => b.property_id as string).filter(Boolean))]

  // Încarcă toate properties pentru acești clienți (batching pentru URL limit)
  let allPropertyIds = propertyIdsFromBookings
  if (customerIds.length > 0) {
    const allProps: Array<{ id: string }> = []
    const CHUNK = 200
    for (let i = 0; i < customerIds.length; i += CHUNK) {
      const slice = customerIds.slice(i, i + CHUNK)
      const { data } = await admin.from("properties").select("id").in("customer_id", slice)
      if (data) allProps.push(...(data as Array<{ id: string }>))
    }
    allPropertyIds = [...new Set([
      ...propertyIdsFromBookings,
      ...allProps.map((p) => p.id),
    ])]
  }
  const propertyIds = allPropertyIds

  // Pregătire județe + empty-state handled in ClientiClient (pentru buton nou)
  const { data: judeteData } = await admin.from("judete").select("id, nume").order("nume")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const judete = (judeteData ?? []) as any[]

  if (customerIds.length === 0) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Clienți & echipamente</h1>
        <p className="dash-subtle">
          Toți clienții firmei tale, cu adresele și echipamentele instalate.
        </p>
        <ClientiClient
          customers={[]}
          properties={[]}
          equipments={[]}
          reminders={[]}
          catalog={await getFirmEquipmentCatalog(firmId)}
          judete={judete}
        />
      </div>
    )
  }

  // 2. Încarcă customers + properties + equipments + reminders
  // IMPORTANT: .in() cu multe UUID-uri (>200) depășește limita URL PostgREST.
  // Batchuim în chunks de 200.
  async function fetchInChunks<T>(
    table: string, column: string, ids: string[], select: string,
    extraEq?: { col: string; val: string }
  ): Promise<T[]> {
    if (ids.length === 0) return []
    const CHUNK = 200
    const out: T[] = []
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK)
      let q = admin.from(table).select(select).in(column, slice)
      if (extraEq) q = q.eq(extraEq.col, extraEq.val)
      const { data, error } = await q
      if (error) throw new Error(`fetchInChunks(${table}): ${error.message}`)
      if (data) out.push(...(data as T[]))
    }
    return out
  }

  const [customers, properties, equipments, reminders, catalog] = await Promise.all([
    fetchInChunks(
      "customers", "id", customerIds,
      "id, full_name, first_name, last_name, company_name, customer_type, phone, email, cnp, cui",
    ),
    fetchInChunks(
      "properties", "id", propertyIds,
      "id, customer_id, address, block_name, apartment, floor, " +
      "judete:judet_id(nume), localitati:localitate_id(nume)",
    ),
    fetchInChunks(
      "property_equipments", "property_id", propertyIds,
      "id, property_id, equipment_type_id, firm_equipment_type_id, " +
      "brand, model, serial_number, manufacture_date, installation_date, " +
      "last_verificare_at, next_verificare_due, last_revizie_at, next_revizie_due, " +
      "observations, is_active",
    ),
    fetchInChunks(
      "reminders", "property_id", propertyIds,
      "id, equipment_id, property_id, reminder_type, status, scheduled_for, " +
      "sent_at, response_at, response_booking_id",
      { col: "firm_id", val: firmId },
    ),
    getFirmEquipmentCatalog(firmId),
  ])

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
        judete={judete}
      />
    </div>
  )
}
