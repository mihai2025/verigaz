// scripts/update-observations.js
// Actualizează property_equipments.observations pentru instalațiile importate
// din AD INSTAL, concatenând TOATE verificările + revizii cronologic.
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
const EQUIPMENT_TYPE_INSTALATIE = 1
const IMPORT_TAG = "ad-instal-2026-04-17"

function isoStr(d) {
  if (!d) return ""
  if (typeof d === "string") return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

;(async () => {
  const oldC = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false } })
  const newC = new Client({ connectionString: NEW_DB_URL, ssl: { rejectUnauthorized: false } })
  await oldC.connect()
  await newC.connect()

  // 1. Load old data — verificari + revizii cu observații (sau fără, pt istoric complet)
  const { rows: oldProprietari } = await oldC.query(`select id, telefon from proprietari`)
  const phoneByProp = new Map()
  for (const p of oldProprietari) if (p.telefon) phoneByProp.set(p.id, p.telefon.replace(/\s+/g, ""))

  const { rows: oldAdrese } = await oldC.query(
    `select id, proprietar_id, strada, numar from adrese`,
  )
  const { rows: oldVerif } = await oldC.query(
    `select adresa_id, data_verificare, numar_document, observatii from verificari order by data_verificare asc`,
  )
  const { rows: oldRev } = await oldC.query(
    `select adresa_id, data_revizie, numar_document, observatii from revizii order by data_revizie asc`,
  )

  // Indexuri per adresa
  const verifByAdresa = new Map()
  for (const v of oldVerif) {
    if (!v.adresa_id) continue
    if (!verifByAdresa.has(v.adresa_id)) verifByAdresa.set(v.adresa_id, [])
    verifByAdresa.get(v.adresa_id).push(v)
  }
  const revByAdresa = new Map()
  for (const r of oldRev) {
    if (!r.adresa_id) continue
    if (!revByAdresa.has(r.adresa_id)) revByAdresa.set(r.adresa_id, [])
    revByAdresa.get(r.adresa_id).push(r)
  }

  // 2. Pentru fiecare adresa veche, rezolvă property_id-ul nou și construiește textul
  let updated = 0, notFound = 0, noData = 0
  for (const a of oldAdrese) {
    const vs = verifByAdresa.get(a.id) ?? []
    const rs = revByAdresa.get(a.id) ?? []
    if (vs.length === 0 && rs.length === 0) { noData++; continue }

    const phone = phoneByProp.get(a.proprietar_id)
    if (!phone) { notFound++; continue }
    const addressText = [a.strada, a.numar].filter(Boolean).join(" ").trim()
    if (!addressText) { notFound++; continue }

    // Găsește property nou via phone → customer_id → (customer_id, address)
    const { rows: custRows } = await newC.query(
      `select id from customers where phone = $1 limit 1`, [phone],
    )
    if (custRows.length === 0) { notFound++; continue }
    const customerId = custRows[0].id

    const { rows: propRows } = await newC.query(
      `select id from properties where customer_id = $1 and address = $2 limit 1`,
      [customerId, addressText],
    )
    if (propRows.length === 0) { notFound++; continue }
    const propertyId = propRows[0].id

    // Găsește echipamentul instalație
    const { rows: eqRows } = await newC.query(
      `select id from property_equipments
       where property_id = $1 and equipment_type_id = $2 limit 1`,
      [propertyId, EQUIPMENT_TYPE_INSTALATIE],
    )
    if (eqRows.length === 0) { noData++; continue }
    const equipmentId = eqRows[0].id

    // Construiește textul istoric
    const lines = [`[import ${IMPORT_TAG}]`]
    if (vs.length > 0) {
      lines.push("Verificări:")
      for (const v of vs) {
        const parts = [`  ${isoStr(v.data_verificare)}`]
        if (v.numar_document) parts.push(`(nr ${v.numar_document})`)
        if (v.observatii) parts.push(`— ${v.observatii}`)
        lines.push(parts.join(" "))
      }
    }
    if (rs.length > 0) {
      lines.push("Revizii:")
      for (const r of rs) {
        const parts = [`  ${isoStr(r.data_revizie)}`]
        if (r.numar_document) parts.push(`(nr ${r.numar_document})`)
        if (r.observatii) parts.push(`— ${r.observatii}`)
        lines.push(parts.join(" "))
      }
    }
    const fullObs = lines.join("\n")

    await newC.query(
      `update property_equipments set observations = $1 where id = $2`,
      [fullObs, equipmentId],
    )
    updated++
    if (updated % 100 === 0) console.log(`  ...${updated} echipamente actualizate`)
  }

  console.log(`\n✅ Updated: ${updated}`)
  console.log(`⚠  Not found (missing mapping): ${notFound}`)
  console.log(`ℹ  No data (fără verificări/revizii): ${noData}`)

  await oldC.end()
  await newC.end()
})().catch((e) => { console.error("FAIL:", e.message); console.error(e.stack); process.exit(1) })
