// lib/reminders/dispatch.ts
// Ia reminder-ele cu status='queued' due acum/înainte și le trimite prin
// canalul configurat (SMS via smsadvert, email via Resend).
// Apelat din /api/cron/reminders care e declanșat la fiecare 10 minute.
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { sendSms, formatDateRoFromISO } from "@/lib/sms/smsadvert"
import { composeReminderSms } from "@/lib/sms/compose"
import { sendEmail } from "@/lib/email/resend"
import {
  renderReminderVerificare24m,
  renderReminderRevizie120m,
  renderReminderIscirCentrala,
  renderReminderDetector12m,
  type ReminderEmailData,
} from "@/lib/email/templates"

export type DispatchResult = {
  processed: number
  sent: number
  failed: number
  skipped: number
  errors: Array<{ reminderId: string; error: string }>
}

const EMAIL_SUBJECTS: Record<string, string> = {
  verificare_24m:       "Scadență verificare instalație gaze — verigaz",
  revizie_120m:         "Scadență revizie instalație gaze (10 ani) — verigaz",
  service_detector_12m: "Service anual detector gaze — verigaz",
  iscir_centrala:       "Verificare anuală centrală termică — verigaz",
}

function formatDateRo(iso: string): string {
  return formatDateRoFromISO(iso)
}

function renderEmailForReminder(
  type: string,
  data: ReminderEmailData,
): string | null {
  switch (type) {
    case "verificare_24m":       return renderReminderVerificare24m(data)
    case "revizie_120m":         return renderReminderRevizie120m(data)
    case "iscir_centrala":       return renderReminderIscirCentrala(data)
    case "service_detector_12m": return renderReminderDetector12m(data)
    default: return null
  }
}

