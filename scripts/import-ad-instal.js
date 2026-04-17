// scripts/import-ad-instal.js
// Import date din baza veche (AD INSTAL GAZ, Roșiori de Vede) în verigaz prod.
//
// Usage:
//   node scripts/import-ad-instal.js --dry       — simulează, nu scrie nimic
//   node scripts/import-ad-instal.js --execute   — scrie în verigaz
//
// Ordine operații:
//   1. salariati → firm_employees
//   2. proprietari → customers (+ firm_customer_links)
//   3. adrese → properties
//   4. verificari → property_equipments (instalație gaz)
//   5. centrale_termice → property_equipments (centrală)
//   6. revizii → completează last_revizie_at + next_revizie_due pe instalație

const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

// ── Load env ──────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env.local")
const envText = fs.readFileSync(envPath, "utf8")
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const OLD_DB_URL = "postgres://postgres.khxxibauxdxsdkeorhvl:R48DO90kvkwOkEe0@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify"
const NEW_DB_URL = process.env.SUPABASE_DB_URL

const FIRM_ID = "08919a0d-30b4-46f2-b3cf-4024f459cb47"
const JUDET_TELEORMAN = 26
const EQUIPMENT_TYPE_INSTALATIE = 1
const EQUIPMENT_TYPE_CENTRALA = 2
const IMPORT_TAG = "ad-instal-2026-04-17"

const DRY = process.argv.includes("--dry")
const EXEC = process.argv.includes("--execute")
if (!DRY && !EXEC) {
  console.error("Usage: node scripts/import-ad-instal.js [--dry | --execute]")
  process.exit(1)
}

