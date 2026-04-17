// app/api/debug/env-check/route.ts
// Public debug — arată dacă env vars critice sunt setate și testează o query
// SERVICE_ROLE (fără auth). Șterge după debug.
import { NextResponse } from "next/server"
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  const out: Record<string, unknown> = {
    env: {
      has_service_role: !!svcKey,
      service_role_prefix: svcKey.slice(0, 15),
      service_role_length: svcKey.length,
      service_role_looks_like_jwt: svcKey.startsWith("eyJ"),
      supabase_url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  }

  try {
    const admin = getServiceRoleSupabase()
    const res = await admin.from("customers").select("id", { count: "exact", head: true })
    out.customers_count_via_service_role = { count: res.count ?? null, error: res.error?.message ?? null }
    const res2 = await admin.from("firm_customer_links").select("*", { count: "exact", head: true }).eq("firm_id", "08919a0d-30b4-46f2-b3cf-4024f459cb47")
    out.links_count_ad_instal = { count: res2.count ?? null, error: res2.error?.message ?? null }
  } catch (e) {
    out.error = (e as Error).message
  }

  return NextResponse.json(out)
}
