// lib/sms/smsadvert.ts
// SMS sending via smsadvert.ro API

const SMS_API_URL = "https://www.smsadvert.ro/api/sms/"

/** Strip Romanian diacritics to plain ASCII */
function stripDiacritics(text: string): string {
  const map: Record<string, string> = {
    "ă": "a", "â": "a", "î": "i", "ș": "s", "ț": "t",
    "Ă": "A", "Â": "A", "Î": "I", "Ș": "S", "Ț": "T",
    "ş": "s", "ţ": "t", "Ş": "S", "Ţ": "T", // cedilla variants
  }
  return text.replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, (ch) => map[ch] || ch)
}

/** Normalize Romanian phone to +40XXXXXXXXX */
export function normalizePhoneSms(raw: string): string | null {
  let num = raw.replace(/[^0-9+]/g, "")
  if (num.startsWith("+40") && num.length === 12) return num
  if (num.startsWith("40") && num.length === 11)   return "+" + num
  if (num.startsWith("0") && num.length === 10)    return "+4" + num
  return null
}

export async function sendSms(
  phone: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SMS_API_TOKEN
  if (!token) {
    console.warn("[smsadvert] SMS_API_TOKEN not set – skipping send.")
    return { ok: false, error: "SMS_API_TOKEN not configured" }
  }

  const normalized = normalizePhoneSms(phone) ?? phone
  const cleanMessage = stripDiacritics(message)

  try {
    const res = await fetch(SMS_API_URL, {
      method: "POST",
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: normalized,
        shortTextMessage: cleanMessage,
        sendAsShort: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[smsadvert] HTTP ${res.status}:`, body)
      return { ok: false, error: `HTTP ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    console.error("[smsadvert] fetch error:", err)
    return { ok: false, error: String(err) }
  }
}

// ── Template engine ──────────────────────────────────────────────

export const PERIOD_LABELS: Record<string, string> = {
  "9":       "9 zile",
  "21":      "21 de zile",
  "40":      "40 de zile",
  "3_luni":  "3 luni",
  "6_luni":  "6 luni",
  "9_luni":  "9 luni",
  "1_an":    "1 an",
  "2_ani":   "2 ani",
  "3_ani":   "3 ani",
  "4_ani":   "4 ani",
  "5_ani":   "5 ani",
  "6_ani":   "6 ani",
  "7_ani":   "7 ani",
  // Legacy keys
  "9_zile":  "9 zile",
  "21_zile": "21 de zile",
  "40_zile": "40 de zile",
}

/** Verbul corect: "se implinesc" (plural) vs "se implineste" (singular: 1 an) */
export function verbImplinire(tip: string): string {
  return tip === "1_an" ? "se implineste" : "se implinesc"
}

export const DEFAULT_TEMPLATE_B2C =
  "Pe {DATA} se implinesc {PERIOADA} de la trecerea lui {NUME}. Va dorim putere. Ghidul Funerar. Raspunde STOP dezabonare."

export const DEFAULT_TEMPLATE_B2B =
  "{FIRMA}: Pe {DATA} se implinesc {PERIOADA} de la plecarea lui {NUME}. Cu respect, va sprijinim la nevoie. {TELEFON}"

export function applyTemplate(
  template: string,
  vars: {
    DATA: string
    PERIOADA: string
    NUME?: string | null
    FIRMA?: string | null
    TELEFON?: string | null
    TIP?: string | null
  }
): string {
  // Fix verb conjugation: "se implineste 1 an" vs "se implinesc 3 zile"
  const verb = vars.TIP ? verbImplinire(vars.TIP) : "se implinesc"

  return template
    .replace(/se implinesc {PERIOADA}/gi, `${verb} {PERIOADA}`)
    .replace(/se împlinesc {PERIOADA}/gi, `${verb} {PERIOADA}`)
    .replace(/{DATA}/g, vars.DATA)
    .replace(/{PERIOADA}/g, vars.PERIOADA)
    .replace(/{NUME}/g, vars.NUME?.trim() || "cel drag")
    .replace(/{FIRMA}/g, vars.FIRMA?.trim() || "")
    .replace(/{TELEFON}/g, vars.TELEFON?.trim() || "")
}

export function formatDateRoFromISO(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-")
  return `${d}.${m}.${y}`
}
