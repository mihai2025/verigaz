// app/api/cron/check-equipments/route.ts
//
// Cron zilnic care scanează property_equipments cu next_verificare_due /
// next_revizie_due în următoarele 65 zile și creează reminders la 60/30/7 zile.
import { NextResponse } from "next/server"
import { scheduleEquipmentReminders } from "@/lib/reminders/scheduleForEquipment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const xSecret = req.headers.get("x-cron-secret")
  if (xSecret === secret) return true

  const authHeader = req.headers.get("authorization") ?? ""
  if (authHeader === `Bearer ${secret}`) return true

  const url = new URL(req.url)
  if (url.searchParams.get("token") === secret) return true

  return false
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const url = new URL(req.url)
  const dryRun = url.searchParams.get("dry") === "1"
  const result = await scheduleEquipmentReminders({ dryRun })
  return NextResponse.json({ ok: true, dryRun, ...result })
}

export async function POST(req: Request) {
  return GET(req)
}
