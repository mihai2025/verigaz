// lib/utils/slugify.ts

const DIACRITICS: Record<string, string> = {
  ă: "a",
  â: "a",
  î: "i",
  ș: "s",
  ş: "s",
  ț: "t",
  ţ: "t",
  Ă: "a",
  Â: "a",
  Î: "i",
  Ș: "s",
  Ş: "s",
  Ț: "t",
  Ţ: "t",
}

/**
 * Strip Romanian diacritics only (preserves spaces, punctuation, casing).
 * "Iași" → "Iasi", "București" → "Bucuresti"
 */
export function stripDiacritics(text: string): string {
  return text.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIACRITICS[ch] ?? ch)
}

/**
 * Deterministic slug for Romanian text.
 * Lowercases, replaces RO diacritics, strips non-alphanumeric to "-", trims dashes.
 */
export function slugifyRO(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIACRITICS[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
