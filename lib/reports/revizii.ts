// lib/reports/revizii.ts
// Query + shaping pentru raportul de revizii (proces verbal, cadenţă 10 ani).
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type ReviziaRow = {
  documentId: string
  documentNumber: string
  issuedAt: string                  // data documentului = data reviziei
  validUntil: string | null         // expiră la
  revokedAt: string | null
  revokedReason: string | null
  signedStatus: string
  fileUrl: string | null

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

  // Tehnician + observații
  technician: string | null
  observations: string | null
  bookingRef: string | null

  // Instalare rețea (de la property sau equipment)
  retea_installation_date: string | null
}

export type ReviziiFilters = {
  search?: string                 // text în document, adresă, nume, telefon, observații
  dateFrom?: string               // ISO date
  dateTo?: string
  dateMode?: "issued" | "expires" // ce coloană filtrăm pe perioadă
  activeOnly?: boolean            // exclude revocate
}

export async function fetchReviziiForFirm(
  firmId: string,
  filters: ReviziiFilters = {},
): Promise<ReviziaRow[]> {
  const admin = getServiceRoleSupabase()

  let query = admin
    .from("documents")
    .select(
      "id, document_number, issued_at, valid_until, revoked_at, revoked_reason, " +
      "signed_status, file_url, meta, " +
      "bookings(public_ref, notes_internal, " +
      "  assigned_team_member_id, firm_employees:assigned_team_member_id(full_name)), " +
      "customers(full_name, phone, email), " +
      "properties(address, block_name, stair, floor, apartment, " +
      "  last_revizie_at, " +
      "  judete:judet_id(nume), localitati:localitate_id(nume))",
    )
    .eq("firm_id", firmId)
    .eq("document_type", "proces_verbal_revizie")
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
    console.error("[fetchReviziiForFirm]", error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const take = <T>(v: any): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

  let rows: ReviziaRow[] = raw.map((d) => {
    const b = take<{ public_ref: string | null; notes_internal: string | null; firm_employees: { full_name: string } | null }>(d.bookings)
    const c = take<{ full_name: string; phone: string; email: string | null }>(d.customers)
    const p = take<{
      address: string; block_name: string | null; stair: string | null; floor: string | null
      apartment: string | null; last_revizie_at: string | null
      judete: { nume: string } | null; localitati: { nume: string } | null
    }>(d.properties)
    const tech = b?.firm_employees?.full_name ?? null

    return {
      documentId: d.id as string,
      documentNumber: d.document_number as string,
      issuedAt: d.issued_at as string,
      validUntil: (d.valid_until as string | null) ?? null,
      revokedAt: (d.revoked_at as string | null) ?? null,
      revokedReason: (d.revoked_reason as string | null) ?? null,
      signedStatus: (d.signed_status as string) ?? "unsigned",
      fileUrl: (d.file_url as string | null) ?? null,

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

      technician: tech,
      observations: b?.notes_internal ?? null,
      bookingRef: b?.public_ref ?? null,

      retea_installation_date: p?.last_revizie_at ?? null,
    }
  })

  // Search in-memory (peste toate câmpurile relevante)
  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    rows = rows.filter((r) => {
      const hay = [
        r.documentNumber, r.address, r.blockName, r.stair, r.floor, r.apartment,
        r.localitate, r.judet, r.customerFullName, r.customerPhone,
        r.customerEmail, r.technician, r.observations, r.bookingRef,
      ].filter(Boolean).join(" ").toLowerCase()
      return hay.includes(q)
    })
  }

  return rows
}
