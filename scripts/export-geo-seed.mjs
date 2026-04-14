#!/usr/bin/env node
/**
 * export-geo-seed.mjs
 *
 * Extrage județe + localități din Supabase ghidulfunerar și generează
 * un seed SQL pentru verigaz (idempotent, păstrează ID-urile sursă pentru
 * compatibilitate cu `lib/geo/orase.ts` care hardcodează `judetId`).
 *
 * Usage:  node scripts/export-geo-seed.mjs
 *
 * Output: supabase/seeds/0001_geo_seed.sql
 */

import { writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const OUT = resolve(ROOT, "supabase/seeds/0001_geo_seed.sql")

const SUPABASE_URL = "https://bmqqpnhwyozakcpxavps.supabase.co"
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcXFwbmh3eW96YWtjcHhhdnBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyNTgyOSwiZXhwIjoyMDg0NTAxODI5fQ.67m9BhyeTpIJbO8IXDuYHqXeGGw_XMs_sk-PJBp9M2w"

const DIACRITICS = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
}
function slugifyRO(text) {
  return text
    .toLowerCase()
    .replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIACRITICS[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL"
  return "'" + String(v).replace(/'/g, "''") + "'"
}
function sqlNum(v) {
  if (v === null || v === undefined || v === "") return "NULL"
  return String(v)
}

async function fetchAll(table, select, pageSize = 1000) {
  const rows = []
  let from = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const to = from + pageSize - 1
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&order=id.asc`
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Range: `${from}-${to}`,
        "Range-Unit": "items",
      },
    })
    if (!res.ok) throw new Error(`${table} fetch failed: ${res.status} ${await res.text()}`)
    const batch = await res.json()
    rows.push(...batch)
    const cr = res.headers.get("content-range") // e.g. "0-999/13856"
    const total = cr ? Number(cr.split("/")[1]) : batch.length
    if (from + batch.length >= total || batch.length === 0) break
    from += pageSize
  }
  return rows
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  console.log("→ fetching judete…")
  const judete = await fetchAll("judete", "id,nume", 1000)
  console.log(`  got ${judete.length} judete`)

  console.log("→ fetching localitati…")
  const localitati = await fetchAll(
    "localitati",
    "id,judet_id,nume,slug,populatie,tip_localitate,tier,lat,lng",
    1000,
  )
  console.log(`  got ${localitati.length} localitati`)

  const lines = []
  lines.push("-- =====================================================")
  lines.push("-- Seed 0001 — județe + localități (România)")
  lines.push("-- Sursă: snapshot Supabase ghidulfunerar (Recensământ 2021 pt. populație)")
  lines.push("-- Generat automat: scripts/export-geo-seed.mjs")
  lines.push("-- ID-urile județelor sunt păstrate pentru compat cu lib/geo/orase.ts")
  lines.push("-- =====================================================")
  lines.push("")
  lines.push("begin;")
  lines.push("")

  lines.push("-- ---------- JUDETE ----------")
  const judeteValues = judete
    .map((j) => `  (${j.id}, ${sqlStr(j.nume)}, ${sqlStr(slugifyRO(j.nume))})`)
    .join(",\n")
  lines.push("insert into public.judete (id, nume, slug) values")
  lines.push(judeteValues)
  lines.push("on conflict (id) do update set nume = excluded.nume, slug = excluded.slug;")
  lines.push("")
  lines.push(
    "select setval(pg_get_serial_sequence('public.judete','id'), (select coalesce(max(id),1) from public.judete));",
  )
  lines.push("")

  lines.push("-- ---------- LOCALITATI ----------")
  const batches = chunk(localitati, 500)
  for (const [i, batch] of batches.entries()) {
    const vals = batch
      .map((l) => {
        const slug = l.slug || slugifyRO(l.nume)
        return `  (${l.id}, ${l.judet_id}, ${sqlStr(l.nume)}, ${sqlStr(slug)}, ${sqlNum(
          l.populatie,
        )}, ${sqlStr(l.tip_localitate)}, ${sqlStr(l.tier)}, ${sqlNum(l.lat)}, ${sqlNum(l.lng)})`
      })
      .join(",\n")
    lines.push(
      `-- batch ${i + 1}/${batches.length} (${batch.length} rows)`,
    )
    lines.push(
      "insert into public.localitati (id, judet_id, nume, slug, populatie, tip_localitate, tier, lat, lng) values",
    )
    lines.push(vals)
    lines.push(
      "on conflict (judet_id, slug) do update set nume = excluded.nume, populatie = excluded.populatie, tip_localitate = excluded.tip_localitate, tier = excluded.tier;",
    )
    lines.push("")
  }
  lines.push(
    "select setval(pg_get_serial_sequence('public.localitati','id'), (select coalesce(max(id),1) from public.localitati));",
  )
  lines.push("")
  lines.push("commit;")
  lines.push("")

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, lines.join("\n"), "utf8")
  console.log(`✓ wrote ${OUT}`)
  console.log(`  ${judete.length} judete + ${localitati.length} localitati`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
