// app/api/cron/check-subscriptions/route.ts
//
// Rulat zilnic (vercel.json cron) — downgrade firme plătite dacă n-au abonament
// activ sau ultimul e expirat. Safety net peste webhook-urile Stripe care ar
// trebui să se întâmple oricum.
import { NextResponse } from "next/server"
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { writeAudit } from "@/lib/audit/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const xSecret = req.headers.get("x-cron-secret")
  if (xSecret === secret) return true
  const auth = req.headers.get("authorization") ?? ""
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  return url.searchParams.get("token") === secret
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const admin = getServiceRoleSupabase()
  const now = new Date().toISOString()

  // 1) Firme pe plan plătit
  const { data: paidFirms, error } = await admin
    .from("gas_firms")
    .select("id, plan")
    .neq("plan", "free")
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!paidFirms?.length) {
    return NextResponse.json({ ok: true, checked: 0, downgraded: 0 })
  }

  const firmIds = paidFirms.map((f) => f.id as string)

  // 2) Ultima subscripție activă/trialing per firmă
  const { data: subs } = await admin
    .from("firm_subscriptions")
    .select("firm_id, expires_at, status")
    .in("firm_id", firmIds)
    .in("status", ["active", "trialing"])
    .order("expires_at", { ascending: false })

  const latestActive = new Map<string, string | null>()
  for (const s of subs ?? []) {
    if (!latestActive.has(s.firm_id)) latestActive.set(s.firm_id, s.expires_at as string | null)
  }

  // 3) Downgrade dacă n-au sub activ sau e deja expirat
  const toDowngrade: string[] = []
  for (const f of paidFirms) {
    const exp = latestActive.get(f.id as string)
    if (!exp || exp < now) toDowngrade.push(f.id as string)
  }

  if (toDowngrade.length) {
    await admin
      .from("gas_firms")
      .update({ plan: "free", plan_valid_until: null, plan_updated_at: now })
      .in("id", toDowngrade)

    // Marchează expired pe sub-urile active care au depășit expires_at
    await admin
      .from("firm_subscriptions")
      .update({ status: "expired", updated_at: now })
      .in("firm_id", toDowngrade)
      .in("status", ["active", "trialing"])
      .lt("expires_at", now)

    for (const fid of toDowngrade) {
      await writeAudit({
        actorUserId: null,
        actorRole: "cron",
        action: "subscription.expire_downgrade",
        entityType: "gas_firms",
        entityId: fid,
        summary: "Downgrade automat la free (fără sub activ).",
      })
    }
  }

  return NextResponse.json({
    ok: true,
    checked: paidFirms.length,
    downgraded: toDowngrade.length,
    firmIds: toDowngrade,
  })
}

export async function POST(req: Request) {
  return GET(req)
}
