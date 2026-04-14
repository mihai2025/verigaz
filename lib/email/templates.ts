// lib/email/templates.ts
// HTML email templates pentru reminder-e și notificări verigaz.
// Minimal inline-style pentru compatibilitate cu mail clients.

const WRAPPER_START = `<!DOCTYPE html><html lang="ro"><body style="margin:0;padding:0;background:#f6f7f8;font-family:Arial,Helvetica,sans-serif;color:#1a1c1f">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.05);overflow:hidden">
<tr><td style="padding:32px 28px 8px"><h1 style="margin:0 0 16px;font-size:20px;color:#0d6b62">verigaz</h1>`

const WRAPPER_END = `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="font-size:12px;color:#6b7280;margin:0">Primești acest email pentru că ai folosit platforma verificari-gaze.ro. <a href="https://verificari-gaze.ro/dezabonare" style="color:#6b7280">Dezabonează-te</a>.</p>
</td></tr></table></td></tr></table></body></html>`

function render(body: string): string {
  return WRAPPER_START + body + WRAPPER_END
}

export type ReminderEmailData = {
  customerName: string
  address: string
  dueDate: string              // formatted "DD.MM.YYYY"
  firmName?: string | null
  firmPhone?: string | null
  bookingLink?: string | null  // ex: https://verificari-gaze.ro/programare?firma=<slug>
}

export function renderReminderVerificare24m(d: ReminderEmailData) {
  const cta = d.bookingLink
    ? `<a href="${d.bookingLink}" style="display:inline-block;background:#0d6b62;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Programează verificarea</a>`
    : ""
  return render(`
    <h2 style="margin:0 0 12px;font-size:18px">Scadență verificare instalație gaze</h2>
    <p>Bună ${d.customerName},</p>
    <p>Verificarea tehnică obligatorie a instalației de gaze de la <strong>${d.address}</strong>
    expiră pe <strong>${d.dueDate}</strong>.</p>
    <p>Conform <strong>ANRE Ord. 179/2015</strong>, verificarea e obligatorie la maxim 2 ani.
    Dacă nu e făcută la timp, riști suspendarea furnizării gazului.</p>
    <p style="margin:24px 0">${cta}</p>
    ${d.firmName ? `<p>Firma care a efectuat ultima verificare: <strong>${d.firmName}</strong>${d.firmPhone ? ` · ${d.firmPhone}` : ""}.</p>` : ""}
  `)
}

export function renderReminderRevizie120m(d: ReminderEmailData) {
  const cta = d.bookingLink
    ? `<a href="${d.bookingLink}" style="display:inline-block;background:#0d6b62;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Programează revizia</a>`
    : ""
  return render(`
    <h2 style="margin:0 0 12px;font-size:18px">Scadență revizie instalație gaze (10 ani)</h2>
    <p>Bună ${d.customerName},</p>
    <p>Revizia completă a instalației de gaze de la <strong>${d.address}</strong>
    expiră pe <strong>${d.dueDate}</strong>.</p>
    <p>Revizia la 10 ani e obligatorie conform <strong>ANRE Ord. 179/2015</strong> și
    presupune verificarea tuturor componentelor instalației.</p>
    <p style="margin:24px 0">${cta}</p>
    ${d.firmName ? `<p>Firma recomandată: <strong>${d.firmName}</strong>${d.firmPhone ? ` · ${d.firmPhone}` : ""}.</p>` : ""}
  `)
}

export function renderReminderIscirCentrala(d: ReminderEmailData) {
  const cta = d.bookingLink
    ? `<a href="${d.bookingLink}" style="display:inline-block;background:#0d6b62;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Programează verificarea</a>`
    : ""
  return render(`
    <h2 style="margin:0 0 12px;font-size:18px">Verificare anuală centrală termică</h2>
    <p>Bună ${d.customerName},</p>
    <p>Verificarea tehnică periodică (VTP) a centralei termice de la
    <strong>${d.address}</strong> e recomandată anual — scadență: <strong>${d.dueDate}</strong>.</p>
    <p>Fără verificare anuală poți pierde <strong>garanția echipamentului</strong> și riști
    defecțiuni neprevăzute.</p>
    <p style="margin:24px 0">${cta}</p>
  `)
}

export function renderReminderDetector12m(d: ReminderEmailData) {
  const cta = d.bookingLink
    ? `<a href="${d.bookingLink}" style="display:inline-block;background:#0d6b62;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Programează service</a>`
    : ""
  return render(`
    <h2 style="margin:0 0 12px;font-size:18px">Service anual detector gaze</h2>
    <p>Bună ${d.customerName},</p>
    <p>Detectorul de gaze instalat la <strong>${d.address}</strong> are nevoie de calibrare
    anuală — scadență: <strong>${d.dueDate}</strong>.</p>
    <p>Un detector necalibrat poate să nu detecteze scurgerile de gaz la timp.</p>
    <p style="margin:24px 0">${cta}</p>
  `)
}
