// lib/sms/compose.ts
//
// Compunere SMS pentru reminder-e:
//   1. Ia template-ul activ din sms_templates_admin (fallback la constantele hardcodate).
//   2. Substituie placeholdere ({FIRMA}, {DATA}, {ECHIPAMENT}, {ACTIUNE}, {TELEFON}, {ADRESA}, {LINK}).
//   3. Scurtează {LINK} via Bitly.
//   4. Strip diacritice (smsadvert deja face asta, dar normalizăm preventiv).
//   5. Clip la max_chars (default 160).
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { shortenUrlSafe } from "@/lib/bitly"
import { SMS_TEMPLATES, applyVerigazTemplate, type SmsTemplateKey } from "@/lib/sms/templates"

const DIA: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
}
export function stripDiacritics(text: string): string {
  return text.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIA[ch] ?? ch)
}

/** Hardcoded fallback per reminder_type, dacă DB nu are template activ */
const FALLBACK_KEY_BY_TYPE: Record<string, SmsTemplateKey> = {
  verificare_24m:       "reminder_verificare_24m_b2c",
  revizie_120m:         "reminder_revizie_120m_b2c",
  service_detector_12m: "reminder_detector_12m",
  iscir_centrala:       "reminder_detector_12m",
}

/** Maparea action + equipment display per reminder_type */
export function labelsForReminderType(type: string): { actiune: string; echipament: string } {
  switch (type) {
    case "verificare_24m":       return { actiune: "verificarea", echipament: "instalatiei de gaz" }
    case "revizie_120m":         return { actiune: "revizia",    echipament: "instalatiei de gaz" }
    case "service_detector_12m": return { actiune: "service-ul", echipament: "detectorului de gaz" }
    case "iscir_centrala":       return { actiune: "verificarea", echipament: "centralei termice" }
    default:                      return { actiune: "lucrarea",   echipament: "echipamentului" }
  }
}

async function loadTemplate(reminderType: string): Promise<{ template: string; maxChars: number }> {
  try {
    const admin = getServiceRoleSupabase()
    const { data } = await admin
      .from("sms_templates_admin")
      .select("template, max_chars")
      .eq("reminder_type", reminderType)
      .eq("is_active", true)
      .maybeSingle()
    if (data?.template) {
      return { template: data.template as string, maxChars: (data.max_chars as number) ?? 160 }
    }
  } catch (err) {
    console.warn("[sms/compose] DB template load failed:", err)
  }
  // Fallback hardcoded
  const key = FALLBACK_KEY_BY_TYPE[reminderType]
  const tpl = key ? SMS_TEMPLATES[key] : SMS_TEMPLATES.reminder_verificare_24m_b2c
  return { template: tpl, maxChars: 160 }
}

export type SmsComposeInput = {
  reminderType: string
  firmName: string
  firmPhone: string | null
  customerAddress: string | null
  dueDateISO: string | null       // ISO string, va fi formatat DD.MM.YYYY
  bookingLongUrl: string           // URL lung pentru programare (se shortenează)
  bookingRef?: string              // fallback în locul link-ului
  extraVars?: Record<string, string | null | undefined>  // ex: { CONTRACT: "C-2026-0001" }
}

export async function composeReminderSms(input: SmsComposeInput): Promise<{
  body: string
  templateUsed: string
  length: number
  truncated: boolean
}> {
  const { template, maxChars } = await loadTemplate(input.reminderType)
  const { actiune, echipament } = labelsForReminderType(input.reminderType)

  // Scurtează URL-ul; fallback la REF dacă Bitly eșuează și link e prea lung
  const link = input.bookingLongUrl ? await shortenUrlSafe(input.bookingLongUrl) : ""
  const linkValue = link || input.bookingRef || ""

  const data = formatDateRo(input.dueDateISO)

  const substituted = applyVerigazTemplate(template, {
    FIRMA: input.firmName,
    TELEFON: input.firmPhone ?? "",
    DATA: data,
    ECHIPAMENT: echipament,
    ACTIUNE: actiune,
    ADRESA: input.customerAddress ?? "",
    LINK: linkValue,
    REF: input.bookingRef ?? "",
    ...(input.extraVars ?? {}),
  })

  // Normalizează: dubluri de spații, trim, diacritice
  let body = stripDiacritics(substituted).replace(/\s+/g, " ").trim()

  let truncated = false
  if (body.length > maxChars) {
    body = body.slice(0, maxChars - 1).trimEnd() + "…"
    truncated = true
  }

  return { body, templateUsed: template, length: body.length, truncated }
}

function formatDateRo(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}
