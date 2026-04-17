// lib/reminders/scheduleForContract.ts
//
// Creează reminders automate pentru contractele care expiră în curând.
// Triple trigger: 60, 30, 7 zile înainte de expiry_date.
// Deduplicare via unique index pe (contract_id, advance_days) where status='queued'.
// La advance=7, creează și un booking pending de reînnoire (dacă nu există deja).

import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { generatePublicRef } from "@/lib/bookings/publicRef"

const ADVANCE_DAYS = [60, 30, 7] as const

// Mapping period_type → service_category slug pentru booking-urile de reînnoire
const PERIOD_TO_CATEGORY: Record<string, string> = {
  "2_ani": "verificare-instalatie",
  "10_ani": "revizie-instalatie",
}

type Result = {
  scanned: number
  created: number
  skipped: number
  renewalBookings: number
  errors: string[]
}

function daysFromNow(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export async function scheduleContractReminders(opts?: { dryRun?: boolean }): Promise<Result> {
  const dryRun = opts?.dryRun ?? false
  const admin = getServiceRoleSupabase()
  const result: Result = { scanned: 0, created: 0, skipped: 0, renewalBookings: 0, errors: [] }

  // Ia toate contractele active care expiră în următoarele 65 zile
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 65)

  const { data: contracts, error } = await admin
    .from("contracts")
    .select("id, firm_id, customer_id, property_id, contract_number, expiry_date, period_type")
    .eq("status", "activ")
    .lte("expiry_date", maxDate.toISOString().slice(0, 10))

  if (error) {
    result.errors.push(`fetch contracts: ${error.message}`)
    return result
  }

  if (!contracts || contracts.length === 0) return result
  result.scanned = contracts.length

  // Ia reminders existente queued per contract (pentru deduplicare)
  const contractIds = contracts.map((c) => c.id as string)
  const { data: existing } = await admin
    .from("reminders")
    .select("contract_id, advance_days, status")
    .in("contract_id", contractIds)
    .eq("status", "queued")

  const existingKey = new Set(
    (existing ?? []).map((r) => `${r.contract_id}|${r.advance_days}`),
  )

  const now = new Date()
  const inserts: Record<string, unknown>[] = []

  for (const c of contracts) {
    const expiry = new Date(c.expiry_date as string)
    const daysToExpiry = daysFromNow(c.expiry_date as string)

    for (const advance of ADVANCE_DAYS) {
      const key = `${c.id}|${advance}`
      if (existingKey.has(key)) {
        result.skipped++
        continue
      }

      // scheduled_for = expiry_date - advance zile
      const scheduled = new Date(expiry)
      scheduled.setDate(scheduled.getDate() - advance)

      // Dacă deja ar fi trebuit trimis (scheduled < now), setează scheduled = now
      // (ca să plece la următoarea trecere de cron, dar doar dacă expiry e încă în viitor
      // sau în ultimele 7 zile)
      const scheduledMs = scheduled.getTime()
      if (scheduledMs < now.getTime()) {
        // Dacă a depășit expiry, sari — nu are sens reminder după expirare
        if (daysToExpiry < -7) {
          result.skipped++
          continue
        }
        scheduled.setTime(now.getTime())
      }

      inserts.push({
        contract_id: c.id,
        firm_id: c.firm_id,
        customer_id: c.customer_id,
        property_id: c.property_id,
        reminder_type: "contract_service",
        channel: "sms",
        status: "queued",
        scheduled_for: scheduled.toISOString(),
        advance_days: advance,
      })
    }
  }

  if (inserts.length === 0) {
    // Totuși verificăm creare booking pentru contractele aproape de expirare
    if (!dryRun) {
      await createRenewalBookings(admin, contracts, result)
    }
    return result
  }

  if (dryRun) {
    result.created = inserts.length
    return result
  }

  // Insert reminders în batch
  const { error: insErr, data: insData } = await admin
    .from("reminders")
    .insert(inserts)
    .select("id")

  if (insErr) {
    result.errors.push(`insert reminders: ${insErr.message}`)
    return result
  }

  result.created = insData?.length ?? 0

  // Creează booking-uri pentru contractele care au primit reminder la advance=7
  await createRenewalBookings(admin, contracts, result)

  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createRenewalBookings(admin: any, contracts: any[], result: Result) {
  // Filtrăm contractele cu expiry în următoarele 7 zile SAU deja în fereastra finală
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + 7)
  const candidates = contracts.filter((c: { period_type: string; expiry_date: string }) => {
    if (!PERIOD_TO_CATEGORY[c.period_type]) return false
    const exp = new Date(c.expiry_date)
    return exp <= cutoff && exp >= new Date()
  })
  if (candidates.length === 0) return

  // Verifică ce contracte deja au booking de reînnoire (source_contract_id)
  const contractIds = candidates.map((c: { id: string }) => c.id)
  const { data: existingBookings } = await admin
    .from("bookings")
    .select("source_contract_id")
    .in("source_contract_id", contractIds)

  const hasBooking = new Set(
    (existingBookings ?? []).map((b: { source_contract_id: string }) => b.source_contract_id),
  )

  // Pre-load service_categories o singură dată
  const categorySlugs = [...new Set(candidates.map((c: { period_type: string }) => PERIOD_TO_CATEGORY[c.period_type]))]
  const { data: cats } = await admin
    .from("service_categories")
    .select("id, slug")
    .in("slug", categorySlugs)
  const catBySlug = new Map<string, number>()
  for (const c of cats ?? []) catBySlug.set(c.slug as string, c.id as number)

  for (const c of candidates) {
    if (hasBooking.has(c.id)) continue
    const catSlug = PERIOD_TO_CATEGORY[c.period_type]
    const categoryId = catBySlug.get(catSlug)
    if (!categoryId) continue

    try {
      const publicRef = await generatePublicRef()
      const { error: bkErr } = await admin.from("bookings").insert({
        public_ref: publicRef,
        customer_id: c.customer_id,
        property_id: c.property_id,
        firm_id: c.firm_id,
        service_category_id: categoryId,
        status: "pending",
        source: "api",
        source_contract_id: c.id,
        notes_customer: `Reînnoire automată contract ${c.contract_number ?? c.id.slice(0, 8)}`,
      })
      if (bkErr) {
        result.errors.push(`booking contract ${c.id}: ${bkErr.message}`)
      } else {
        result.renewalBookings++
      }
    } catch (e) {
      result.errors.push(`booking contract ${c.id}: ${(e as Error).message}`)
    }
  }
}
