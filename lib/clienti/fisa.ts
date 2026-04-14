// lib/clienti/fisa.ts
// Încarcă tot datele pentru fișa unui client vizualizată de firmă.
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { getFirmEquipmentCatalog, type EquipmentType } from "@/lib/equipment/catalog"

export type FisaClient = {
  customer: {
    id: string
    customer_type: string
    full_name: string
    first_name: string | null
    last_name: string | null
    company_name: string | null
    phone: string
    email: string | null
    cnp: string | null
    cui: string | null
    association_name: string | null
  }
  properties: Array<{
    id: string
    address: string
    block_name: string | null
    stair: string | null
    floor: string | null
    apartment: string | null
    property_type: string
    localitate: string | null
    judet: string | null
    equipments: Array<{
      id: string
      typeLabel: string
      brand: string | null
      model: string | null
      serial_number: string | null
      manufacture_date: string | null
      installation_date: string | null
      last_verificare_at: string | null
      next_verificare_due: string | null
      last_revizie_at: string | null
      next_revizie_due: string | null
      observations: string | null
      is_active: boolean
      defaultVerificareMonths: number | null
      defaultRevizieMonths: number | null
      documents: Array<{
        id: string
        document_type: string
        document_number: string
        issued_at: string
        valid_until: string | null
        revoked_at: string | null
        file_url: string | null
        technician: string | null
      }>
    }>
  }>
  firm: {
    id: string
    brand_name: string | null
    legal_name: string
    cui: string | null
    anre_authorization_no: string | null
    anre_category: string | null
    phone: string | null
    email: string | null
    website: string | null
    sediu_adresa: string | null
    logo_url: string | null
  }
}

export async function loadFisaClient(
  firmId: string,
  customerId: string,
): Promise<FisaClient | null> {
  const admin = getServiceRoleSupabase()

  // Verifică că firma are cel puțin un booking cu acest customer (autorizare)
  const { data: bk } = await admin
    .from("bookings")
    .select("id")
    .eq("firm_id", firmId)
    .eq("customer_id", customerId)
    .limit(1)
    .maybeSingle()
  if (!bk) return null

  const [custRes, firmRes, propRes, catalog] = await Promise.all([
    admin
      .from("customers")
      .select("id, customer_type, full_name, first_name, last_name, company_name, phone, email, cnp, cui, association_name")
      .eq("id", customerId)
      .maybeSingle(),
    admin
      .from("gas_firms")
      .select("id, brand_name, legal_name, cui, anre_authorization_no, anre_category, phone, email, website, sediu_adresa, logo_url")
      .eq("id", firmId)
      .maybeSingle(),
    admin
      .from("properties")
      .select(
        "id, address, block_name, stair, floor, apartment, property_type, " +
        "judete:judet_id(nume), localitati:localitate_id(nume)",
      )
      .eq("customer_id", customerId),
    getFirmEquipmentCatalog(firmId),
  ])

  if (!custRes.data || !firmRes.data) return null

  const propertyIds = (propRes.data ?? []).map((p) => p.id as string)
  if (propertyIds.length === 0) {
    return {
      customer: custRes.data as FisaClient["customer"],
      firm: firmRes.data as FisaClient["firm"],
      properties: [],
    }
  }

  const [equipRes, docRes] = await Promise.all([
    admin
      .from("property_equipments")
      .select(
        "id, property_id, equipment_type_id, firm_equipment_type_id, brand, model, " +
        "serial_number, manufacture_date, installation_date, last_verificare_at, " +
        "next_verificare_due, last_revizie_at, next_revizie_due, observations, is_active",
      )
      .in("property_id", propertyIds)
      .order("created_at", { ascending: true }),
    admin
      .from("documents")
      .select(
        "id, property_id, document_type, document_number, issued_at, valid_until, revoked_at, file_url, " +
        "bookings(equipment_id, firm_employees:assigned_team_member_id(full_name))",
      )
      .eq("firm_id", firmId)
      .in("property_id", propertyIds)
      .order("issued_at", { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEquipments = (equipRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDocs = (docRes.data ?? []) as any[]

  // Helper: catalog lookup
  const labelOf = (eq: { equipment_type_id: number | null; firm_equipment_type_id: string | null }) => {
    const hit = eq.firm_equipment_type_id
      ? catalog.find((c) => c.firmEquipmentId === eq.firm_equipment_type_id)
      : catalog.find((c) => c.defaultEquipmentId === eq.equipment_type_id)
    return {
      label: hit?.nume ?? "—",
      verifMonths: hit?.verificare_months ?? null,
      revizieMonths: hit?.revizie_months ?? null,
    }
  }

  const properties: FisaClient["properties"] = (propRes.data ?? []).map((p) => {
    const myEquipments = allEquipments.filter((e) => e.property_id === p.id)
    return {
      id: p.id as string,
      address: p.address as string,
      block_name: (p.block_name as string | null) ?? null,
      stair: (p.stair as string | null) ?? null,
      floor: (p.floor as string | null) ?? null,
      apartment: (p.apartment as string | null) ?? null,
      property_type: p.property_type as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localitate: (p.localitati as any)?.nume ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      judet: (p.judete as any)?.nume ?? null,
      equipments: myEquipments.map((eq) => {
        const meta = labelOf(eq)
        // Documents legate de acest equipment specific
        const myDocs = allDocs
          .filter((d) => {
            const b = Array.isArray(d.bookings) ? d.bookings[0] : d.bookings
            return b?.equipment_id === eq.id
          })
          .map((d) => {
            const b = Array.isArray(d.bookings) ? d.bookings[0] : d.bookings
            const emp = Array.isArray(b?.firm_employees) ? b.firm_employees[0] : b?.firm_employees
            return {
              id: d.id as string,
              document_type: d.document_type as string,
              document_number: d.document_number as string,
              issued_at: d.issued_at as string,
              valid_until: (d.valid_until as string | null) ?? null,
              revoked_at: (d.revoked_at as string | null) ?? null,
              file_url: (d.file_url as string | null) ?? null,
              technician: (emp?.full_name as string | null) ?? null,
            }
          })

        return {
          id: eq.id as string,
          typeLabel: meta.label,
          brand: eq.brand ?? null,
          model: eq.model ?? null,
          serial_number: eq.serial_number ?? null,
          manufacture_date: eq.manufacture_date ?? null,
          installation_date: eq.installation_date ?? null,
          last_verificare_at: eq.last_verificare_at ?? null,
          next_verificare_due: eq.next_verificare_due ?? null,
          last_revizie_at: eq.last_revizie_at ?? null,
          next_revizie_due: eq.next_revizie_due ?? null,
          observations: eq.observations ?? null,
          is_active: eq.is_active !== false,
          defaultVerificareMonths: meta.verifMonths,
          defaultRevizieMonths: meta.revizieMonths,
          documents: myDocs,
        }
      }),
    }
  })

  return {
    customer: custRes.data as FisaClient["customer"],
    firm: firmRes.data as FisaClient["firm"],
    properties,
  }
}

export function computeNextDue(
  installIso: string | null,
  lastIso: string | null,
  months: number | null,
): string | null {
  if (!months) return null
  const base = lastIso ?? installIso
  if (!base) return null
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// Re-export for convenience
export type { EquipmentType }
