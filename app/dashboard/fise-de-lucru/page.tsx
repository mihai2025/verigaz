// app/dashboard/fise-de-lucru/page.tsx
// Fișe de lucru per tehnician (evidență intervenții).
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import FiseClient from "./FiseClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/fise-de-lucru")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Fișe de lucru</h1>
        <p className="dash-note">
          Doar firmele pot gestiona fișele de lucru.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const admin = getServiceRoleSupabase()

  const [wsRes, contractsRes, techRes, propRes, custRes, equipRes, wsEquipRes] = await Promise.all([
    admin
      .from("work_sheets")
      .select("id, contract_id, booking_id, property_id, technician_id, work_date, " +
              "start_time, end_time, duration_minutes, tasks_done, materials_used, " +
              "observations, signed_by_customer, status, work_type, created_at")
      .eq("firm_id", firmId)
      .order("work_date", { ascending: false })
      .limit(500),
    admin
      .from("contracts")
      .select("id, contract_number, customer_id, property_id")
      .eq("firm_id", firmId)
      .in("status", ["activ", "suspendat"]),
    admin
      .from("firm_employees")
      .select("id, full_name, role, is_active")
      .eq("firm_id", firmId)
      .eq("is_active", true),
    admin
      .from("properties")
      .select("id, customer_id, address, judete:judet_id(nume), localitati:localitate_id(nume)"),
    admin
      .from("customers")
      .select("id, full_name, first_name, last_name, company_name, customer_type, phone"),
    admin
      .from("property_equipments")
      .select("id, property_id, brand, model, serial_number, is_active")
      .eq("is_active", true),
    admin
      .from("work_sheet_equipments")
      .select("work_sheet_id, equipment_id"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets = (wsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contracts = (contractsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const technicians = (techRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = (propRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (custRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipments = (equipRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsEquipments = (wsEquipRes.data ?? []) as any[]

  // Grupare echipamente pe fișă
  const sheetEquipMap = new Map<string, string[]>()
  for (const we of wsEquipments) {
    const arr = sheetEquipMap.get(we.work_sheet_id) ?? []
    arr.push(we.equipment_id)
    sheetEquipMap.set(we.work_sheet_id, arr)
  }
  for (const s of sheets) {
    s._equipment_ids = sheetEquipMap.get(s.id) ?? []
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">Fișe de lucru</h1>
      <p className="dash-subtle">
        Evidența intervențiilor tehnicienilor pe contracte sau programări. Export zilnic,
        semnătură client, materiale consumate.
      </p>

      <FiseClient
        sheets={sheets}
        contracts={contracts}
        technicians={technicians}
        properties={properties}
        customers={customers}
        equipments={equipments}
      />
    </div>
  )
}
