// app/api/cron/reminders/route.ts
//
// Declanșat de cron-job.org la fiecare 10 minute (vezi scripts/setup-cron-jobs.mjs).
// Autentificare acceptată: X-Cron-Secret header (cron-job.org) sau
// Authorization: Bearer (Vercel Cron, dacă upgrade la Pro) sau ?token= (fallback).
import { NextResponse } from "next/server"
import { dispatchDueReminders } from "@/lib/reminders/dispatch"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  // cron-job.org — X-Cron-Secret header (setat în scripts/setup-cron-jobs.mjs)
  const xSecret = req.headers.get("x-cron-secret")
  if (xSecret === secret) return true

  // Vercel Cron Pro → Authorization: Bearer
  const authHeader = req.headers.get("authorization") ?? ""
  if (authHeader === `Bearer ${secret}`) return true

  // Fallback pentru teste manuale
  const url = new URL(req.url)
  if (url.searchParams.get("token") === secret) return true

  return false
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 500)
  const dryRun = url.searchParams.get("dry") === "1"

  const result = await dispatchDueReminders({ limit, dryRun })
  return NextResponse.json({ ok: true, dryRun, ...result })
}

export async function POST(req: Request) {
  return GET(req)
}
