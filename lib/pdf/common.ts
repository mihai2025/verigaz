// lib/pdf/common.ts
// Helpere partajate între template-urile de documente PDF.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib"
import QRCode from "qrcode"

export const PAGE = { width: 595.28, height: 841.89 } // A4 portrait (pt)
export const MARGIN = 48
export const COLORS = {
  ink: rgb(0.1, 0.11, 0.12),
  muted: rgb(0.4, 0.42, 0.45),
  accent: rgb(0.05, 0.42, 0.38),
  line: rgb(0.82, 0.84, 0.88),
}

export type PdfContext = {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  fontBold: PDFFont
  cursorY: number
}

export async function newPdf(): Promise<PdfContext> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([PAGE.width, PAGE.height])
  return { doc, page, font, fontBold, cursorY: PAGE.height - MARGIN }
}

export function drawText(
  ctx: PdfContext,
  text: string,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; y?: number } = {},
) {
  const size = opts.size ?? 10
  const font = opts.bold ? ctx.fontBold : ctx.font
  ctx.page.drawText(text, {
    x: opts.x ?? MARGIN,
    y: opts.y ?? ctx.cursorY,
    size,
    font,
    color: opts.color ?? COLORS.ink,
  })
}

export function advance(ctx: PdfContext, dy: number) {
  ctx.cursorY -= dy
}

export function hr(ctx: PdfContext) {
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.cursorY },
    end: { x: PAGE.width - MARGIN, y: ctx.cursorY },
    color: COLORS.line,
    thickness: 0.5,
  })
  advance(ctx, 10)
}

export function h1(ctx: PdfContext, text: string) {
  drawText(ctx, text, { size: 18, bold: true, color: COLORS.accent })
  advance(ctx, 24)
}

export function h2(ctx: PdfContext, text: string) {
  drawText(ctx, text, { size: 12, bold: true })
  advance(ctx, 16)
}

export function p(ctx: PdfContext, text: string, opts: { size?: number; bold?: boolean } = {}) {
  drawText(ctx, text, { size: opts.size ?? 10, bold: opts.bold })
  advance(ctx, (opts.size ?? 10) + 4)
}

export function kv(ctx: PdfContext, key: string, value: string) {
  drawText(ctx, key, { size: 9, color: COLORS.muted })
  drawText(ctx, value, { size: 10, x: MARGIN + 140 })
  advance(ctx, 16)
}

export async function drawQr(
  ctx: PdfContext,
  data: string,
  opts: { x?: number; y?: number; size?: number } = {},
) {
  const png = await QRCode.toBuffer(data, { type: "png", margin: 1, width: 400, errorCorrectionLevel: "M" })
  const img = await ctx.doc.embedPng(png)
  const size = opts.size ?? 80
  ctx.page.drawImage(img, {
    x: opts.x ?? PAGE.width - MARGIN - size,
    y: opts.y ?? MARGIN,
    width: size,
    height: size,
  })
}

/**
 * Strip Romanian diacritics pentru compatibilitate cu StandardFonts Helvetica
 * care nu conține caractere extinse. Caracterele rămase (ex: ă, ș) ar produce
 * WinAnsi encoding errors. Acceptabil pentru certificate MVP — V2 va folosi
 * un font TTF cu suport complet (fontkit + Inter/Roboto).
 */
const DIA: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
}
export function sanitize(text: string): string {
  return text.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIA[ch] ?? ch)
}
