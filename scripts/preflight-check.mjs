#!/usr/bin/env node
/**
 * preflight-check.mjs
 *
 * Validează că toate env vars sunt setate și serviciile externe răspund.
 * Rulează înainte de deploy în prod.
 *
 * Usage:  node scripts/preflight-check.mjs
 *
 * Exit codes:
 *   0 — totul OK
 *   1 — una sau mai multe verificări au eșuat
 */

import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

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
  } catch {
    console.error("⚠️  .env.local nu a fost găsit")
  }
  // Preferă env-ul din shell dacă există
  return { ...env, ...process.env }
}

const env = loadEnv()
const results = []

function check(label, ok, detail = "", optional = false) {
  results.push({ label, ok, detail, optional })
  const icon = ok ? "✓" : optional ? "⚠" : "✗"
  const color = ok ? "\x1b[32m" : optional ? "\x1b[33m" : "\x1b[31m"
  console.log(`${color}${icon}\x1b[0m ${label}${detail ? ` — ${detail}` : ""}${!ok && optional ? " (optional)" : ""}`)
}

function isPlaceholder(v) {
  if (!v) return true
  const s = String(v).trim()
  return !s || s.startsWith("TODO_") || s.startsWith("COPY_FROM_") || s === ""
}

async function main() {
  console.log("\n=== Verigaz preflight check ===\n")

  // ── 1. Config de bază ─────────────────────────────────────
  check("NEXT_PUBLIC_SITE_URL",
    !isPlaceholder(env.NEXT_PUBLIC_SITE_URL),
    env.NEXT_PUBLIC_SITE_URL || "missing")
  check("CRON_SECRET", !isPlaceholder(env.CRON_SECRET),
    env.CRON_SECRET ? `length ${env.CRON_SECRET.length}` : "missing")

  // ── 2. Supabase ───────────────────────────────────────────
  const supaUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supaAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supaService = env.SUPABASE_SERVICE_ROLE_KEY
  check("SUPABASE_URL setat",
    !isPlaceholder(supaUrl) && supaUrl.startsWith("https://"),
    supaUrl)
  check("SUPABASE_ANON_KEY setat", !isPlaceholder(supaAnon))
  check("SUPABASE_SERVICE_ROLE_KEY setat", !isPlaceholder(supaService))

  if (!isPlaceholder(supaUrl) && !isPlaceholder(supaService)) {
    try {
      const res = await fetch(`${supaUrl}/rest/v1/judete?select=count`, {
        headers: {
          apikey: supaService,
          Authorization: `Bearer ${supaService}`,
          Prefer: "count=exact",
        },
      })
      const total = res.headers.get("content-range")?.split("/")[1] ?? "?"
      check("Supabase connect + query judete", res.ok, `HTTP ${res.status}, count=${total}`)
    } catch (e) {
      check("Supabase connect", false, String(e))
    }
  }

  // ── 3. Cloudflare R2 ──────────────────────────────────────
  check("R2_ACCOUNT_ID", !isPlaceholder(env.R2_ACCOUNT_ID))
  check("R2_ACCESS_KEY_ID", !isPlaceholder(env.R2_ACCESS_KEY_ID))
  check("R2_SECRET_ACCESS_KEY", !isPlaceholder(env.R2_SECRET_ACCESS_KEY))
  check("R2_BUCKET", !isPlaceholder(env.R2_BUCKET), env.R2_BUCKET)
  check("R2_PUBLIC_URL", !isPlaceholder(env.R2_PUBLIC_URL), env.R2_PUBLIC_URL)

  if (env.R2_PUBLIC_URL) {
    try {
      const res = await fetch(env.R2_PUBLIC_URL.replace(/\/+$/, "") + "/", { method: "HEAD" })
      check("R2 public URL reachable", res.status < 500, `HTTP ${res.status}`)
    } catch (e) {
      check("R2 public URL reachable", false, String(e))
    }
  }

  // ── 4. Resend ─────────────────────────────────────────────
  const resendKey = env.RESEND_API_KEY
  check("RESEND_API_KEY", !isPlaceholder(resendKey))
  check("RESEND_FROM", !isPlaceholder(env.RESEND_FROM), env.RESEND_FROM)

  if (!isPlaceholder(resendKey)) {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      })
      if (res.ok) {
        const data = await res.json()
        const domains = (data.data ?? []).map((d) => `${d.name}:${d.status}`).join(", ")
        check("Resend API auth (full)", true, "HTTP 200")
        check("Resend domains", true, domains || "fără domenii verificate")
      } else if (res.status === 401 || res.status === 403) {
        // Key sending-only — testează cu POST /emails pe sandbox recipient
        const sendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.RESEND_FROM || "verigaz <no-reply@verificari-gaze.ro>",
            to: ["delivered@resend.dev"],
            subject: "verigaz preflight",
            text: "preflight check",
          }),
        })
        const body = sendRes.ok ? "sending-only key — OK" : `HTTP ${sendRes.status}: ${(await sendRes.text()).slice(0, 120)}`
        check("Resend API auth (sending)", sendRes.ok, body)
      } else {
        check("Resend API auth", false, `HTTP ${res.status}`)
      }
    } catch (e) {
      check("Resend API auth", false, String(e))
    }
  }

  // ── 5. SMS ────────────────────────────────────────────────
  check("SMS_API_TOKEN", !isPlaceholder(env.SMS_API_TOKEN))
  // Nu probăm send real — costă bani. Doar verificăm prezența token-ului.

  // ── 6. Stripe (optional la launch MVP — poate fi activat ulterior) ──
  const stripeKey = env.STRIPE_SECRET_KEY
  const opt = true
  check("STRIPE_SECRET_KEY", !isPlaceholder(stripeKey), "", opt)
  check("STRIPE_WEBHOOK_SECRET", !isPlaceholder(env.STRIPE_WEBHOOK_SECRET), "", opt)
  check("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", !isPlaceholder(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY), "", opt)
  check("STRIPE_PRICE_START_YEARLY", !isPlaceholder(env.STRIPE_PRICE_START_YEARLY), "", opt)
  check("STRIPE_PRICE_PLUS_YEARLY", !isPlaceholder(env.STRIPE_PRICE_PLUS_YEARLY), "", opt)
  check("STRIPE_PRICE_PREMIUM_YEARLY", !isPlaceholder(env.STRIPE_PRICE_PREMIUM_YEARLY), "", opt)

  if (!isPlaceholder(stripeKey)) {
    try {
      const res = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${stripeKey}` },
      })
      const data = await res.json()
      check("Stripe API auth",
        res.ok,
        res.ok ? `mode=${stripeKey.startsWith("sk_live_") ? "LIVE" : "TEST"}, acc=${data.id ?? "?"}` : `HTTP ${res.status}`)
    } catch (e) {
      check("Stripe API auth", false, String(e))
    }

    // Verifică că price IDs există
    for (const [label, envKey] of [
      ["Start price", "STRIPE_PRICE_START_YEARLY"],
      ["Plus price", "STRIPE_PRICE_PLUS_YEARLY"],
      ["Premium price", "STRIPE_PRICE_PREMIUM_YEARLY"],
    ]) {
      const priceId = env[envKey]
      if (!isPlaceholder(priceId)) {
        try {
          const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
            headers: { Authorization: `Bearer ${stripeKey}` },
          })
          const data = await res.json()
          check(`Stripe ${label} valid`,
            res.ok && data.active,
            res.ok ? `${data.unit_amount / 100} ${data.currency?.toUpperCase()}/${data.recurring?.interval}` : data.error?.message)
        } catch (e) {
          check(`Stripe ${label} valid`, false, String(e))
        }
      }
    }
  }

  // ── 7. cron-job.org ───────────────────────────────────────
  const cronKey = env.CRONJOB_API_KEY
  check("CRONJOB_API_KEY", !isPlaceholder(cronKey))
  if (!isPlaceholder(cronKey)) {
    try {
      const res = await fetch(`${env.CRONJOB_API_BASE ?? "https://api.cron-job.org"}/jobs`, {
        headers: { Authorization: `Bearer ${cronKey}` },
      })
      if (res.ok) {
        const data = await res.json()
        const verigazJobs = (data.jobs ?? []).filter((j) => j.title?.toLowerCase().startsWith("verigaz"))
        check("cron-job.org auth + jobs verigaz",
          true,
          `${verigazJobs.length} job-uri verigaz (din ${data.jobs?.length ?? 0} total)`)
      } else {
        check("cron-job.org auth", false, `HTTP ${res.status}`)
      }
    } catch (e) {
      check("cron-job.org auth", false, String(e))
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log("")
  const required = results.filter((r) => !r.optional)
  const optional = results.filter((r) => r.optional)
  const requiredFailed = required.filter((r) => !r.ok)
  const optionalFailed = optional.filter((r) => !r.ok)

  if (requiredFailed.length === 0 && optionalFailed.length === 0) {
    console.log(`\x1b[32m✓ Toate cele ${results.length} verificări OK. Ready to launch!\x1b[0m\n`)
    process.exit(0)
  } else if (requiredFailed.length === 0) {
    console.log(`\x1b[32m✓ ${required.length - requiredFailed.length}/${required.length} required OK\x1b[0m`)
    console.log(`\x1b[33m⚠ ${optionalFailed.length}/${optional.length} optional missing:\x1b[0m`)
    for (const f of optionalFailed) console.log(`   - ${f.label}`)
    console.log("\nLaunch e posibil — features-urile optional (Stripe) pot fi adăugate ulterior.\n")
    process.exit(0)
  } else {
    console.log(`\x1b[31m✗ ${requiredFailed.length}/${required.length} required eșuate:\x1b[0m`)
    for (const f of requiredFailed) console.log(`   - ${f.label}${f.detail ? ` (${f.detail})` : ""}`)
    if (optionalFailed.length > 0) {
      console.log(`\x1b[33m⚠ ${optionalFailed.length} optional lipsesc (Stripe):\x1b[0m`)
      for (const f of optionalFailed) console.log(`   - ${f.label}`)
    }
    console.log("")
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
