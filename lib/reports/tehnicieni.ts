// lib/reports/tehnicieni.ts
// Raport programări per tehnician + perioada — pentru fișe de pleacă pe teren.
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type TehnicianBookingRow = {
  bookingId: string
  publicRef: string
  status: string
  scheduledStart: string | null
  scheduledEnd: string | null
  preferredDate: string | null
  preferredTimeWindow: string | null
  serviceCategoryName: string | null
  serviceCategorySlug: string | null
  customerFullName: string
  customerPhone: string
  customerEmail: string | null
  address: string
  blockName: string | null
  apartment: string | null
  floor: string | null
  localitate: string | null
  judet: string | null
  notesCustomer: string | null
  notesInternal: string | null
  equipmentInfo: string | null   // ex: "Centrală termică Ariston Genus One 24, S/N XYZ"
}

export type TehnicianFilter = {
  technicianId?: string | null   // null = neasignate
  dateFrom?: string
  dateTo?: string
  statuses?: string[]            // default ['confirmed','scheduled','in_progress']
}

export async function fetchBookingsForTechnician(
  firmId: string,
  filter: TehnicianFilter,
): Promise<TehnicianBookingRow[]> {
  const admin = getServiceRoleSupabase()

  let query = admin
    .from("bookings")
    .select(
      "id, public_ref, status, scheduled_start, scheduled_end, preferred_date, preferred_time_window, " +
      "notes_customer, notes_internal, " +
      "service_categories(slug, nume), " +
      "customers(full_name, phone, email), " +
      "properties(address, block_name, apartment, floor, " +
      "  judete:judet_id(nume), localitati:localitate_id(nume)), " +
      "property_equipments:equipment_id(brand, model, serial_number, " +
      "  equipment_types(nume), firm_equipment_types(nume))",
    )
    .eq("firm_id", firmId)
    .order("scheduled_start", { ascending: true, nullsFirst: false })
    .order("preferred_date", { ascending: true, nullsFirst: false })
    .limit(500)

  if (filter.technicianId === null) {
    query = query.is("assigned_team_member_id", null)
  } else if (filter.technicianId) {
    query = query.eq("assigned_team_member_id", filter.technicianId)
  }

  const statuses = filter.statuses ?? ["confirmed", "scheduled", "in_progress"]
  if (statuses.length > 0) query = query.in("status", statuses)

  // Filter pe perioada (folosind scheduled_start sau preferred_date)
  if (filter.dateFrom || filter.dateTo) {
    // Compromis: filtrează pe scheduled_start dacă există, altfel preferred_date.
    // Pentru simplicitate, aplicăm filtrul pe scheduled_start; preferred_date e fallback la display.
    if (filter.dateFrom) {
      query = query.or(
        `scheduled_start.gte.${filter.dateFrom},and(scheduled_start.is.null,preferred_date.gte.${filter.dateFrom})`,
      )
    }
    if (filter.dateTo) {
      query = query.or(
        `scheduled_start.lte.${filter.dateTo}T23:59:59,and(scheduled_start.is.null,preferred_date.lte.${filter.dateTo})`,
      )
    }
  }

  const { data, error } = await query
  if (error) {
    console.error("[fetchBookingsForTechnician]", error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const take = <T>(v: any): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((b: any) => {
    const sc = take<{ slug: string; nume: string }>(b.service_categories)
    const c = take<{ full_name: string; phone: string; email: string | null }>(b.customers)
    const p = take<{
      address: string; block_name: string | null; apartment: string | null; floor: string | null
      judete: { nume: string } | null; localitati: { nume: string } | null
    }>(b.properties)
    const eq = take<{
      brand: string | null; model: string | null; serial_number: string | null
      equipment_types: { nume: string } | null; firm_equipment_types: { nume: string } | null
    }>(b.property_equipments)
    const eqType = eq?.equipment_types?.nume ?? eq?.firm_equipment_types?.nume ?? null
    const equipmentInfo = eqType
      ? [eqType, eq?.brand, eq?.model, eq?.serial_number ? `S/N ${eq.serial_number}` : null]
          .filter(Boolean)
          .join(" · ")
      : null

    return {
      bookingId: b.id,
      publicRef: b.public_ref,
      status: b.status,
      scheduledStart: b.scheduled_start ?? null,
      scheduledEnd: b.scheduled_end ?? null,
      preferredDate: b.preferred_date ?? null,
      preferredTimeWindow: b.preferred_time_window ?? null,
      serviceCategoryName: sc?.nume ?? null,
      serviceCategorySlug: sc?.slug ?? null,
      customerFullName: c?.full_name ?? "",
      customerPhone: c?.phone ?? "",
      customerEmail: c?.email ?? null,
      address: p?.address ?? "",
      blockName: p?.block_name ?? null,
      apartment: p?.apartment ?? null,
      floor: p?.floor ?? null,
      localitate: p?.localitati?.nume ?? null,
      judet: p?.judete?.nume ?? null,
      notesCustomer: b.notes_customer ?? null,
      notesInternal: b.notes_internal ?? null,
      equipmentInfo,
    }
  })
}
