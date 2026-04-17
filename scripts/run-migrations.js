// scripts/run-migrations.js
// Rulează migrări SQL specificate pe args împotriva SUPABASE_DB_URL din .env.local
// Usage: node scripts/run-migrations.js supabase/migrations/20260417_0017_contracts.sql ...

const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local")
const envText = fs.readFileSync(envPath, "utf8")
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const DB_URL = process.env.SUPABASE_DB_URL
if (!DB_URL) {
  console.error("❌ SUPABASE_DB_URL lipsă din .env.local")
  process.exit(1)
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error("Usage: node scripts/run-migrations.js <sqlfile1> [sqlfile2] ...")
  process.exit(1)
}

;(async () => {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    console.log("✅ Conectat la Supabase")
    for (const file of files) {
      const abs = path.isAbsolute(file) ? file : path.join(__dirname, "..", file)
      console.log(`\n▶ Rulare: ${file}`)
      const sql = fs.readFileSync(abs, "utf8")
      try {
        await client.query(sql)
        console.log(`   ✅ OK: ${file}`)
      } catch (e) {
        console.error(`   ❌ FAIL: ${file}`)
        console.error(`   ${e.message}`)
        process.exit(2)
      }
    }
    console.log("\n🎉 Toate migrările au rulat cu succes.")
  } catch (e) {
    console.error("❌ Eroare conectare:", e.message)
    process.exit(3)
  } finally {
    await client.end()
  }
})()
