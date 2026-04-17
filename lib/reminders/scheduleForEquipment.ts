// lib/reminders/scheduleForEquipment.ts
//
// Scanare zilnică: găsește property_equipments cu next_verificare_due /
// next_revizie_due în fereastra X zile și creează reminders dacă nu există.
// Deduplicare via reminders(equipment_id, reminder_type, advance_days, status=queued).

import { getServiceRoleSupabase } from "@/lib/supabase/server"

const ADVANCE_DAYS = [60, 30, 7] as const

type EquipmentDue = {
  equipment_id: string
  property_id: string
  customer_id: string | null
  firm_id: string | null
  equipment_label: string | null
  due_date: string          // ISO date YYYY-MM-DD
  kind: "verificare" | "revizie"
  reminder_type: "verificare_24m" | "revizie_120m" | "iscir_centrala" | "service_detector_12m"
}

type Result = {
  scanned: number
  created: number
  skipped: number
  errors: string[]
}

function daysFromNow(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

// Mapping din equipment_types.slug la reminder_type pentru verificare/revizie
function reminderTypeFor(kind: "verificare" | "revizie", slug: string | null): EquipmentDue["reminder_type"] {
  // Centrala termică → iscir_centrala pentru ambele kind
  if (slug === "centrala-termica" || slug === "centrala") return "iscir_centrala"
  // Detector → service anual
  if (slug === "detector-gaz" || slug === "detector") return "service_detector_12m"
  // Instalație sau altele → verificare_24m / revizie_120m
  return kind === "verificare" ? "verificare_24m" : "revizie_120m"
}

export async function scheduleEquipmentReminders(opts?: { dryRun?: boolean }): Promise<Result> {
  const dryRun = opts?.dryRun ?? false
  const admin = getServiceRoleSupabase()
  const result: Result = { scanned: 0, created: 0, skipped: 0, errors: [] }

  // Maxima fereastră: verificăm echipamente cu scadență în următoarele 65 zile
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 65)
  const maxDateIso = maxDate.toISOString().slice(0, 10)

  // 1. Scanăm property_equipments cu scadență verificare apropiată
  const { data: verifRows, error: verifErr } = await admin
    .from("property_equipments")
    .select("id, property_id, next_verificare_due, brand, model, " +
            "equipment_types:equipment_type_id(slug, nume), " +
            "firm_equipment_types:firm_equipment_type_id(nume, service_category_slug), " +
            "properties:property_id(customer_id)")
    .eq("is_active", true)
    .not("next_verificare_due", "is", null)
    .lte("next_verificare_due", maxDateIso)

  // 2. Scanăm property_equipments cu scadență revizie apropiată
  const { data: revRows, error: revErr } = await admin
    .from("property_equipments")
    .select("id, property_id, next_revizie_due, brand, model, " +
            "equipment_types:equipment_type_id(slug, nume), " +
            "firm_equipment_types:firm_equipment_type_id(nume, service_category_slug), " +
            "properties:property_id(customer_id)")
    .eq("is_active", true)
    .not("next_revizie_due", "is", null)
    .lte("next_revizie_due", maxDateIso)

  if (verifErr) result.errors.push(`verif fetch: ${verifErr.message}`)
  if (revErr) result.errors.push(`rev fetch: ${revErr.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifList = ((verifRows ?? []) as any[]).map((r): EquipmentDue => {
    const eqType = Array.isArray(r.equipment_types) ? r.equipment_types[0] : r.equipment_types
    const prop = Array.isArray(r.properties) ? r.properties[0] : r.properties
    return {
      equipment_id: r.id,
      property_id: r.property_id,
      customer_id: prop?.customer_id ?? null,
      firm_id: null,
      equipment_label: eqType?.nume ?? null,
      due_date: r.next_verificare_due,
      kind: "verificare",
      reminder_type: reminderTypeFor("verificare", eqType?.slug ?? null),
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revList = ((revRows ?? []) as any[]).map((r): EquipmentDue => {
    const eqType = Array.isArray(r.equipment_types) ? r.equipment_types[0] : r.equipment_types
    const prop = Array.isArray(r.properties) ? r.properties[0] : r.properties
    return {
      equipment_id: r.id,
      property_id: r.property_id,
      customer_id: prop?.customer_id ?? null,
      firm_id: null,
      equipment_label: eqType?.nume ?? null,
      due_date: r.next_revizie_due,
      kind: "revizie",
      reminder_type: reminderTypeFor("revizie", eqType?.slug ?? null),
    }
  })

  const allDue = [...verifList, ...revList]
  result.scanned = allDue.length
  if (allDue.length === 0) return result

  // 3. Determină firm_id pentru fiecare echipament: ia ultima firmă care a avut booking
  //    pe acea property (aceeași logică ca rapoartele existente).
  const propertyIds = [...new Set(allDue.map((e) => e.property_id))]
  const { data: bookings } = await admin
    .from("bookings")
    .select("property_id, firm_id, completed_at, created_at")
    .in("property_id", propertyIds)
    .not("firm_id", "is", null)
    .order("completed_at", { ascending: false, nullsFirst: false })

  const firmByProperty = new Map<string, string>()
  for (const b of bookings ?? []) {
    if (!firmByProperty.has(b.property_id as string)) {
      firmByProperty.set(b.property_id as string, b.firm_id as string)
    }
  }
  for (const d of allDue) {
    d.firm_id = firmByProperty.get(d.property_id) ?? null
  }

  // 4. Deduplicare: caută reminders existente queued cu același (equipment_id, reminder_type, advance_days)
  const equipmentIds = allDue.map((e) => e.equipment_id)
  const { data: existing } = await admin
    .from("reminders")
    .select("equipment_id, reminder_type, advance_days, status")
    .in("equipment_id", equipmentIds)
    .eq("status", "queued")

  const existingKey = new Set(
    (existing ?? []).map((r) => `${r.equipment_id}|${r.reminder_type}|${r.advance_days}`),
  )

  const now = new Date()
  const inserts: Record<string, unknown>[] = []

  for (const d of allDue) {
    // Skip dacă nu avem firmă asociată — nu știm cine e destinatarul SMS-ului
    if (!d.firm_id) {
      result.skipped++
      continue
    }

    for (const advance of ADVANCE_DAYS) {
      const key = `${d.equipment_id}|${d.reminder_type}|${advance}`
      if (existingKey.has(key)) {
        result.skipped++
        continue
      }

      const due = new Date(d.due_date)
      const scheduled = new Date(due)
      scheduled.setDate(scheduled.getDate() - advance)

      // Skip dacă scadența a trecut cu mai mult de 7 zile
      const daysToDue = daysFromNow(d.due_date)
      if (daysToDue < -7) {
        result.skipped++
        continue
      }
      // Dacă scheduled e în trecut dar scadența încă nu a trecut (mult), plecăm acum
      if (scheduled.getTime() < now.getTime()) {
        scheduled.setTime(now.getTime())
      }

      inserts.push({
        equipment_id: d.equipment_id,
        property_id: d.property_id,
        customer_id: d.customer_id,
        firm_id: d.firm_id,
        reminder_type: d.reminder_type,
        channel: "sms",
        status: "queued",
        scheduled_for: scheduled.toISOString(),
        advance_days: advance,
      })
    }
  }

  if (inserts.length === 0) return result
  if (dryRun) {
    result.created = inserts.length
    return result
  }

  const { error: insErr, data: insData } = await admin
    .from("reminders")
    .insert(inserts)
    .select("id")
  if (insErr) {
    result.errors.push(`insert: ${insErr.message}`)
    return result
  }
  result.created = insData?.length ?? 0
  return result
}
