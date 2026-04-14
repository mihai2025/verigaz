// lib/pdf/templates/fisaClient.ts
// Fișa clientului — raport profesional cu antet firmă, date client, istoric per echipament.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { FisaClient } from "@/lib/clienti/fisa"
import { computeNextDue } from "@/lib/clienti/fisa"

const DIA: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
}
function clean(text: string | null | undefined): string {
  if (!text) return ""
  return String(text).replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIA[ch] ?? ch)
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("ro-RO")
}

function customerName(c: FisaClient["customer"]): string {
  if (c.customer_type === "individual") {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name
  }
  return c.company_name || c.full_name
}

function addressLine(p: FisaClient["properties"][number]): string {
  const parts = [
    p.address,
    p.block_name && `bl. ${p.block_name}`,
    p.stair && `sc. ${p.stair}`,
    p.floor && `et. ${p.floor}`,
    p.apartment && `ap. ${p.apartment}`,
  ].filter(Boolean).join(", ")
  const geo = [p.localitate, p.judet].filter(Boolean).join(", ")
  return [parts, geo].filter(Boolean).join(" · ")
}

const TYPE_SHORT: Record<string, string> = {
  certificat_verificare: "Verificare",
  proces_verbal_revizie: "Revizie",
  fisa_tehnica_centrala: "VTP centrala",
  certificat_conformitate: "Conformitate",
}

