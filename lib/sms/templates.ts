// lib/sms/templates.ts
// Template-uri SMS Verigaz (diacritic-safe, sub 160 caractere)

export const SMS_TEMPLATES = {
  // ── Reminder scadență verificare (24 luni) ──
  reminder_verificare_24m_b2c:
    "Verificarea instalatiei tale de gaze expira pe {DATA}. Programeaza pe verificari-gaze.ro/programare/{REF} sau suna {TELEFON}. STOP dezabonare.",
  reminder_verificare_24m_b2b:
    "{FIRMA}: Verificarea instalatiei de gaze pentru {ADRESA} expira pe {DATA}. Programeaza: {TELEFON}. STOP dezabonare.",

  // ── Reminder scadență revizie (120 luni) ──
  reminder_revizie_120m_b2c:
    "Revizia la 10 ani a instalatiei de gaze expira pe {DATA}. Obligatoriu ANRE. Programeaza: verificari-gaze.ro/programare/{REF}. STOP dezabonare.",
  reminder_revizie_120m_b2b:
    "{FIRMA}: Revizia la 10 ani pentru {ADRESA} expira pe {DATA}. Programeaza: {TELEFON}. STOP dezabonare.",

  // ── Reminder service detector (12 luni) ──
  reminder_detector_12m:
    "Service-ul anual al detectorului de gaze e recomandat in {DATA}. Programeaza pe verificari-gaze.ro. STOP dezabonare.",

  // ── Confirmare programare ──
  confirmare_programare:
    "Programarea Verigaz {REF} confirmata: {DATA} la {ADRESA}. Firma {FIRMA}, tel {TELEFON}.",
  confirmare_programare_firma:
    "Programare noua Verigaz {REF}: {SERVICIU} la {ADRESA}, {DATA}. Client {NUME} {TELEFON}.",

  // ── Reamintire programare (cu 1 zi înainte) ──
  reamintire_programare:
    "Reamintim: programarea Verigaz {REF} maine {DATA} la {ADRESA}. Firma {FIRMA}, tel {TELEFON}.",

  // ── Certificat digital emis ──
  certificat_emis:
    "Certificatul tau Verigaz pentru {ADRESA} e gata: verificari-gaze.ro/doc/{REF}. Pastreaza linkul — valabil pana la {VALID_PANA}.",

  // ── Cerere recenzie post-job ──
  cerere_recenzie:
    "Multumim ca ai ales {FIRMA} prin Verigaz. Spune-ne cum a fost: verificari-gaze.ro/recenzie/{REF}.",

  // ── Magazin comandă confirmată ──
  comanda_confirmata:
    "Comanda Verigaz {REF} confirmata. Total {TOTAL} RON. Stare: verificari-gaze.ro/comanda/{REF}.",
  comanda_expediata:
    "Comanda Verigaz {REF} a fost expediata. Tracking: {TRACKING}.",
} as const

export type SmsTemplateKey = keyof typeof SMS_TEMPLATES

export function applyVerigazTemplate(
  template: string,
  vars: Record<string, string | null | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_m, key) => {
    const v = vars[key]
    return v == null ? "" : String(v).trim()
  })
}
