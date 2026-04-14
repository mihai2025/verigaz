// lib/pdf/templates/foaieTehnician.ts
// PDF cu programările unui tehnician pe o anumită perioadă.
// Format A4 portrait, antet firmă, tabel cu programări per zi, observații.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { TehnicianBookingRow } from "@/lib/reports/tehnicieni"

const DIA: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
}
function clean(t: string | null | undefined): string {
  if (!t) return ""
  return String(t).replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIA[ch] ?? ch)
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fmtDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

export type FoaieTehnicianData = {
  firm: {
    brand_name: string | null
    legal_name: string
    anre_authorization_no: string | null
    phone: string | null
    email: string | null
    sediu_adresa: string | null
    logo_url: string | null
  }
  technicianName: string
  periodFrom: string | null
  periodTo: string | null
  bookings: TehnicianBookingRow[]
}

export async function renderFoaieTehnician(data: FoaieTehnicianData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageSize: [number, number] = [595.28, 841.89]
  const MARGIN = 36
  const PAGE_W = pageSize[0]
  const PAGE_H = pageSize[1]
  const CONTENT_W = PAGE_W - 2 * MARGIN

  const accent = rgb(0.169, 0.420, 0.388)
  const muted = rgb(0.4, 0.42, 0.45)
  const ink = rgb(0.06, 0.08, 0.14)
  const line = rgb(0.82, 0.84, 0.88)
  const softBg = rgb(0.97, 0.98, 0.97)

  let page = doc.addPage(pageSize)
  let y = PAGE_H - MARGIN

  function newPage() {
    page = doc.addPage(pageSize)
    y = PAGE_H - MARGIN
    drawHeader(false)
  }
  function ensureSpace(h: number) {
    if (y - h < MARGIN + 25) newPage()
  }
  function draw(
    text: string, x: number, yy: number,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; maxWidth?: number } = {},
  ) {
    const size = opts.size ?? 9
    const f = opts.bold ? fontBold : font
    const str = clean(text)
    if (!opts.maxWidth) {
      page.drawText(str, { x, y: yy, size, font: f, color: opts.color ?? ink })
      return size + 2
    }
    const words = str.split(/\s+/)
    const lines: string[] = []
    let cur = ""
    for (const w of words) {
      const t = cur ? cur + " " + w : w
      if (f.widthOfTextAtSize(t, size) > opts.maxWidth) {
        if (cur) lines.push(cur)
        cur = w
      } else cur = t
    }
    if (cur) lines.push(cur)
    let lineY = yy
    for (const l of lines) {
      page.drawText(l, { x, y: lineY, size, font: f, color: opts.color ?? ink })
      lineY -= size + 2
    }
    return (size + 2) * lines.length
  }
  function hr(yy: number) {
    page.drawLine({
      start: { x: MARGIN, y: yy }, end: { x: PAGE_W - MARGIN, y: yy },
      color: line, thickness: 0.5,
    })
  }

  async function drawHeader(firstPage: boolean) {
    page.drawRectangle({ x: 0, y: PAGE_H - 5, width: PAGE_W, height: 5, color: accent })
    let logoH = 0
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
            const dims = img.scale(40 / img.height)
            page.drawImage(img, { x: MARGIN, y: y - dims.height, width: dims.width, height: dims.height })
            logoH = dims.height
          }
        }
      } catch {}
    }
    const titleX = logoH ? MARGIN + 50 : MARGIN
    draw(clean(data.firm.brand_name || data.firm.legal_name), titleX, y - 14, {
      size: 14, bold: true, color: accent,
    })
    const meta: string[] = []
    if (data.firm.anre_authorization_no) meta.push(`Aut. ANRE: ${data.firm.anre_authorization_no}`)
    if (data.firm.phone) meta.push(`Tel: ${data.firm.phone}`)
    if (data.firm.sediu_adresa) meta.push(data.firm.sediu_adresa)
    draw(meta.join("  ·  "), titleX, y - 28, { size: 7.5, color: muted, maxWidth: CONTENT_W - 50 })

    y -= Math.max(40, logoH + 8)
    hr(y); y -= 14

    if (firstPage) {
      draw("FOAIE PROGRAMĂRI TEHNICIAN", MARGIN, y, { size: 16, bold: true, color: accent })
      y -= 22
      draw(clean(data.technicianName), MARGIN, y, { size: 13, bold: true })
      y -= 16
      const period = data.periodFrom || data.periodTo
        ? `Perioadă: ${fmtDate(data.periodFrom)} – ${fmtDate(data.periodTo)}`
        : `Perioadă: toate programările active`
      draw(period, MARGIN, y, { size: 9, color: muted })
      y -= 10
      draw(`Total: ${data.bookings.length} programări`, MARGIN, y, { size: 9, color: muted })
      y -= 16
      hr(y); y -= 14
    }
  }

  await drawHeader(true)

  if (data.bookings.length === 0) {
    draw("Nu sunt programări pentru tehnicianul selectat în perioada specificată.",
      MARGIN, y, { size: 10, color: muted })
  }

  // Group by date (scheduled_start sau preferred_date)
  function bookingDayKey(b: TehnicianBookingRow): string {
    const iso = b.scheduledStart ?? b.preferredDate
    if (!iso) return "Fără dată"
    return fmtDate(iso)
  }

  let lastDay = ""
  for (const b of data.bookings) {
    const day = bookingDayKey(b)
    if (day !== lastDay) {
      ensureSpace(40)
      y -= 4
      page.drawRectangle({
        x: MARGIN - 4, y: y - 4, width: CONTENT_W + 8, height: 18, color: softBg, opacity: 0.7,
      })
      draw(`📅 ${day}`, MARGIN, y + 2, { size: 11, bold: true, color: accent })
      y -= 24
      lastDay = day
    }

    ensureSpace(110)

    // Time + ref
    const timeStr = b.scheduledStart
      ? new Date(b.scheduledStart).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })
      : (b.preferredTimeWindow ?? "—")
    draw(`⏰ ${timeStr}`, MARGIN, y, { size: 10, bold: true })
    draw(`Ref. ${b.publicRef}`, MARGIN + 100, y, { size: 9, color: muted })
    draw(b.status, PAGE_W - MARGIN - 60, y, { size: 9, color: muted })
    y -= 14

    // Customer
    draw(`👤 ${clean(b.customerFullName)} · ${b.customerPhone}`, MARGIN + 12, y, { size: 10 })
    y -= 12

    // Service
    if (b.serviceCategoryName) {
      draw(`🔧 ${clean(b.serviceCategoryName)}`, MARGIN + 12, y, { size: 9.5 })
      y -= 11
    }

    // Equipment
    if (b.equipmentInfo) {
      draw(`⚙️ ${clean(b.equipmentInfo)}`, MARGIN + 12, y, { size: 9, color: muted, maxWidth: CONTENT_W - 12 })
      y -= 11
    }

    // Address
    const addrLine = [
      b.address,
      b.blockName && `bl. ${b.blockName}`,
      b.apartment && `ap. ${b.apartment}`,
      b.floor && `et. ${b.floor}`,
    ].filter(Boolean).join(", ")
    const geo = [b.localitate, b.judet].filter(Boolean).join(", ")
    const fullAddr = [addrLine, geo].filter(Boolean).join(" · ")
    const addrH = draw(`📍 ${clean(fullAddr)}`, MARGIN + 12, y, { size: 9.5, maxWidth: CONTENT_W - 12 })
    y -= addrH

    // Notes
    if (b.notesCustomer) {
      const nH = draw(`Notă client: ${clean(b.notesCustomer)}`, MARGIN + 12, y, {
        size: 8.5, color: muted, maxWidth: CONTENT_W - 12,
      })
      y -= nH
    }
    if (b.notesInternal) {
      const nH = draw(`Notă internă: ${clean(b.notesInternal)}`, MARGIN + 12, y, {
        size: 8.5, color: muted, maxWidth: CONTENT_W - 12,
      })
      y -= nH
    }

    // Signature line
    y -= 6
    page.drawLine({
      start: { x: MARGIN + 12, y }, end: { x: MARGIN + 220, y },
      color: line, thickness: 0.4,
    })
    draw("Semnătură client", MARGIN + 12, y - 8, { size: 7, color: muted })
    y -= 18

    // Separator subtil între programări
    page.drawLine({
      start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
      color: line, thickness: 0.3, opacity: 0.5,
    })
    y -= 10
  }

  // Pagination footer
  const pages = doc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const pp = pages[i]
    pp.drawText(
      `Pagina ${i + 1} / ${pages.length}  ·  Generat: ${new Date().toLocaleString("ro-RO")}`,
      { x: MARGIN, y: 18, size: 7.5, font, color: muted },
    )
  }

  return await doc.save()
}
