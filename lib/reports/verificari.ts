// lib/reports/verificari.ts
// Raport verificări — certificate de verificare gaz (2 ani) + VTP centrală termică.
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type VerificareRow = {
  documentId: string
  documentNumber: string
  documentType: string              // certificat_verificare | fisa_tehnica_centrala
  issuedAt: string
  validUntil: string | null
  revokedAt: string | null
  signedStatus: string
  fileUrl: string | null

  // Echipament (dacă booking.equipment_id e setat)
  equipmentTypeName: string | null  // ex: "Centrală termică"
  equipmentBrand: string | null     // ex: "Ariston"
  equipmentModel: string | null     // ex: "Genus One 24"
  equipmentSerial: string | null
  equipmentInstallDate: string | null
  equipmentManufactureDate: string | null
  equipmentObservations: string | null

  // Adresă
  address: string
  blockName: string | null
  stair: string | null
  floor: string | null
  apartment: string | null
  localitate: string | null
  judet: string | null

  // Client
  customerFullName: string
  customerPhone: string
  customerEmail: string | null

  technician: string | null
  observations: string | null
  bookingRef: string | null
}

export type VerificariFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  dateMode?: "issued" | "expires"
  activeOnly?: boolean
  docType?: "all" | "gaz" | "centrala"   // gaz → certificat_verificare, centrala → fisa_tehnica_centrala
}

const DOC_TYPES_BY_FILTER: Record<"all" | "gaz" | "centrala", string[]> = {
  all: ["certificat_verificare", "fisa_tehnica_centrala", "certificat_conformitate"],
  gaz: ["certificat_verificare"],
  centrala: ["fisa_tehnica_centrala"],
}

export async function fetchVerificariForFirm(
  firmId: string,
  filters: VerificariFilters = {},
): Promise<VerificareRow[]> {
  const admin = getServiceRoleSupabase()

  const docTypes = DOC_TYPES_BY_FILTER[filters.docType ?? "all"]

  let query = admin
    .from("documents")
    .select(
      "id, document_number, document_type, issued_at, valid_until, revoked_at, " +
      "signed_status, file_url, meta, " +
      "bookings(public_ref, notes_internal, equipment_id, " +
      "  firm_employees:assigned_team_member_id(full_name), " +
      "  property_equipments:equipment_id(" +
      "    brand, model, serial_number, installation_date, manufacture_date, observations, " +
      "    equipment_types(nume), firm_equipment_types(nume)" +
      "  )), " +
      "customers(full_name, phone, email), " +
      "properties(address, block_name, stair, floor, apartment, " +
      "  judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("firm_id", firmId)
    .in("document_type", docTypes)
    .order("issued_at", { ascending: false })

  if (filters.activeOnly) query = query.is("revoked_at", null)
  if (filters.dateMode === "expires") {
    if (filters.dateFrom) query = query.gte("valid_until", filters.dateFrom)
    if (filters.dateTo) query = query.lte("valid_until", filters.dateTo)
  } else {
    if (filters.dateFrom) query = query.gte("issued_at", filters.dateFrom)
    if (filters.dateTo) query = query.lte("issued_at", filters.dateTo)
  }

  const { data, error } = await query
  if (error) {
    console.error("[fetchVerificariForFirm]", error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const take = <T>(v: any): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: VerificareRow[] = (data ?? []).map((d: any) => {
    const b = take<{
      public_ref: string | null; notes_internal: string | null
      firm_employees: { full_name: string } | null
      property_equipments: {
        brand: string | null; model: string | null; serial_number: string | null
        installation_date: string | null; manufacture_date: string | null
        observations: string | null
        equipment_types: { nume: string } | null
        firm_equipment_types: { nume: string } | null
      } | null
    }>(d.bookings)
    const c = take<{ full_name: string; phone: string; email: string | null }>(d.customers)
    const p = take<{
      address: string; block_name: string | null; stair: string | null; floor: string | null
      apartment: string | null; judete: { nume: string } | null; localitati: { nume: string } | null
    }>(d.properties)

    const eq = b?.property_equipments ?? null
    const eqType = eq?.equipment_types?.nume ?? eq?.firm_equipment_types?.nume ?? null

    return {
      documentId: d.id,
      documentNumber: d.document_number,
      documentType: d.document_type,
      issuedAt: d.issued_at,
      validUntil: d.valid_until ?? null,
      revokedAt: d.revoked_at ?? null,
      signedStatus: d.signed_status ?? "unsigned",
      fileUrl: d.file_url ?? null,

      equipmentTypeName: eqType,
      equipmentBrand: eq?.brand ?? null,
      equipmentModel: eq?.model ?? null,
      equipmentSerial: eq?.serial_number ?? null,
      equipmentInstallDate: eq?.installation_date ?? null,
      equipmentManufactureDate: eq?.manufacture_date ?? null,
      equipmentObservations: eq?.observations ?? null,

      address: p?.address ?? "",
      blockName: p?.block_name ?? null,
      stair: p?.stair ?? null,
      floor: p?.floor ?? null,
      apartment: p?.apartment ?? null,
      localitate: p?.localitati?.nume ?? null,
      judet: p?.judete?.nume ?? null,

      customerFullName: c?.full_name ?? "",
      customerPhone: c?.phone ?? "",
      customerEmail: c?.email ?? null,

      technician: b?.firm_employees?.full_name ?? null,
      observations: b?.notes_internal ?? null,
      bookingRef: b?.public_ref ?? null,
    }
  })

  if (filters.search) {
    const q = filters.search.toLowerCase()
    rows = rows.filter((r) => {
      const hay = [
        r.documentNumber, r.equipmentTypeName, r.equipmentBrand, r.equipmentModel, r.equipmentSerial,
        r.address, r.blockName, r.stair, r.floor, r.apartment, r.localitate, r.judet,
        r.customerFullName, r.customerPhone, r.customerEmail,
        r.technician, r.observations, r.bookingRef,
      ].filter(Boolean).join(" ").toLowerCase()
      return hay.includes(q)
    })
  }

  return rows
}