export async function renderFisaClient(data: FisaClient): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageSize: [number, number] = [595.28, 841.89] // A4
  const MARGIN = 42
  const PAGE_W = pageSize[0]
  const PAGE_H = pageSize[1]
  const CONTENT_W = PAGE_W - 2 * MARGIN

  const accent = rgb(0.169, 0.420, 0.388)     // #2b6b63
  const muted = rgb(0.4, 0.42, 0.45)
  const ink = rgb(0.06, 0.08, 0.14)
  const line = rgb(0.82, 0.84, 0.88)
  const softBg = rgb(0.97, 0.98, 0.97)

  let page = doc.addPage(pageSize)
  let y = PAGE_H - MARGIN

  function newPage() {
    page = doc.addPage(pageSize)
    y = PAGE_H - MARGIN
    drawFooter()
  }
  function ensureSpace(h: number) {
    if (y - h < MARGIN + 30) newPage()
  }

  function drawText(
    text: string,
    x: number,
    yy: number,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; maxWidth?: number } = {},
  ) {
    const size = opts.size ?? 10
    const f = opts.bold ? fontBold : font
    const str = clean(text)
    const maxW = opts.maxWidth
    if (!maxW) {
      page.drawText(str, { x, y: yy, size, font: f, color: opts.color ?? ink })
      return size + 4
    }
    // Wrap
    const words = str.split(/\s+/)
    const lines: string[] = []
    let cur = ""
    for (const w of words) {
      const test = cur ? cur + " " + w : w
      if (f.widthOfTextAtSize(test, size) > maxW) {
        if (cur) lines.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    let lineY = yy
    for (const l of lines) {
      page.drawText(l, { x, y: lineY, size, font: f, color: opts.color ?? ink })
      lineY -= size + 3
    }
    return (size + 3) * lines.length
  }

  function hr(yy: number, color = line) {
    page.drawLine({
      start: { x: MARGIN, y: yy },
      end: { x: PAGE_W - MARGIN, y: yy },
      color,
      thickness: 0.5,
    })
  }

  function drawFooter() {
    const footerY = MARGIN - 12
    const firm = data.firm
    const footer = `${clean(firm.brand_name || firm.legal_name)}`
      + (firm.anre_authorization_no ? ` · Aut. ANRE ${clean(firm.anre_authorization_no)}` : "")
      + (firm.phone ? ` · ${clean(firm.phone)}` : "")
      + (firm.email ? ` · ${clean(firm.email)}` : "")
    page.drawText(footer, {
      x: MARGIN, y: footerY, size: 8, font, color: muted,
    })
    page.drawText(
      `Generat: ${new Date().toLocaleString("ro-RO")}`,
      { x: PAGE_W - MARGIN - 120, y: footerY, size: 8, font, color: muted },
    )
  }

  // ── ANTET FIRMĂ ────────────────────────────────────────────
  // Bar colorat sus
  page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: accent })

  // Logo (dacă există ca URL, încercăm încărcare)
  let logoX = MARGIN
  if (data.firm.logo_url) {
    try {
      const res = await fetch(data.firm.logo_url)
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer())
        const ct = (res.headers.get("content-type") ?? "").toLowerCase()
        let img = null
        if (ct.includes("png")) img = await doc.embedPng(bytes)
        else if (ct.includes("jpeg") || ct.includes("jpg")) img = await doc.embedJpg(bytes)
        if (img) {
          const dims = img.scale(60 / img.height)
          page.drawImage(img, { x: MARGIN, y: y - dims.height, width: dims.width, height: dims.height })
          logoX = MARGIN + dims.width + 12
          y -= Math.max(dims.height, 50) + 8
        }
      }
    } catch {}
  }

  // Dacă logo n-a fost desenat, rezervă spațiu pentru text
  if (logoX === MARGIN) {
    drawText(clean(data.firm.brand_name || data.firm.legal_name), MARGIN, y, {
      size: 18, bold: true, color: accent,
    })
    y -= 22
  } else {
    // Numele lângă logo
    drawText(clean(data.firm.brand_name || data.firm.legal_name), logoX, PAGE_H - MARGIN - 18, {
      size: 16, bold: true, color: accent,
    })
    drawText(
      clean(data.firm.legal_name !== (data.firm.brand_name || "") ? data.firm.legal_name : ""),
      logoX, PAGE_H - MARGIN - 34,
      { size: 9, color: muted },
    )
  }

  const firmMeta: string[] = []
  if (data.firm.anre_authorization_no) {
    firmMeta.push(`Aut. ANRE: ${data.firm.anre_authorization_no}${data.firm.anre_category ? ` · ${data.firm.anre_category}` : ""}`)
  }
  if (data.firm.cui) firmMeta.push(`CUI: ${data.firm.cui}`)
  if (data.firm.phone) firmMeta.push(`Tel: ${data.firm.phone}`)
  if (data.firm.email) firmMeta.push(`Email: ${data.firm.email}`)
  if (data.firm.website) firmMeta.push(data.firm.website)
  if (data.firm.sediu_adresa) firmMeta.push(data.firm.sediu_adresa)

  drawText(firmMeta.join("  ·  "), MARGIN, y, { size: 8.5, color: muted, maxWidth: CONTENT_W })
  y -= 14
  hr(y); y -= 20

  // ── TITLU ──────────────────────────────────────────────────
  drawText("FISA CLIENT", MARGIN, y, { size: 22, bold: true, color: accent })
  drawText(
    `${clean(customerName(data.customer))}`,
    MARGIN, y - 22, { size: 13, bold: true },
  )
  y -= 42

  // ── DATE CLIENT ────────────────────────────────────────────
  drawText("Date client", MARGIN, y, { size: 11, bold: true, color: accent })
  y -= 14
  const c = data.customer
  const custDetails: Array<[string, string]> = [
    ["Tip", c.customer_type === "individual" ? "Persoana fizica" : c.customer_type === "association" ? "Asociatie" : "Persoana juridica"],
    ["Nume", customerName(c)],
    ["Telefon", c.phone],
  ]
  if (c.email) custDetails.push(["Email", c.email])
  if (c.cnp) custDetails.push(["CNP", c.cnp])
  if (c.cui) custDetails.push(["CUI", c.cui])

  for (const [k, v] of custDetails) {
    ensureSpace(16)
    drawText(k + ":", MARGIN, y, { size: 9, color: muted })
    drawText(clean(v), MARGIN + 100, y, { size: 10 })
    y -= 14
  }
  y -= 10

  // ── PER PROPRIETATE ────────────────────────────────────────
  if (data.properties.length === 0) {
    drawText("Nu sunt adrese inregistrate pentru acest client.", MARGIN, y, { size: 10, color: muted })
    y -= 20
  }

  for (const p of data.properties) {
    ensureSpace(80)
    hr(y); y -= 14
    drawText("Adresa", MARGIN, y, { size: 11, bold: true, color: accent })
    y -= 14
    const h = drawText(clean(addressLine(p)), MARGIN, y, { size: 10, bold: true, maxWidth: CONTENT_W })
    y -= h + 6

    if (p.equipments.length === 0) {
      drawText("  Nu sunt echipamente inregistrate.", MARGIN, y, { size: 10, color: muted })
      y -= 16
      continue
    }

    for (const eq of p.equipments) {
      ensureSpace(140)

      // Card echipament
      const cardStartY = y
      page.drawRectangle({
        x: MARGIN - 4, y: y - 100, width: CONTENT_W + 8, height: 104, color: softBg,
        opacity: 0.6,
      })

      drawText(
        clean(eq.typeLabel + (eq.is_active ? "" : " (dezactivat)")),
        MARGIN, y, { size: 11, bold: true, color: accent },
      )
      y -= 14

      const modelLine = [eq.brand, eq.model].filter(Boolean).join(" ")
      if (modelLine) {
        drawText(clean(modelLine), MARGIN, y, { size: 10, bold: true })
        y -= 12
      }
      if (eq.serial_number) {
        drawText(`S/N: ${clean(eq.serial_number)}`, MARGIN, y, { size: 9, color: muted })
        y -= 12
      }

      // 2-coloane de date
      const colLeft = MARGIN
      const colRight = MARGIN + CONTENT_W / 2
      let yLeft = y
      let yRight = y

      const dl = (x: number, yy: number, k: string, v: string) => {
        drawText(k, x, yy, { size: 8.5, color: muted })
        drawText(v, x, yy - 10, { size: 10 })
        return 24
      }

      const computedVerif = computeNextDue(eq.installation_date, eq.last_verificare_at, eq.defaultVerificareMonths)
      const computedRevizie = computeNextDue(eq.installation_date, eq.last_revizie_at, eq.defaultRevizieMonths)
      const verifDue = eq.next_verificare_due ?? computedVerif
      const revizieDue = eq.next_revizie_due ?? computedRevizie

      yLeft -= dl(colLeft, yLeft, "Instalat", fmtDate(eq.installation_date))
      yRight -= dl(colRight, yRight, "Fabricat", fmtDate(eq.manufacture_date))
      yLeft -= dl(colLeft, yLeft, "Ultima verificare", fmtDate(eq.last_verificare_at))
      yRight -= dl(colRight, yRight, "Urmatoarea verificare", fmtDate(verifDue))
      if (eq.defaultRevizieMonths || eq.last_revizie_at || revizieDue) {
        yLeft -= dl(colLeft, yLeft, "Ultima revizie", fmtDate(eq.last_revizie_at))
        yRight -= dl(colRight, yRight, "Urmatoarea revizie", fmtDate(revizieDue))
      }

      y = Math.min(yLeft, yRight) - 4

      if (eq.observations) {
        drawText("Observatii:", MARGIN, y, { size: 8.5, color: muted })
        const oH = drawText(clean(eq.observations), MARGIN + 70, y, { size: 9, maxWidth: CONTENT_W - 70 })
        y -= Math.max(oH, 14)
      }

      // Istoric documente
      if (eq.documents.length > 0) {
        ensureSpace(30 + eq.documents.length * 14)
        y -= 8
        drawText("Istoric verificari si revizii", MARGIN, y, { size: 10, bold: true })
        y -= 14

        // Header tabel
        drawText("Tip", MARGIN, y, { size: 8.5, bold: true, color: muted })
        drawText("Nr. doc", MARGIN + 90, y, { size: 8.5, bold: true, color: muted })
        drawText("Data", MARGIN + 200, y, { size: 8.5, bold: true, color: muted })
        drawText("Valabil pana", MARGIN + 270, y, { size: 8.5, bold: true, color: muted })
        drawText("Tehnician", MARGIN + 360, y, { size: 8.5, bold: true, color: muted })
        y -= 4
        hr(y); y -= 10

        for (const d of eq.documents) {
          ensureSpace(14)
          drawText(TYPE_SHORT[d.document_type] ?? d.document_type, MARGIN, y, { size: 9 })
          drawText(clean(d.document_number), MARGIN + 90, y, { size: 9 })
          drawText(fmtDate(d.issued_at), MARGIN + 200, y, { size: 9 })
          drawText(fmtDate(d.valid_until), MARGIN + 270, y, { size: 9 })
          drawText(clean(d.technician), MARGIN + 360, y, { size: 9, maxWidth: CONTENT_W - 360 })
          if (d.revoked_at) {
            page.drawText("REVOCAT", {
              x: MARGIN + CONTENT_W - 50, y, size: 8, font: fontBold,
              color: rgb(0.6, 0.11, 0.11),
            })
          }
          y -= 12
        }
      } else {
        y -= 4
        drawText(
          "Nu exista verificari/revizii inregistrate. Scadentele sunt calculate din data instalarii.",
          MARGIN, y, { size: 9, color: muted, maxWidth: CONTENT_W },
        )
        y -= 14
      }

      y -= 10
      void cardStartY
    }
  }

  // Footer pentru toate paginile
  drawFooter()
  const allPages = doc.getPages()
  for (let i = 0; i < allPages.length; i++) {
    const pp = allPages[i]
    pp.drawText(`Pagina ${i + 1} / ${allPages.length}`, {
      x: PAGE_W / 2 - 30, y: 18, size: 8, font, color: muted,
    })
  }

  return await doc.save()
}
