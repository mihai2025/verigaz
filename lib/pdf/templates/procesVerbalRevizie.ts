// lib/pdf/templates/procesVerbalRevizie.ts
// Template proces-verbal revizie instalație gaze (ANRE Ord. 179/2015).
// Revizia e scadența la 120 luni (10 ani) cu check-list tehnic complet.
import {
  advance, COLORS, drawQr, drawText, h1, h2, hr, kv, newPdf, p, sanitize,
} from "../common"
import { PAGE, MARGIN } from "../common"

export type ProcesVerbalRevizieData = {
  documentNumber: string
  publicRef: string
  issuedAt: Date
  validUntil: Date

  firm: {
    brandName: string | null
    legalName: string
    anreAuthorizationNo: string | null
    anreCategory: string | null
    cui: string | null
    phone: string | null
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
  checklist?: {
    pipes_ok?: boolean                 // conducte
    fittings_ok?: boolean              // fittinguri
    valves_ok?: boolean                // robineți
    meter_ok?: boolean                 // contor
    appliances_ok?: boolean            // aparate consumatoare
    ventilation_ok?: boolean           // ventilare
    detector_installed?: boolean
    detector_brand?: string | null
    observations?: string
  }
  signedBy?: string
}

function check(v: boolean | undefined): string {
  if (v === true) return sanitize("Conform")
  if (v === false) return sanitize("Neconform")
  return "—"
}

export async function renderProcesVerbalRevizie(
  data: ProcesVerbalRevizieData,
): Promise<Uint8Array> {
  const ctx = await newPdf()

  h1(ctx, sanitize("Proces-verbal revizie instalatie gaze"))
  drawText(ctx, sanitize("Conform ANRE Ord. 179/2015"), { size: 9, y: ctx.cursorY })
  advance(ctx, 18)
  hr(ctx)

  kv(ctx, sanitize("Nr. document:"), sanitize(data.documentNumber))
  kv(ctx, sanitize("Emis la:"), data.issuedAt.toLocaleDateString("ro-RO"))
  kv(ctx, sanitize("Valabil pana la:"), data.validUntil.toLocaleDateString("ro-RO"))
  kv(ctx, sanitize("Ref. publica:"), sanitize(data.publicRef))
  advance(ctx, 8)
  hr(ctx)

  h2(ctx, sanitize("Firma executanta"))
  kv(ctx, sanitize("Denumire:"), sanitize(data.firm.brandName || data.firm.legalName))
  if (data.firm.cui) kv(ctx, "CUI:", sanitize(data.firm.cui))
  if (data.firm.anreAuthorizationNo) {
    kv(ctx, sanitize("Autorizatie ANRE:"),
       sanitize(`${data.firm.anreAuthorizationNo}${data.firm.anreCategory ? ` · ${data.firm.anreCategory}` : ""}`))
  }
  if (data.firm.phone) kv(ctx, "Telefon:", sanitize(data.firm.phone))
  advance(ctx, 8)

  h2(ctx, sanitize("Client + locatie"))
  kv(ctx, "Client:", sanitize(data.customer.fullName))
  kv(ctx, "Telefon:", sanitize(data.customer.phone))
  const addr = [
    data.property.address,
    data.property.blockName && `bl. ${data.property.blockName}`,
    data.property.apartment && `ap. ${data.property.apartment}`,
  ].filter(Boolean).join(", ")
  kv(ctx, "Adresa:", sanitize(addr))
  const geo = [data.property.localitateNume, data.property.judetNume].filter(Boolean).join(", ")
  if (geo) kv(ctx, "Localitate:", sanitize(geo))
  advance(ctx, 8)
  hr(ctx)

  h2(ctx, sanitize("Check-list tehnic"))
  kv(ctx, "Conducte:",             check(data.checklist?.pipes_ok))
  kv(ctx, "Fittinguri / imbinari:",check(data.checklist?.fittings_ok))
  kv(ctx, "Robineti:",             check(data.checklist?.valves_ok))
  kv(ctx, "Contor:",               check(data.checklist?.meter_ok))
  kv(ctx, sanitize("Aparate consumatoare:"), check(data.checklist?.appliances_ok))
  kv(ctx, "Ventilare:",            check(data.checklist?.ventilation_ok))
  kv(ctx, sanitize("Detector montat:"),
     data.checklist?.detector_installed
       ? sanitize(`Da${data.checklist.detector_brand ? ` (${data.checklist.detector_brand})` : ""}`)
       : "Nu")
  if (data.checklist?.observations) {
    advance(ctx, 4)
    p(ctx, sanitize("Observatii:"), { bold: true })
    p(ctx, sanitize(data.checklist.observations))
  }
  advance(ctx, 12)

  h2(ctx, sanitize("Declaratie"))
  p(ctx, sanitize(
    "Prin prezentul proces-verbal se atesta efectuarea reviziei tehnice a instalatiei de utilizare",
  ), { size: 9 })
  p(ctx, sanitize(
    "gaze naturale conform ANRE Ord. 179/2015, cu valabilitate 120 luni (10 ani).",
  ), { size: 9 })
  advance(ctx, 20)

  drawText(ctx, sanitize("Executant:"), { size: 9, y: ctx.cursorY, color: COLORS.muted })
  drawText(ctx, sanitize(data.signedBy ?? ""), { size: 10, y: ctx.cursorY - 14 })
  drawText(ctx, "Client:", { size: 9, x: MARGIN + 250, y: ctx.cursorY, color: COLORS.muted })
  drawText(ctx, sanitize(data.customer.fullName), { size: 10, x: MARGIN + 250, y: ctx.cursorY - 14 })

  const verifyUrl = `https://verificari-gaze.ro/verifica-document/${data.publicRef}`
  await drawQr(ctx, verifyUrl, { size: 80, x: PAGE.width - MARGIN - 80, y: MARGIN + 40 })
  drawText(ctx, sanitize("Verifica autenticitatea"), {
    size: 7, x: PAGE.width - MARGIN - 80, y: MARGIN + 32,
  })

  return await ctx.doc.save()
}
