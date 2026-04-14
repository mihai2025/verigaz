#!/usr/bin/env node
/**
 * import-edib-firms.mjs
 *
 * Importează firmele cu autorizație ANRE tip EDIB din E:/verigaz/edib.xlsx
 * în tabela public.gas_firms.
 *
 * Reguli:
 *   - Doar rândurile cu TipAutorizatie = "EDIB"
 *   - Status "Acordata" (altele skip)
 *   - Match judet + localitate după normalizare diacritice cu tabelele noastre
 *   - Dacă match perfect → setează sediu_judet_id + sediu_localitate_id
 *   - Dacă nu → salvează firma dar cu FK null (se corectează manual)
 *   - Slug unic derivat din denumire
 *   - Parsează telefonul (primul număr valid), separă adresa
 *   - verification_status = 'approved' (deja e registru oficial ANRE)
 *   - DataExpirare = Excel serial date → ISO
 *
 * Usage:  node scripts/import-edib-firms.mjs
 *         node scripts/import-edib-firms.mjs --dry (doar raportare)
 */

import { readFileSync } from "node:fs"
import XLSX from "xlsx"
import pg from "pg"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DRY = process.argv.includes("--dry")

// Load env
const env = {}
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2]
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
  env[m[1]] = v
}

const DIA = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
}
function normalize(s) {
  if (!s) return ""
  return String(s)
    .normalize("NFC")
    .replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIA[ch] ?? ch)
    .trim()
    .toLowerCase()
    // Prefixuri comune din xlsx ANRE care nu sunt în DB-ul nostru
    .replace(/^(mun\.?|oras\.?|com\.?|sat\.?)\s+/i, "")
    // Uniformizează dash-urile cu spații
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
function slugifyRO(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIA[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
function excelSerialToISO(v) {
  if (v == null || v === "") return null
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return null
  // Excel epoch: 1899-12-30 (accounts for leap year bug)
  const ms = (n - 25569) * 86400000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}
function parsePhone(raw) {
  if (!raw) return null
  const clean = String(raw).replace(/[^\d+\/,;\s-]/g, "")
  const match = clean.match(/0?\d{9,11}/)
  if (!match) return null
  let num = match[0]
  if (num.startsWith("07") && num.length === 10) return num
  if (num.startsWith("02") && num.length === 10) return num
  if (num.startsWith("03") && num.length === 10) return num
  if (num.length >= 10) return num
  return null
}
function parseAdminName(repr) {
  if (!repr) return null
  // "Administrator : Nume Prenume" → "Nume Prenume"
  const m = String(repr).match(/:\s*(.+?)\s*$/)
  return m ? m[1].trim() : String(repr).trim()
}

async function main() {
  console.log("→ Reading edib.xlsx...")
  const wb = XLSX.readFile("E:/verigaz/edib.xlsx", { raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const range = XLSX.utils.decode_range(ws["!ref"])

  // Index coloane
  const col = {
    nrCrt: 0, societate: 1, sediu: 2, localitate: 3, judet: 4,
    telefonFax: 5, reprezentant: 6, nrAutorizatie: 7, tipAutorizatie: 8,
    dataEmitere: 9, dataExpirare: 10, stare: 11,
  }
  function cell(r, c) {
    const addr = XLSX.utils.encode_cell({ c, r })
    const v = ws[addr]?.v
    return v == null ? "" : String(v)
  }

  // Filter EDIB + acordată
  const rows = []
  for (let r = 1; r <= range.e.r; r++) {
    const tip = cell(r, col.tipAutorizatie).trim()
    if (tip !== "EDIB") continue
    const stare = cell(r, col.stare).trim()
    if (stare.toLowerCase() !== "acordata") continue
    rows.push({
      societate: cell(r, col.societate).trim(),
      sediu: cell(r, col.sediu).trim(),
      localitate: cell(r, col.localitate).trim(),
      judet: cell(r, col.judet).trim(),
      telefonFax: cell(r, col.telefonFax).trim(),
      reprezentant: cell(r, col.reprezentant).trim(),
      nrAutorizatie: cell(r, col.nrAutorizatie).trim(),
      dataEmitere: excelSerialToISO(cell(r, col.dataEmitere)),
      dataExpirare: excelSerialToISO(cell(r, col.dataExpirare)),
    })
  }
  console.log(`  ${rows.length} rânduri EDIB acordate`)

  // Connect DB + încarcă judet/localitate maps
  const client = new pg.Client({
    connectionString: env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  const { rows: judete } = await client.query("select id, nume from judete")
  const judeteMap = new Map(judete.map((j) => [normalize(j.nume), j.id]))

  const { rows: localitati } = await client.query(
    "select id, judet_id, nume from localitati"
  )
  // Map localitate: key = judetId|normNume → localitateId
  const locMap = new Map()
  for (const l of localitati) {
    locMap.set(`${l.judet_id}|${normalize(l.nume)}`, l.id)
  }

  console.log(`  Maps încărcate: ${judete.length} judete, ${localitati.length} localități`)

  // Pre-process: match judet + localitate + detect duplicate slug
  const stats = {
    total: rows.length,
    judetMatched: 0,
    judetMissing: 0,
    localitateMatched: 0,
    localitateMissing: 0,
    inserted: 0,
    skipped: 0,
    errors: 0,
  }
  const unmatchedJudete = new Set()
  const unmatchedLocalitati = new Set()
  const existingSlugs = new Set()

  const { rows: existingFirms } = await client.query(
    "select slug, cui, anre_authorization_no from gas_firms"
  )
  for (const f of existingFirms) {
    if (f.slug) existingSlugs.add(f.slug)
  }
  const existingAnreNos = new Set(
    existingFirms.map((f) => f.anre_authorization_no).filter(Boolean),
  )

  for (const row of rows) {
    const judetId = judeteMap.get(normalize(row.judet))
    if (judetId) stats.judetMatched++
    else {
      stats.judetMissing++
      unmatchedJudete.add(row.judet)
    }

    let localitateId = null
    if (judetId) {
      localitateId = locMap.get(`${judetId}|${normalize(row.localitate)}`) ?? null
      if (localitateId) stats.localitateMatched++
      else {
        stats.localitateMissing++
        unmatchedLocalitati.add(`${row.judet}/${row.localitate}`)
      }
    }

    // Skip dacă firma există deja cu același nr autorizație
    if (existingAnreNos.has(row.nrAutorizatie)) {
      stats.skipped++
      continue
    }

    // Slug unic
    let baseSlug = slugifyRO(row.societate).slice(0, 60) || "firma"
    let slug = baseSlug
    let i = 2
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${i}`
      i++
      if (i > 200) break
    }
    existingSlugs.add(slug)

    // Extract admin name + phone
    const phone = parsePhone(row.telefonFax)
    const adminName = parseAdminName(row.reprezentant)

    if (DRY) {
      stats.inserted++
      continue
    }

    try {
      await client.query(
        `insert into gas_firms (
          slug, legal_name, brand_name, anre_authorization_no, anre_category,
          anre_valid_until, sediu_adresa, sediu_judet_id, sediu_localitate_id,
          phone, contact_person_name,
          verification_status, verified_at, is_active, plan
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          slug,
          row.societate,
          row.societate, // brand = legal la import; firma își poate edita ulterior
          row.nrAutorizatie,
          "EDIB",
          row.dataExpirare,
          row.sediu || null,
          judetId,
          localitateId,
          phone,
          adminName,
          "approved",
          new Date().toISOString(),
          true,
          "free",
        ],
      )
      stats.inserted++
    } catch (err) {
      stats.errors++
      console.error(`  ✗ ${row.societate} (${row.nrAutorizatie}):`, err.message.slice(0, 100))
    }
  }

  await client.end()

  console.log("\n=== REZULTAT ===")
  console.log(`Total rânduri EDIB acordate:         ${stats.total}`)
  console.log(`Județ matchat:                        ${stats.judetMatched}`)
  console.log(`Județ NU matchat:                     ${stats.judetMissing}`)
  console.log(`Localitate matchată:                  ${stats.localitateMatched}`)
  console.log(`Localitate NU matchată:               ${stats.localitateMissing}`)
  console.log(`Deja existente (skip):                ${stats.skipped}`)
  console.log(`${DRY ? "AR FI inserate (dry)" : "Inserate"}:                   ${stats.inserted}`)
  console.log(`Erori:                                ${stats.errors}`)

  if (unmatchedJudete.size > 0) {
    console.log("\nJudețe nematchate:", [...unmatchedJudete].slice(0, 10).join(", "))
  }
  if (unmatchedLocalitati.size > 0 && unmatchedLocalitati.size < 30) {
    console.log("\nLocalități nematchate:")
    for (const l of [...unmatchedLocalitati].slice(0, 30)) console.log("  -", l)
  } else if (unmatchedLocalitati.size >= 30) {
    console.log(`\nLocalități nematchate: ${unmatchedLocalitati.size} (prea multe pentru listing)`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
