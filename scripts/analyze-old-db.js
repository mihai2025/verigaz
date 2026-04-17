// scripts/analyze-old-db.js
// Recon read-only pe baza veche Supabase — listează tabele, coloane, nr rânduri,
// sample de date, pentru a putea plan importul de clienti/revizii/verificari.
//
// Usage: node scripts/analyze-old-db.js [--firm "ad instal gaz"]

const { Client } = require("pg")

const OLD_DB_URL = "postgres://postgres.khxxibauxdxsdkeorhvl:R48DO90kvkwOkEe0@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify"
const FIRM_SEARCH = "ad instal"

;(async () => {
  const client = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()

  // 1. Listă tabele în schema public
  console.log("=== TABLES IN `public` SCHEMA ===\n")
  const { rows: tables } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `)
  console.log(tables.map((t) => t.table_name).join("\n"))
  console.log(`\nTotal: ${tables.length} tabele\n`)

  // 2. Pentru fiecare tabelă: row count + coloane
  console.log("=== SCHEMA + ROW COUNTS ===\n")
  for (const t of tables) {
    const name = t.table_name
    const { rows: countRows } = await client.query(`select count(*)::int as n from public.${JSON.stringify(name).slice(1, -1)}`)
    const n = countRows[0]?.n ?? 0
    if (n === 0) continue // skip goale

    const { rows: cols } = await client.query(
      `select column_name, data_type, is_nullable
       from information_schema.columns
       where table_schema = 'public' and table_name = $1
       order by ordinal_position`,
      [name],
    )
    console.log(`--- ${name} (${n} rows) ---`)
    for (const c of cols) {
      console.log(`  ${c.column_name.padEnd(32)} ${c.data_type}${c.is_nullable === "NO" ? " NOT NULL" : ""}`)
    }
    console.log()
  }

  // 3. Caută firma "ad instal gaz" — probe în tabele candidate
  console.log(`=== SEARCH FIRM ${FIRM_SEARCH} ===\n`)
  for (const t of tables) {
    const name = t.table_name
    // Check if has a 'name' / 'nume' / 'denumire' column
    const { rows: cols } = await client.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = $1
         and column_name in ('name', 'nume', 'denumire', 'denumire_firma', 'firm_name', 'brand_name', 'legal_name', 'company_name')`,
      [name],
    )
    if (cols.length === 0) continue
    for (const c of cols) {
      try {
        const { rows } = await client.query(
          `select * from public.${JSON.stringify(name).slice(1, -1)} where ${JSON.stringify(c.column_name).slice(1, -1)} ilike $1 limit 5`,
          [`%${FIRM_SEARCH}%`],
        )
        if (rows.length > 0) {
          console.log(`MATCH in ${name}.${c.column_name}:`)
          console.log(JSON.stringify(rows, null, 2))
          console.log()
        }
      } catch (e) {
        // skip errors (permission, etc)
      }
    }
  }

  await client.end()
  console.log("Done.")
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1) })
