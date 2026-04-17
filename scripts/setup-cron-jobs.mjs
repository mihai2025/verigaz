#!/usr/bin/env node
/**
 * setup-cron-jobs.mjs
 *
 * Creează (sau actualizează) job-urile cron-job.org pentru verigaz.
 * Folosește API-ul cron-job.org via CRONJOB_API_KEY din .env.local.
 *
 * Rulează după ce ai setat:
 *   NEXT_PUBLIC_SITE_URL (ex https://verificari-gaze.ro sau preview URL)
 *   CRON_SECRET (același în Vercel + in cron-job.org header)
 *
 * Usage:  node scripts/setup-cron-jobs.mjs
 *         node scripts/setup-cron-jobs.mjs --dry    (doar afișează, nu creează)
 *
 * Job-urile setate:
 *   1. reminders — la fiecare 10 minute (dispatcher SMS/email)
 *   2. check-subscriptions — zilnic la 03:00 UTC
 */

import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

// ── Parse .env.local ──────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local")
  const raw = readFileSync(envPath, "utf8")
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let val = m[2]
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    env[m[1]] = val
  }
  return env
}

const env = loadEnv()
const API_BASE = env.CRONJOB_API_BASE || "https://api.cron-job.org"
const API_KEY = env.CRONJOB_API_KEY
const SITE_URL = (env.NEXT_PUBLIC_SITE_URL || "https://verificari-gaze.ro").replace(/\/+$/, "")
const CRON_SECRET = env.CRON_SECRET
const DRY = process.argv.includes("--dry")

if (!API_KEY) { console.error("CRONJOB_API_KEY lipsește din .env.local"); process.exit(1) }
if (!CRON_SECRET) { console.error("CRON_SECRET lipsește din .env.local"); process.exit(1) }

const authHeaders = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }

// ── Job definitions ───────────────────────────────────────────
const JOBS = [
  {
    title: "verigaz · reminders dispatcher",
    url: `${SITE_URL}/api/cron/reminders`,
    requestMethod: 0, // GET
    saveResponses: true,
    extendedData: {
      headers: { "X-Cron-Secret": CRON_SECRET },
    },
    schedule: {
      timezone: "Europe/Bucharest",
      hours: [-1],     // orice oră
      mdays: [-1],
      months: [-1],
      wdays: [-1],
      minutes: [0, 10, 20, 30, 40, 50],
    },
  },
  {
    title: "verigaz · check expired subscriptions",
    url: `${SITE_URL}/api/cron/check-subscriptions`,
    requestMethod: 0,
    saveResponses: true,
    extendedData: {
      headers: { "X-Cron-Secret": CRON_SECRET },
    },
    schedule: {
      timezone: "Europe/Bucharest",
      hours: [3],
      minutes: [0],
      mdays: [-1],
      months: [-1],
      wdays: [-1],
    },
  },
  {
    title: "verigaz · check contracts expiring",
    url: `${SITE_URL}/api/cron/check-contracts`,
    requestMethod: 0,
    saveResponses: true,
    extendedData: {
      headers: { "X-Cron-Secret": CRON_SECRET },
    },
    schedule: {
      timezone: "Europe/Bucharest",
      hours: [4],
      minutes: [0],
      mdays: [-1],
      months: [-1],
      wdays: [-1],
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────
async function listJobs() {
  const res = await fetch(`${API_BASE}/jobs`, { headers: authHeaders })
  if (!res.ok) throw new Error(`list jobs ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.jobs ?? []
}

async function createJob(def) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ job: { enabled: true, ...def } }),
  })
  if (!res.ok) throw new Error(`create ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.jobId
}

async function updateJob(id, def) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ job: def }),
  })
  if (!res.ok) throw new Error(`update ${res.status}: ${await res.text()}`)
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`site URL: ${SITE_URL}`)
  console.log(`dry run:  ${DRY}`)
  console.log(`jobs:     ${JOBS.length}`)

  const existing = await listJobs()
  console.log(`existing jobs: ${existing.length}`)

  for (const def of JOBS) {
    const match = existing.find((j) => j.title === def.title)
    if (match) {
      console.log(`→ [update] #${match.jobId} ${def.title}`)
      if (!DRY) await updateJob(match.jobId, def)
    } else {
      console.log(`→ [create] ${def.title}`)
      if (!DRY) {
        const id = await createJob(def)
        console.log(`   created id=${id}`)
      }
    }
  }
  console.log("✓ done")
}

main().catch((err) => { console.error(err); process.exit(1) })