export async function dispatchDueReminders(
  opts: { limit?: number; dryRun?: boolean } = {},
): Promise<DispatchResult> {
  const { limit = 50, dryRun = false } = opts
  const admin = getServiceRoleSupabase()
  const now = new Date().toISOString()

  const result: DispatchResult = { processed: 0, sent: 0, failed: 0, skipped: 0, errors: [] }

  const { data: due, error } = await admin
    .from("reminders")
    .select(
      "id, reminder_type, scheduled_for, channel, customer_id, property_id, firm_id, related_booking_id, contract_id, " +
      "customers(full_name, phone, email), " +
      "properties(address, block_name, apartment, next_verificare_due, next_revizie_due, " +
      "  judete:judet_id(nume), localitati:localitate_id(nume)), " +
      "gas_firms(slug, brand_name, legal_name, phone), " +
      "contracts(contract_number, expiry_date, period_type)",
    )
    .eq("status", "queued")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("[dispatchDueReminders] query:", error)
    return result
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (due ?? []) as any[]
  for (const r of rows) {
    result.processed += 1
    const customer = Array.isArray(r.customers) ? r.customers[0] : r.customers
    const property = Array.isArray(r.properties) ? r.properties[0] : r.properties
    const firm = Array.isArray(r.gas_firms) ? r.gas_firms[0] : r.gas_firms
    const contract = Array.isArray(r.contracts) ? r.contracts[0] : r.contracts

    if (!customer || !property) {
      result.skipped += 1
      await markReminder(admin, r.id, "skipped", { error: "Date incomplete (customer/property)." }, dryRun)
      continue
    }

    // Scadența reală (nu cea de trimitere — aceea e 30 zile înainte)
    let dueIso: string | null = null
    if (r.reminder_type === "verificare_24m") dueIso = property.next_verificare_due ?? null
    else if (r.reminder_type === "revizie_120m") dueIso = property.next_revizie_due ?? null
    else if (r.reminder_type === "contract_service") dueIso = contract?.expiry_date ?? null
    // Pentru celelalte tipuri scadența reală = scheduled_for + 30 zile (advance_days)
    const dueDate = dueIso
      ? formatDateRo(dueIso)
      : formatDateRo(new Date(new Date(r.scheduled_for).getTime() + 30 * 86400000).toISOString())

    const addr = [
      property.address,
      property.block_name && `bl. ${property.block_name}`,
      property.apartment && `ap. ${property.apartment}`,
    ].filter(Boolean).join(", ")

    const firmName = firm ? (firm.brand_name || firm.legal_name) : null
    const firmPhone = firm?.phone ?? null
    const bookingLink = firm ? `https://verificari-gaze.ro/programare?firma=${firm.slug}` : "https://verificari-gaze.ro/servicii-gaze"

    // ── Decide canalul ──
    const channel = r.channel as string
    const wantsSms = channel === "sms" || channel === "all"
    const wantsEmail = channel === "email" || channel === "all"
    const hasPhone = !!customer.phone
    const hasEmail = !!customer.email

    let smsOk = true; let smsError: string | null = null
    let emailOk = true; let emailError: string | null = null
    let templateUsed: string | null = null
    let renderedBody: string | null = null

    // ── SMS ──
    if (wantsSms && hasPhone) {
      const serviceSlug =
        r.reminder_type === "verificare_24m" ? "verificare-instalatie"
        : r.reminder_type === "revizie_120m" ? "revizie-instalatie"
        : r.reminder_type === "iscir_centrala" ? "verificare-centrala"
        : r.reminder_type === "service_detector_12m" ? "service-detector"
        : r.reminder_type === "contract_service"
          ? (contract?.period_type === "10_ani" ? "revizie-instalatie" : "verificare-instalatie")
          : ""
      const longUrl = firm
        ? `https://verificari-gaze.ro/programare-rapida?firma=${firm.slug}${serviceSlug ? `&serviciu=${serviceSlug}` : ""}`
        : "https://verificari-gaze.ro/servicii-gaze"
      const extraVars: Record<string, string> = {}
      if (r.reminder_type === "contract_service" && contract) {
        extraVars.CONTRACT = contract.contract_number ?? `#${String(r.contract_id).slice(0, 8)}`
      }
      const composed = await composeReminderSms({
        reminderType: r.reminder_type,
        firmName: firmName ?? "verigaz",
        firmPhone: firmPhone,
        customerAddress: addr,
        dueDateISO: dueIso ?? r.scheduled_for,
        bookingLongUrl: longUrl,
        bookingRef: r.related_booking_id?.slice(0, 8) ?? undefined,
        extraVars,
      })
      const msg = composed.body
      templateUsed = `db:${r.reminder_type}`
      renderedBody = msg
      if (!dryRun) {
        const res = await sendSms(customer.phone, msg)
        smsOk = res.ok
        if (!res.ok) smsError = res.error ?? "SMS failed"

        try {
          await admin.from("sms_logs").insert({
            phone: customer.phone,
            body: msg,
            template_key: templateUsed,
            status: res.ok ? "sent" : "failed",
            error_message: res.ok ? null : res.error,
            reminder_id: r.id,
            customer_id: r.customer_id,
            firm_id: r.firm_id,
          })
        } catch (logErr) {
          console.error("[dispatch] sms_log insert failed:", logErr)
        }
      }
    }

    // ── Email ──
    if (wantsEmail && hasEmail) {
      const html = renderEmailForReminder(r.reminder_type, {
        customerName: customer.full_name,
        address: [addr, property.localitati?.nume, property.judete?.nume].filter(Boolean).join(", "),
        dueDate,
        firmName,
        firmPhone,
        bookingLink,
      })
      if (!html) {
        emailOk = false
        emailError = `Niciun template email pentru ${r.reminder_type}`
      } else {
        const subject = EMAIL_SUBJECTS[r.reminder_type] ?? "Reminder verigaz"
        if (!dryRun) {
          const res = await sendEmail({ to: customer.email, subject, html })
          emailOk = res.ok
          if (!res.ok) emailError = res.error
        }
      }
    }

    // ── Update status reminder ──
    const overallOk = (wantsSms ? smsOk : true) && (wantsEmail ? emailOk : true)
    const hasChannel = (wantsSms && hasPhone) || (wantsEmail && hasEmail)

    if (!hasChannel) {
      result.skipped += 1
      await markReminder(admin, r.id, "skipped", { error: "Niciun canal disponibil (customer lipsă phone/email)." }, dryRun)
    } else if (overallOk) {
      result.sent += 1
      await markReminder(admin, r.id, "sent", {
        template_used: templateUsed,
        rendered_body: renderedBody,
        sent_at: new Date().toISOString(),
      }, dryRun)
    } else {
      result.failed += 1
      const errorMessage = [smsError, emailError].filter(Boolean).join(" | ")
      result.errors.push({ reminderId: r.id, error: errorMessage })
      await markReminder(admin, r.id, "failed", { error_message: errorMessage }, dryRun)
    }
  }

  return result
}

async function markReminder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  reminderId: string,
  status: "sent" | "failed" | "skipped",
  patch: Record<string, unknown>,
  dryRun: boolean,
) {
  if (dryRun) return
  const p: Record<string, unknown> = { status, ...patch }
  if (status === "sent") p.sent_at = p.sent_at ?? new Date().toISOString()
  await admin.from("reminders").update(p).eq("id", reminderId)
}
