// scripts/check-verigaz-targets.js
// Verifică în verigaz prod: firma AD INSTAL, equipment_types, judete Teleorman.
const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

const envPath = path.join(__dirname, "..", ".env.local")
const envText = fs.readFileSync(envPath, "utf8")
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

;(async () => {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  console.log("=== CĂUTARE FIRMĂ AD INSTAL (verigaz prod) ===\n")
  const { rows: firmCols } = await client.query(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'gas_firms'
    order by ordinal_position
  `)
  console.log("gas_firms columns:", firmCols.map(c => c.column_name).join(", "))

  const { rows: firms } = await client.query(`
    select *
    from gas_firms
    where brand_name ilike '%ad instal%'
       or legal_name ilike '%ad instal%'
       or slug ilike '%ad-instal%'
    limit 10
  `)
  console.log(firms.length ? JSON.stringify(firms, null, 2) : "❌ Nu există firmă AD INSTAL în verigaz")

  console.log("\n=== JUDEȚ TELEORMAN ===\n")
  const { rows: jud } = await client.query(`select id, nume from judete where nume ilike 'teleorman%'`)
  console.log(JSON.stringify(jud, null, 2))

  if (jud.length > 0) {
    console.log("\n=== LOCALITĂȚI ÎN TELEORMAN (căutare rosiori) ===\n")
    const { rows: loc } = await client.query(
      `select id, nume from localitati where judet_id = $1 and nume ilike '%rosiori%' limit 10`,
      [jud[0].id],
    )
    console.log(JSON.stringify(loc, null, 2))
  }

  console.log("\n=== EQUIPMENT_TYPES (catalog default) ===\n")
  const { rows: eq } = await client.query(`
    select id, slug, nume, verificare_months, revizie_months, is_active
    from equipment_types
    where is_active = true
    order by sort_order
  `)
  console.log(JSON.stringify(eq, null, 2))

  await client.end()
})().catch((e) => { console.error(e.message); process.exit(1) })
