// lib/reminders/schedule.ts
//
// Helper pentru planificarea reminder-ului când o programare e finalizată.
// Regula legală ANRE Ord. 179/2015: verificare la 24 luni, revizie la 120 luni.
// Pentru centrală: convenție — verificare/revizie anuală (12 luni).
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type ReminderType =
  | "verificare_24m"
  | "revizie_120m"
  | "service_detector_12m"
  | "contract_service"
  | "iscir_centrala"

const CATEGORY_TO_REMINDER: Record<string, { type: ReminderType; months: number }> = {
  "verificare-instalatie": { type: "verificare_24m",        months: 24 },
  "revizie-instalatie":    { type: "revizie_120m",          months: 120 },
  "service-detector":      { type: "service_detector_12m",  months: 12 },
  "verificare-centrala":   { type: "iscir_centrala",        months: 12 },
  "revizie-centrala":      { type: "iscir_centrala",        months: 12 },
}

/**
 * Planifică un reminder pentru următoarea scadență pe baza serviciului finalizat.
 * Idempotent: dacă există deja un reminder activ pentru aceeași (property, type),
 * nu creează unul nou — doar returnează.
 */
export async function scheduleReminderForBooking(bookingId: string): Promise<
  { ok: true; reminderId: string | null; reason?: string } | { ok: false; error: string }
> {
  const admin = getServiceRoleSupabase()

  const { data: b, error } = await admin
    .from("bookings")
    .select(
      "id, customer_id, property_id, firm_id, service_category_id, completed_at, " +
      "service_categories(slug)",
    )
    .eq("id", bookingId)
    .maybeSingle()
  if (error || !b) return { ok: false, error: error?.message ?? "Booking negăsit." }
  if (!b.completed_at) return { ok: false, error: "Programarea nu e finalizată." }

  const sc = Array.isArray(b.service_categories) ? b.service_categories[0] : b.service_categories
  const slug = sc?.slug as string | undefined
  if (!slug) return { ok: true, reminderId: null, reason: "Categorie necunoscută." }

  const rule = CATEGORY_TO_REMINDER[slug]
  if (!rule) return { ok: true, reminderId: null, reason: "Categorie fără reminder." }

  // Calculează scadența: completed_at + months
  const completedAt = new Date(b.completed_at as string)
  const due = new Date(completedAt)
  due.setMonth(due.getMonth() + rule.months)

  // Advance days din setarea firmei (fallback 7 dacă nu e setat)
  const { data: firmRow } = await admin
    .from("gas_firms")
    .select("reminder_advance_days")
    .eq("id", b.firm_id)
    .maybeSingle()
  const advanceDays = (firmRow?.reminder_advance_days as number | undefined) ?? 7

  // Trimitem reminder-ul cu advanceDays înainte de scadență
  const scheduledFor = new Date(due)
  scheduledFor.setDate(scheduledFor.getDate() - advanceDays)

  // Marchează reminder-ele active vechi pe (property, type) ca "converted"
  // — verificarea nouă a ajuns la termen, bulina verde dispare din rapoarte.
  await admin
    .from("reminders")
    .update({
      status: "converted",
      response_at: new Date().toISOString(),
      response_booking_id: b.id,
    })
    .eq("property_id", b.property_id)
    .eq("reminder_type", rule.type)
    .in("status", ["queued", "sent"])

  const { data: inserted, error: insertErr } = await admin
    .from("reminders")
    .insert({
      customer_id: b.customer_id,
      property_id: b.property_id,
      related_booking_id: b.id,
      firm_id: b.firm_id,
      reminder_type: rule.type,
      scheduled_for: scheduledFor.toISOString(),
      advance_days: advanceDays,
      channel: "sms",
      status: "queued",
    })
    .select("id")
    .single()
  if (insertErr || !inserted) return { ok: false, error: insertErr?.message ?? "Eroare reminder." }

  // Actualizează property.next_verificare_due / next_revizie_due unde e cazul
  const propertyPatch: Record<string, unknown> = {}
  if (rule.type === "verificare_24m") {
    propertyPatch.last_verificare_at = completedAt.toISOString().slice(0, 10)
    propertyPatch.next_verificare_due = due.toISOString().slice(0, 10)
  } else if (rule.type === "revizie_120m") {
    propertyPatch.last_revizie_at = completedAt.toISOString().slice(0, 10)
    propertyPatch.next_revizie_due = due.toISOString().slice(0, 10)
  }
  if (Object.keys(propertyPatch).length > 0) {
    await admin.from("properties").update(propertyPatch).eq("id", b.property_id)
  }

  return { ok: true, reminderId: inserted.id as string }
}
