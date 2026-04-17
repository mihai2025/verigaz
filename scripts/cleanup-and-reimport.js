// scripts/cleanup-and-reimport.js
// Șterge tot ce a importat scriptul anterior pentru firma AD INSTAL (cascade)
// apoi reexecută importul cu dedup pe telefon DEZACTIVAT.
const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

const envText = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
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

function normalize(s) {
  if (!s) return ""
  return s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
}
function isoStr(d) {
  if (!d) return null
  if (typeof d === "string") return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

;(async () => {
  const oldC = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false } })
  const newC = new Client({ connectionString: NEW_DB_URL, ssl: { rejectUnauthorized: false } })
  await oldC.connect()
  await newC.connect()

  // ── CLEANUP ────────────────────────────────────────────
  console.log("🗑  CLEANUP: ștergere import vechi AD INSTAL")

  // Ia toți customerii linkuiți la firma
  const { rows: linkedRows } = await newC.query(
    `select customer_id from firm_customer_links where firm_id = $1`, [FIRM_ID],
  )
  const customerIds = linkedRows.map((r) => r.customer_id)
  console.log(`   ${customerIds.length} customers linkuiți la firma`)

  if (customerIds.length > 0) {
    // Safety: verifică că niciunul nu are bookings/contracts cu ALTĂ firmă
    const { rows: otherBks } = await newC.query(
      `select count(*)::int as n from bookings where customer_id = any($1::uuid[]) and firm_id <> $2`,
      [customerIds, FIRM_ID],
    )
    const { rows: otherContracts } = await newC.query(
      `select count(*)::int as n from contracts where customer_id = any($1::uuid[]) and firm_id <> $2`,
      [customerIds, FIRM_ID],
    )
    const { rows: otherLinks } = await newC.query(
      `select count(*)::int as n from firm_customer_links where customer_id = any($1::uuid[]) and firm_id <> $2`,
      [customerIds, FIRM_ID],
    )
    console.log(`   Other firm bookings: ${otherBks[0].n}, contracts: ${otherContracts[0].n}, links: ${otherLinks[0].n}`)
    if (otherBks[0].n > 0 || otherContracts[0].n > 0 || otherLinks[0].n > 0) {
      console.log("   ⚠ Unii clienți sunt linkuiți și la alte firme — nu-i șterg.")
      console.log("   Continui doar cu cei exclusivi AD INSTAL.")
    }

    // Șterge — customers on delete cascadează pe properties → property_equipments
    //         pe bookings (nullable, dar 0 aici)
    //         pe firm_customer_links (on delete cascade)
    //         pe contract_equipments (nu cazul)
    const { rowCount: delCust } = await newC.query(
      `delete from customers where id = any($1::uuid[]) and not exists (
         select 1 from firm_customer_links l where l.customer_id = customers.id and l.firm_id <> $2
       ) and not exists (
         select 1 from bookings b where b.customer_id = customers.id and b.firm_id <> $2
       ) and not exists (
         select 1 from contracts c where c.customer_id = customers.id and c.firm_id <> $2
       )`,
      [customerIds, FIRM_ID],
    )
    console.log(`   ✅ Șterse ${delCust} customers (cascade la properties + equipment + links)`)
  }

  // Șterge și firm_employees importați
  const { rowCount: delEmp } = await newC.query(
    `delete from firm_employees where firm_id = $1`, [FIRM_ID],
  )
  console.log(`   ✅ Șterse ${delEmp} firm_employees\n`)

  // ── RE-IMPORT FĂRĂ DEDUP PE TELEFON ────────────────────
  console.log("📥 RE-IMPORT AD INSTAL (fără dedup telefon)\n")

  const { rows: firmRow } = await newC.query(`select owner_user_id from gas_firms where id = $1`, [FIRM_ID])
  const ownerUserId = firmRow[0]?.owner_user_id ?? null

  // Load localități
  const { rows: locRows } = await newC.query(`select id, nume from localitati where judet_id = $1`, [JUDET_TELEORMAN])
  const locByNorm = new Map()
  for (const l of locRows) locByNorm.set(normalize(l.nume), l.id)
  function resolveLoc(text) {
    if (!text) return null
    const n = normalize(text)
    let id = locByNorm.get(n)
    if (id) return id
    for (const v of [n.replace(/\s+de\s+vede$/, ""), n + " de vede", n.replace(/ii$/, ""), n.replace(/i$/, "ii")]) {
      id = locByNorm.get(v)
      if (id) return id
    }
    return null
  }

  // Load old data
  const { rows: oldSal } = await oldC.query(`select * from salariati`)
  const { rows: oldProp } = await oldC.query(`select * from proprietari`)
  const { rows: oldAdr } = await oldC.query(`select * from adrese`)
  const { rows: oldVer } = await oldC.query(`select * from verificari`)
  const { rows: oldCen } = await oldC.query(`select * from centrale_termice`)
  const { rows: oldRev } = await oldC.query(`select * from revizii`)

  // Salariati
  console.log("▶ Salariati")
  const salMap = new Map()
  for (const s of oldSal) {
    const fullName = [s.prenume, s.nume].filter(Boolean).join(" ").trim() || s.nume
    if (!fullName) continue
    const { rows } = await newC.query(
      `insert into firm_employees (firm_id, full_name, employee_code, phone, email, is_active)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [FIRM_ID, fullName, s.cod_angajat || null, s.telefon || null, s.email || null, s.activ ?? true],
    )
    salMap.set(s.id, rows[0].id)
  }
  console.log(`   + ${salMap.size} salariați\n`)

  // Customers — FĂRĂ DEDUP
  console.log("▶ Customers (fără dedup telefon)")
  const custMap = new Map()
  for (const p of oldProp) {
    const nume = (p.nume ?? "").trim()
    const prenume = (p.prenume ?? "").trim()
    const fullName = [prenume, nume].filter(Boolean).join(" ")
    if (!fullName) continue
    const cleanPhone = p.telefon ? p.telefon.replace(/\s+/g, "") : null
    const { rows } = await newC.query(
      `insert into customers (phone, email, cnp, customer_type, full_name, first_name, last_name)
       values ($1, $2, $3, 'individual', $4, $5, $6) returning id`,
      [cleanPhone, p.email || null, p.cnp || null, fullName, prenume || null, nume || null],
    )
    custMap.set(p.id, rows[0].id)
    await newC.query(
      `insert into firm_customer_links (firm_id, customer_id, added_by, notes)
       values ($1, $2, $3, $4) on conflict (firm_id, customer_id) do nothing`,
      [FIRM_ID, rows[0].id, ownerUserId, `import ${IMPORT_TAG}`],
    )
  }
  console.log(`   + ${custMap.size} customers\n`)

  // Properties
  console.log("▶ Properties")
  const propMap = new Map()
  let propCreated = 0
  for (const a of oldAdr) {
    const customerId = custMap.get(a.proprietar_id)
    if (!customerId) continue
    const addressText = [a.strada, a.numar].filter(Boolean).join(" ").trim()
    if (!addressText) continue
    const propertyType = (a.bloc || a.scara) ? "apartment" : "house"
    const localitateId = resolveLoc(a.localitate)
    const notes = !localitateId && a.localitate
      ? `[import ${IMPORT_TAG}] Localitate: ${a.localitate}`
      : `[import ${IMPORT_TAG}]`
    const { rows } = await newC.query(
      `insert into properties (customer_id, property_type, address, judet_id, localitate_id,
          block_name, stair, apartment, floor, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
      [customerId, propertyType, addressText, JUDET_TELEORMAN, localitateId,
       a.bloc || null, a.scara || null, a.apartament || null, a.etaj || null, notes],
    )
    propMap.set(a.id, rows[0].id)
    propCreated++
  }
  console.log(`   + ${propCreated} properties\n`)

  // Agregare verif + rev per adresă (cea mai recentă)
  const latestVer = new Map()
  for (const v of oldVer) {
    if (!v.adresa_id) continue
    const cur = latestVer.get(v.adresa_id)
    if (!cur || new Date(v.data_verificare) > new Date(cur.data_verificare)) latestVer.set(v.adresa_id, v)
  }
  const latestRev = new Map()
  for (const r of oldRev) {
    if (!r.adresa_id) continue
    const cur = latestRev.get(r.adresa_id)
    if (!cur || new Date(r.data_revizie) > new Date(cur.data_revizie)) latestRev.set(r.adresa_id, r)
  }

  // Istoricul complet per adresă (pentru observations)
  const allVerByAdr = new Map()
  for (const v of oldVer) {
    if (!v.adresa_id) continue
    if (!allVerByAdr.has(v.adresa_id)) allVerByAdr.set(v.adresa_id, [])
    allVerByAdr.get(v.adresa_id).push(v)
  }
  const allRevByAdr = new Map()
  for (const r of oldRev) {
    if (!r.adresa_id) continue
    if (!allRevByAdr.has(r.adresa_id)) allRevByAdr.set(r.adresa_id, [])
    allRevByAdr.get(r.adresa_id).push(r)
  }

  console.log("▶ Instalație gaz (cu istoric complet)")
  const instalatieByProperty = new Map()
  const allAdrIds = new Set([...latestVer.keys(), ...latestRev.keys()])
  let iCreated = 0
  for (const adresaId of allAdrIds) {
    const propertyId = propMap.get(adresaId)
    if (!propertyId) continue
    const v = latestVer.get(adresaId)
    const r = latestRev.get(adresaId)

    const vs = (allVerByAdr.get(adresaId) ?? []).sort((a, b) => new Date(a.data_verificare) - new Date(b.data_verificare))
    const rs = (allRevByAdr.get(adresaId) ?? []).sort((a, b) => new Date(a.data_revizie) - new Date(b.data_revizie))
    const lines = [`[import ${IMPORT_TAG}]`]
    if (vs.length > 0) {
      lines.push("Verificări:")
      for (const x of vs) {
        const pts = [`  ${isoStr(x.data_verificare)}`]
        if (x.numar_document) pts.push(`(nr ${x.numar_document})`)
        if (x.observatii) pts.push(`— ${x.observatii}`)
        lines.push(pts.join(" "))
      }
    }
    if (rs.length > 0) {
      lines.push("Revizii:")
      for (const x of rs) {
        const pts = [`  ${isoStr(x.data_revizie)}`]
        if (x.numar_document) pts.push(`(nr ${x.numar_document})`)
        if (x.observatii) pts.push(`— ${x.observatii}`)
        lines.push(pts.join(" "))
      }
    }

    const { rows } = await newC.query(
      `insert into property_equipments (property_id, equipment_type_id,
          last_verificare_at, next_verificare_due, last_revizie_at, next_revizie_due,
          observations, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, true) returning id`,
      [propertyId, EQUIPMENT_TYPE_INSTALATIE,
       isoStr(v?.data_verificare), isoStr(v?.valabilitate),
       isoStr(r?.data_revizie), isoStr(r?.valabilitate),
       lines.join("\n")],
    )
    instalatieByProperty.set(propertyId, rows[0].id)
    iCreated++
  }
  console.log(`   + ${iCreated} echipamente instalație\n`)

  console.log("▶ Centrale termice")
  let cCreated = 0
  for (const c of oldCen) {
    const propertyId = propMap.get(c.adresa_id)
    if (!propertyId) continue
    await newC.query(
      `insert into property_equipments (property_id, equipment_type_id, model, serial_number,
          last_verificare_at, next_verificare_due, observations, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, true)`,
      [propertyId, EQUIPMENT_TYPE_CENTRALA,
       c.model_centrala || null, c.numar_document || null,
       isoStr(c.data_verificare), isoStr(c.valabilitate),
       `[import ${IMPORT_TAG}]${c.observatii ? " | " + c.observatii : ""}`],
    )
    cCreated++
  }
  console.log(`   + ${cCreated} centrale\n`)

  // Summary
  console.log("═══ SUMMARY ═══")
  console.log(`Salariati: ${salMap.size}`)
  console.log(`Customers: ${custMap.size}`)
  console.log(`Properties: ${propCreated}`)
  console.log(`Echipamente instalație: ${iCreated}`)
  console.log(`Echipamente centrală: ${cCreated}`)

  await oldC.end()
  await newC.end()
  console.log("\n✅ Import complet.")
})().catch((e) => { console.error("FAIL:", e.message); console.error(e.stack); process.exit(1) })
