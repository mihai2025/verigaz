// lib/utils/firmInitials.ts
//
// Extrage inițialele din numele firmei pentru fallback logo SVG.
// Strip sufixe juridice: SRL, SA, SRL-D, SNC, PFA, II, IF.
// Strip prefixe numerice ("01 FIRMA X" → "FIRMA X").
// Exemple:
//   "01 EVAM VERIFICARI SERVICE GAZ" → "EV"
//   "ABC GAZ SRL"                    → "AG"
//   "Instal Tech"                    → "IT"
//   "Gaz SA"                         → "G"

const SUFIXE_LEGALE = new Set([
  "srl", "sa", "srl-d", "srld", "snc", "pfa", "ii", "if",
  "sca", "sas", "scs", "n.v.", "s.a.", "s.r.l.", "s.c.",
])

const PREFIXE_IGNORATE = new Set([
  "sc", "s.c.", "s.c",
])

export function cleanFirmName(raw: string): string {
  if (!raw) return ""
  const words = raw
    .trim()
    .replace(/^\d+\s+/, "")                    // strip prefix numeric "01 "
    .replace(/[,\.]+$/, "")                    // strip punctuație finală
    .split(/\s+/)
    .filter(Boolean)

  // Strip prefix SC
  while (words.length > 1 && PREFIXE_IGNORATE.has(words[0].toLowerCase().replace(/\.+$/, ""))) {
    words.shift()
  }

  // Strip sufixe legale
  while (words.length > 1 && SUFIXE_LEGALE.has(words[words.length - 1].toLowerCase().replace(/\.+$/, ""))) {
    words.pop()
  }

  return words.join(" ")
}

export function firmInitials(raw: string, max = 2): string {
  const clean = cleanFirmName(raw)
  if (!clean) return "?"
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return words.slice(0, max).map((w) => w.charAt(0).toUpperCase()).join("")
}

/**
 * Hash deterministic pt. alegerea culorii SVG pe baza numelui firmei.
 * Returnează index în paleta definită.
 */
export function firmColorIndex(name: string, paletteSize: number): number {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % paletteSize
}