// ── Helpers ────────────────────────────────────────────
function normalize(s) {
  if (!s) return ""
  return s.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function isoOrNull(d) {
  if (!d) return null
  if (typeof d === "string") return d.slice(0, 10)
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return null
}

// ── Main ───────────────────────────────────────────────
;(async () => {
  const oldC = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false } })
  const newC = new Client({ connectionString: NEW_DB_URL, ssl: { rejectUnauthorized: false } })
  await oldC.connect()
  await newC.connect()

  console.log(`Mode: ${DRY ? "DRY-RUN (nu scrie)" : "EXECUTE (scrie în verigaz)"}`)
  console.log(`Firma țintă: AD INSTAL GAZ (${FIRM_ID})\n`)

  // Fetch firm owner pt added_by
  const { rows: firmRow } = await newC.query(`select owner_user_id from gas_firms where id = $1`, [FIRM_ID])
  const ownerUserId = firmRow[0]?.owner_user_id ?? null
  console.log(`owner_user_id: ${ownerUserId}\n`)

  // ── 1. Pre-load Teleorman localities ─────────────────
  console.log("▶ Load localități Teleorman...")
  const { rows: locRows } = await newC.query(
    `select id, nume from localitati where judet_id = $1`,
    [JUDET_TELEORMAN],
  )
  const locByNorm = new Map()
  for (const l of locRows) locByNorm.set(normalize(l.nume), l.id)
  console.log(`   ${locRows.length} localități Teleorman încărcate.\n`)

  function resolveLocalitate(text) {
    if (!text) return { id: null, matched: false, text }
    const norm = normalize(text)
    let id = locByNorm.get(norm)
    if (id) return { id, matched: true, text }
    // Variante: "roșiori de vede", "rosiorii de vede", fără "de vede"
    const variants = [
      norm.replace(/\s+de\s+vede$/, ""),
      norm + " de vede",
      norm.replace(/ii$/, ""),
      norm.replace(/i$/, "ii"),
    ]
    for (const v of variants) {
      id = locByNorm.get(v)
      if (id) return { id, matched: true, text }
    }
    return { id: null, matched: false, text }
  }

  // ── 2. Fetch all old data ────────────────────────────
  console.log("▶ Load date vechi...")
  const { rows: oldSalariati } = await oldC.query(`select * from salariati`)
  const { rows: oldProprietari } = await oldC.query(`select * from proprietari`)
  const { rows: oldAdrese } = await oldC.query(`select * from adrese`)
  const { rows: oldVerificari } = await oldC.query(`select * from verificari`)
  const { rows: oldCentrale } = await oldC.query(`select * from centrale_termice`)
  const { rows: oldRevizii } = await oldC.query(`select * from revizii`)
  console.log(`   salariati=${oldSalariati.length} proprietari=${oldProprietari.length} adrese=${oldAdrese.length}`)
  console.log(`   verificari=${oldVerificari.length} centrale=${oldCentrale.length} revizii=${oldRevizii.length}\n`)

  // ── 3. IMPORT SALARIATI ──────────────────────────────
  console.log("▶ Import salariati → firm_employees")
  const salariatMap = new Map() // old id → new id
  for (const s of oldSalariati) {
    const fullName = [s.prenume, s.nume].filter(Boolean).join(" ").trim() || s.nume
    if (!fullName) continue

    // Dedup pe (firm_id, employee_code)
    let existingId = null
    if (s.cod_angajat) {
      const { rows } = await newC.query(
        `select id from firm_employees where firm_id = $1 and employee_code = $2`,
        [FIRM_ID, s.cod_angajat],
      )
      existingId = rows[0]?.id ?? null
    }
    if (existingId) {
      salariatMap.set(s.id, existingId)
      console.log(`   = ${fullName} (existent ${existingId.slice(0, 8)})`)
      continue
    }

    if (DRY) {
      console.log(`   + ${fullName} (${s.cod_angajat ?? "fără cod"})`)
      salariatMap.set(s.id, "DRY-" + s.id.slice(0, 8))
    } else {
      const { rows } = await newC.query(
        `insert into firm_employees (firm_id, full_name, employee_code, phone, email, is_active)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [FIRM_ID, fullName, s.cod_angajat || null, s.telefon || null, s.email || null, s.activ ?? true],
      )
      salariatMap.set(s.id, rows[0].id)
      console.log(`   + ${fullName} → ${rows[0].id.slice(0, 8)}`)
    }
  }
  console.log()

  // ── 4. IMPORT PROPRIETARI → customers ────────────────
  console.log("▶ Import proprietari → customers")
  const customerMap = new Map() // old id → new id
  let created = 0, linked = 0, skipped = 0
  for (const p of oldProprietari) {
    const nume = (p.nume ?? "").trim()
    const prenume = (p.prenume ?? "").trim()
    const fullName = [prenume, nume].filter(Boolean).join(" ")
    if (!fullName) { skipped++; continue }

    let customerId = null
    // Dedup pe telefon (dacă setat)
    if (p.telefon) {
      const cleanPhone = p.telefon.replace(/\s+/g, "")
      const { rows } = await newC.query(`select id from customers where phone = $1`, [cleanPhone])
      if (rows[0]) {
        customerId = rows[0].id
        linked++
      }
    }

    if (!customerId) {
      if (DRY) {
        customerId = "DRY-" + p.id.slice(0, 8)
      } else {
        const { rows } = await newC.query(
          `insert into customers (phone, email, cnp, customer_type, full_name, first_name, last_name)
           values ($1, $2, $3, 'individual', $4, $5, $6) returning id`,
          [
            p.telefon ? p.telefon.replace(/\s+/g, "") : null,
            p.email || null,
            p.cnp || null,
            fullName,
            prenume || null,
            nume || null,
          ],
        )
        customerId = rows[0].id
      }
      created++
    }
    customerMap.set(p.id, customerId)

    // Link firm ↔ customer (ON CONFLICT DO NOTHING)
    if (!DRY) {
      await newC.query(
        `insert into firm_customer_links (firm_id, customer_id, added_by, notes)
         values ($1, $2, $3, $4) on conflict (firm_id, customer_id) do nothing`,
        [FIRM_ID, customerId, ownerUserId, `import ${IMPORT_TAG}`],
      )
    }
  }
  console.log(`   Created: ${created}, Linked existing: ${linked}, Skipped: ${skipped}\n`)

  // ── 5. IMPORT ADRESE → properties ────────────────────
  console.log("▶ Import adrese → properties")
  const propertyMap = new Map() // old id → new id
  const unresolvedLocalities = new Set()
  let pCreated = 0, pLinked = 0, pSkipped = 0
  for (const a of oldAdrese) {
    const customerId = customerMap.get(a.proprietar_id)
    if (!customerId) { pSkipped++; continue }

    const addressText = [a.strada, a.numar].filter(Boolean).join(" ").trim()
    if (!addressText) { pSkipped++; continue }

    const propertyType = (a.bloc || a.scara) ? "apartment" : "house"
    const { id: localitateId, matched } = resolveLocalitate(a.localitate)
    if (!matched && a.localitate) unresolvedLocalities.add(a.localitate)

    // Construiește notes cu fallback localitate dacă nu a fost matched
    const notes = !matched && a.localitate
      ? `[import ${IMPORT_TAG}] Localitate: ${a.localitate}`
      : `[import ${IMPORT_TAG}]`

    // Dedup: (customer_id, address)
    if (!DRY) {
      const { rows: existing } = await newC.query(
        `select id from properties where customer_id = $1 and address = $2 limit 1`,
        [customerId, addressText],
      )
      if (existing[0]) {
        propertyMap.set(a.id, existing[0].id)
        pLinked++
        continue
      }
      const { rows } = await newC.query(
        `insert into properties (customer_id, property_type, address, judet_id, localitate_id,
            block_name, stair, apartment, floor, notes)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [
          customerId, propertyType, addressText, JUDET_TELEORMAN, localitateId,
          a.bloc || null, a.scara || null, a.apartament || null, a.etaj || null, notes,
        ],
      )
      propertyMap.set(a.id, rows[0].id)
      pCreated++
    } else {
      propertyMap.set(a.id, "DRY-" + a.id.slice(0, 8))
      pCreated++
    }
  }
  console.log(`   Created: ${pCreated}, Linked existing: ${pLinked}, Skipped: ${pSkipped}`)
  if (unresolvedLocalities.size > 0) {
    console.log(`   ⚠ Localități nerezolvate (text păstrat în notes): ${[...unresolvedLocalities].join(", ")}`)
  }
  console.log()

  // ── 6. AGGREGATE VERIFICARI + REVIZII pe adresă (cea mai recentă câștigă) ─
  console.log("▶ Agregare verificări + revizii per adresă (cea mai recentă)")
  const latestVerif = new Map() // old adresa_id → { data_verificare, valabilitate, numar_document, observatii }
  for (const v of oldVerificari) {
    if (!v.adresa_id) continue
    const cur = latestVerif.get(v.adresa_id)
    if (!cur || new Date(v.data_verificare) > new Date(cur.data_verificare)) {
      latestVerif.set(v.adresa_id, v)
    }
  }
  const latestRevizie = new Map()
  for (const r of oldRevizii) {
    if (!r.adresa_id) continue
    const cur = latestRevizie.get(r.adresa_id)
    if (!cur || new Date(r.data_revizie) > new Date(cur.data_revizie)) {
      latestRevizie.set(r.adresa_id, r)
    }
  }
  console.log(`   Adrese cu verificări: ${latestVerif.size}`)
  console.log(`   Adrese cu revizii: ${latestRevizie.size}\n`)

  // ── 7. IMPORT property_equipments instalație gaz (verif + rev combinat) ─
  console.log("▶ Creare property_equipments instalație gaz (verif + rev combinat)")
  const instalatieByProperty = new Map() // new property_id → new equipment_id
  let iCreated = 0, iLinked = 0, iSkipped = 0
  const allAdresaIds = new Set([...latestVerif.keys(), ...latestRevizie.keys()])
  for (const adresaId of allAdresaIds) {
    const propertyId = propertyMap.get(adresaId)
    if (!propertyId) { iSkipped++; continue }

    const v = latestVerif.get(adresaId)
    const r = latestRevizie.get(adresaId)
    const lastVerif = isoOrNull(v?.data_verificare)
    const nextVerif = isoOrNull(v?.valabilitate)
    const lastRev = isoOrNull(r?.data_revizie)
    const nextRev = isoOrNull(r?.valabilitate)

    const notes = [
      `[import ${IMPORT_TAG}]`,
      v?.numar_document ? `Verif nr: ${v.numar_document}` : null,
      r?.numar_document ? `Revizie nr: ${r.numar_document}` : null,
      v?.observatii,
      r?.observatii,
    ].filter(Boolean).join(" | ")

    if (DRY) {
      instalatieByProperty.set(propertyId, "DRY-" + String(adresaId).slice(0, 8))
      iCreated++
      continue
    }

    // Dedup
    const { rows: existing } = await newC.query(
      `select id from property_equipments where property_id = $1 and equipment_type_id = $2 limit 1`,
      [propertyId, EQUIPMENT_TYPE_INSTALATIE],
    )
    if (existing[0]) {
      instalatieByProperty.set(propertyId, existing[0].id)
      iLinked++
      continue
    }

    const { rows } = await newC.query(
      `insert into property_equipments (property_id, equipment_type_id,
          last_verificare_at, next_verificare_due, last_revizie_at, next_revizie_due,
          observations, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, true) returning id`,
      [propertyId, EQUIPMENT_TYPE_INSTALATIE, lastVerif, nextVerif, lastRev, nextRev, notes],
    )
    instalatieByProperty.set(propertyId, rows[0].id)
    iCreated++
  }
  console.log(`   Created: ${iCreated}, Linked: ${iLinked}, Skipped: ${iSkipped}\n`)

  // ── 8. IMPORT CENTRALE → property_equipments (centrală) ─
  console.log("▶ Import centrale_termice → property_equipments (centrală)")
  let cCreated = 0, cSkipped = 0
  for (const c of oldCentrale) {
    const propertyId = propertyMap.get(c.adresa_id)
    if (!propertyId) { cSkipped++; continue }

    const lastVerif = isoOrNull(c.data_verificare)
    const nextVerif = isoOrNull(c.valabilitate)

    if (DRY) { cCreated++; continue }

    // Dedup: (property_id, equipment_type_id=2, serial_number=numar_document)
    const { rows: existing } = await newC.query(
      `select id from property_equipments
       where property_id = $1 and equipment_type_id = $2 and coalesce(serial_number, '') = $3 limit 1`,
      [propertyId, EQUIPMENT_TYPE_CENTRALA, c.numar_document || ""],
    )
    if (existing[0]) { cSkipped++; continue }

    const notes = [
      `[import ${IMPORT_TAG}]`,
      c.observatii,
    ].filter(Boolean).join(" | ")

    await newC.query(
      `insert into property_equipments (property_id, equipment_type_id, model, serial_number,
          last_verificare_at, next_verificare_due, observations, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, true)`,
      [propertyId, EQUIPMENT_TYPE_CENTRALA,
       c.model_centrala || null, c.numar_document || null,
       lastVerif, nextVerif, notes],
    )
    cCreated++
  }
  console.log(`   Created: ${cCreated}, Skipped (dedup/missing): ${cSkipped}\n`)

  // ── Summary ──────────────────────────────────────────
  console.log("═══ SUMMARY ═══")
  console.log(`Salariati mapați: ${salariatMap.size}`)
  console.log(`Proprietari mapați: ${customerMap.size}`)
  console.log(`Adrese mapate: ${propertyMap.size}`)
  console.log(`Echipamente instalație: ${instalatieByProperty.size}`)
  console.log(`Localități nerezolvate: ${unresolvedLocalities.size}`)

  await oldC.end()
  await newC.end()
  console.log(`\n${DRY ? "DRY-RUN complet — nimic scris." : "EXECUTE complet — date scrise în verigaz."}`)
})().catch((e) => { console.error("FAIL:", e.message); console.error(e.stack); process.exit(1) })
