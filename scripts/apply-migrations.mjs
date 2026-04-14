#!/usr/bin/env node
/**
 * apply-migrations.mjs
 *
 * Aplică toate fișierele SQL din supabase/migrations/ + seeds/ în Supabase,
 * în ordinea numelui de fișier (naming: YYYYMMDD_NNNN_*.sql).
 *
 * Folosește SUPABASE_DB_URL din .env.local (pooler connection string).
 * Scriptul e idempotent — migrațiile folosesc `create table if not exists`
 * și `insert ... on conflict do nothing/update`.
 *
 * Usage:  node scripts/apply-migrations.mjs
 *         node scripts/apply-migrations.mjs --only migrations
 *         node scripts/apply-migrations.mjs --only seeds
 */

import { readFileSync, readdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

function loadEnv() {
  const env = {}
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8")
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let val = m[2]
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      env[m[1]] = val
    }
  } catch {}
  return { ...env, ...process.env }
}

const env = loadEnv()
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null
const dbUrl = env.SUPABASE_DB_URL

if (!dbUrl || dbUrl.startsWith("TODO_")) {
  console.error("SUPABASE_DB_URL nu e setat în .env.local.")
  process.exit(1)
}

const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations")
const SEEDS_DIR = resolve(ROOT, "supabase/seeds")

function listSql(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => resolve(dir, f))
  } catch {
    return []
  }
}

async function applyFile(client, path) {
  const sql = readFileSync(path, "utf8")
  const name = path.split(/[/\\]/).pop()
  process.stdout.write(`  ${name} ... `)
  try {
    await client.query(sql)
    console.log("\x1b[32m✓\x1b[0m")
  } catch (err) {
    console.log(`\x1b[31m✗\x1b[0m`)
    throw new Error(`${name}: ${err.message}`)
  }
}

async function main() {
  const { Client } = pg
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  console.log(`Connected: ${dbUrl.replace(/:[^:@]*@/, ":***@")}\n`)

  try {
    if (only !== "seeds") {
      const migs = listSql(MIGRATIONS_DIR)
      console.log(`[migrations] ${migs.length} fișiere`)
      for (const f of migs) await applyFile(client, f)
      console.log("")
    }
    if (only !== "migrations") {
      const seeds = listSql(SEEDS_DIR)
      console.log(`[seeds] ${seeds.length} fișiere`)
      for (const f of seeds) await applyFile(client, f)
      console.log("")
    }
    console.log("\x1b[32m✓ Done\x1b[0m")
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(`\n\x1b[31mError:\x1b[0m ${err.message}`)
  process.exit(1)
})
