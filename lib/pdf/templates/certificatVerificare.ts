// lib/pdf/templates/certificatVerificare.ts
// Template pentru certificat de verificare instalație gaze (ANRE Ord. 179/2015).
//
// Conținut minimal legal:
//  - Denumirea firmei + nr. autorizație ANRE
//  - Date client + adresă instalație
//  - Rezultat verificare + parametri măsurați
//  - Valabilitate (24 luni de la data verificării)
//  - QR code pentru verificare online
//
// Structură identică va fi folosită pentru VTP centrală (cu conținut diferit).
import {
  advance, COLORS, drawQr, drawText, h1, h2, hr, kv, newPdf, p, sanitize,
  type PdfContext,
} from "../common"
import { PAGE, MARGIN } from "../common"

export type CertificatVerificareData = {
  documentNumber: string
  publicRef: string                  // link verificare online
  issuedAt: Date
  validUntil: Date

  firm: {
    brandName: string | null
    legalName: string
    anreAuthorizationNo: string | null
    anreCategory: string | null
    cui: string | null
    phone: string | null
    sediuAdresa: string | null
  }
  customer: {
    fullName: string
    phone: string
    email: string | null
  }
  property: {
    address: string
    blockName: string | null
    apartment: string | null
    localitateNume: string | null
    judetNume: string | null
  }
  technical?: {
    pressureBefore?: string
    pressureAfter?: string
    leakTestResult?: string        // "conformă" / "neconformă"
    observations?: string
  }
  signedBy?: string                  // numele tehnicianului
}

export async function renderCertificatVerificare(
  data: CertificatVerificareData,
): Promise<Uint8Array> {
  const ctx = await newPdf()

  // Header
  h1(ctx, sanitize("Certificat de verificare instalatie gaze"))
  drawText(ctx, sanitize("Conform ANRE Ord. 179/2015"), { size: 9, y: ctx.cursorY })
  advance(ctx, 18)
  hr(ctx)

  // Document meta
  kv(ctx, sanitize("Nr. document:"), sanitize(data.documentNumber))
  kv(ctx, sanitize("Emis la:"), data.issuedAt.toLocaleDateString("ro-RO"))
  kv(ctx, sanitize("Valabil pana la:"), data.validUntil.toLocaleDateString("ro-RO"))
  kv(ctx, sanitize("Ref. publica:"), sanitize(data.publicRef))
  advance(ctx, 8)
  hr(ctx)

  // Firma
  h2(ctx, sanitize("Firma executanta"))
  kv(ctx, sanitize("Denumire:"), sanitize(data.firm.brandName || data.firm.legalName))
  if (data.firm.brandName && data.firm.legalName !== data.firm.brandName) {
    kv(ctx, sanitize("Denumire legala:"), sanitize(data.firm.legalName))
  }
  if (data.firm.cui) kv(ctx, "CUI:", sanitize(data.firm.cui))
  if (data.firm.anreAuthorizationNo) {
    kv(ctx, sanitize("Autorizatie ANRE:"),
       sanitize(`${data.firm.anreAuthorizationNo}${data.firm.anreCategory ? ` · ${data.firm.anreCategory}` : ""}`))
  }
  if (data.firm.phone)        kv(ctx, "Telefon:", sanitize(data.firm.phone))
  if (data.firm.sediuAdresa)  kv(ctx, "Sediu:",   sanitize(data.firm.sediuAdresa))
  advance(ctx, 8)

  // Client
  h2(ctx, sanitize("Client"))
  kv(ctx, "Nume:",    sanitize(data.customer.fullName))
  kv(ctx, "Telefon:", sanitize(data.customer.phone))
  if (data.customer.email) kv(ctx, "Email:", sanitize(data.customer.email))
  advance(ctx, 8)

  // Locatia
  h2(ctx, sanitize("Locatia instalatiei"))
  const addrParts = [
    data.property.address,
    data.property.blockName && `bl. ${data.property.blockName}`,
    data.property.apartment && `ap. ${data.property.apartment}`,
  ].filter(Boolean)
  kv(ctx, "Adresa:", sanitize(addrParts.join(", ")))
  const geo = [data.property.localitateNume, data.property.judetNume].filter(Boolean).join(", ")
  if (geo) kv(ctx, "Localitate:", sanitize(geo))
  advance(ctx, 8)
  hr(ctx)

  // Rezultat
  h2(ctx, sanitize("Rezultat verificare"))
  if (data.technical?.leakTestResult) {
    kv(ctx, sanitize("Test etanseitate:"), sanitize(data.technical.leakTestResult))
  }
  if (data.technical?.pressureBefore) {
    kv(ctx, sanitize("Presiune initiala:"), sanitize(data.technical.pressureBefore))
  }
  if (data.technical?.pressureAfter) {
    kv(ctx, sanitize("Presiune finala:"), sanitize(data.technical.pressureAfter))
  }
  if (data.technical?.observations) {
    advance(ctx, 4)
    p(ctx, sanitize("Observatii:"), { bold: true, size: 10 })
    p(ctx, sanitize(data.technical.observations))
  }
  advance(ctx, 12)

  // Declaratie legala
  h2(ctx, sanitize("Declaratie"))
  p(ctx, sanitize(
    "Subsemnatul, reprezentant al firmei executante, declar pe proprie raspundere ca verificarea",
  ), { size: 9 })
  p(ctx, sanitize(
    "tehnica a instalatiei a fost efectuata conform normativelor in vigoare (ANRE Ord. 179/2015).",
  ), { size: 9 })
  p(ctx, sanitize(
    "Prezentul certificat este valabil 24 luni de la data emiterii.",
  ), { size: 9 })
  advance(ctx, 20)

  // Semnaturi
  drawText(ctx, sanitize("Executant:"), { size: 9, y: ctx.cursorY, color: COLORS.muted })
  drawText(ctx, sanitize(data.signedBy ?? ""), { size: 10, y: ctx.cursorY - 14 })
  drawText(ctx, "Client:", { size: 9, x: MARGIN + 250, y: ctx.cursorY, color: COLORS.muted })
  drawText(ctx, sanitize(data.customer.fullName), { size: 10, x: MARGIN + 250, y: ctx.cursorY - 14 })

  // QR code
  const verifyUrl = `https://verificari-gaze.ro/verifica-document/${data.publicRef}`
  await drawQr(ctx, verifyUrl, { size: 80, x: PAGE.width - MARGIN - 80, y: MARGIN + 40 })
  drawText(ctx, sanitize("Verifica autenticitatea"), {
    size: 7,
    x: PAGE.width - MARGIN - 80,
    y: MARGIN + 32,
  })
  drawText(ctx, sanitize(`verificari-gaze.ro/verifica-document/${data.publicRef.slice(0, 8)}...`), {
    size: 7,
    x: PAGE.width - MARGIN - 80,
    y: MARGIN + 22,
  })

  return await ctx.doc.save()
}

// Re-export pt folosire externă
export type { PdfContext }
