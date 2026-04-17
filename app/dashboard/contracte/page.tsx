// app/dashboard/contracte/page.tsx
// Listă contracte firmă + creare/editare/schimbare status.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import ContracteClient from "./ContracteClient"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/contracte")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Contracte</h1>
        <p className="dash-note">
          Doar firmele pot gestiona contracte.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const admin = getServiceRoleSupabase()

  const [contractsRes, custRes, propRes, equipRes, contractEquipRes, judeteRes] = await Promise.all([
    admin
      .from("contracts")
      .select("id, contract_number, customer_id, property_id, period_type, " +
              "start_date, expiry_date, monthly_fee, total_amount, status, notes, " +
              "signed_at, cancelled_at, created_at")
      .eq("firm_id", firmId)
      .order("created_at", { ascending: false }),
    admin
      .from("customers")
      .select("id, full_name, first_name, last_name, company_name, customer_type, phone, email"),
    admin
      .from("properties")
      .select("id, customer_id, address, judete:judet_id(nume), localitati:localitate_id(nume)"),
    admin
      .from("property_equipments")
      .select("id, property_id, brand, model, serial_number, is_active")
      .eq("is_active", true),
    admin
      .from("contract_equipments")
      .select("contract_id, equipment_id"),
    admin.from("judete").select("id, nume").order("nume"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contracts = (contractsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = (custRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = (propRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipments = (equipRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractEquip = (contractEquipRes.data ?? []) as any[]

  const contractEquipMap = new Map<string, string[]>()
  for (const ce of contractEquip) {
    const arr = contractEquipMap.get(ce.contract_id) ?? []
    arr.push(ce.equipment_id)
    contractEquipMap.set(ce.contract_id, arr)
  }
  for (const c of contracts) {
    c._equipment_ids = contractEquipMap.get(c.id) ?? []
  }

  // Filtrare clienți/proprietăți — doar cei asociați firmei (prin bookings sau contracte existente)
  const { data: bks } = await admin
    .from("bookings")
    .select("customer_id, property_id")
    .eq("firm_id", firmId)

  const firmCustomerIds = new Set([
    ...(bks ?? []).map((b) => b.customer_id as string),
    ...contracts.map((c) => c.customer_id as string),
  ])
  const firmPropertyIds = new Set([
    ...(bks ?? []).map((b) => b.property_id as string),
    ...contracts.map((c) => c.property_id as string).filter(Boolean),
  ])

  const filteredCustomers = customers.filter((c) => firmCustomerIds.has(c.id))
  const filteredProperties = properties.filter((p) => firmPropertyIds.has(p.id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const judete = (judeteRes.data ?? []) as any[]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Contracte</h1>
      <p className="dash-subtle">
        Contracte de verificare (2 ani) sau revizie (10 ani) cu clienții. Tracking scadență,
        status activ/expirat/reziliat.
      </p>

      <ContracteClient
        contracts={contracts}
        customers={filteredCustomers}
        properties={filteredProperties}
        equipments={equipments}
        judete={judete}
      />
    </div>
  )
}
