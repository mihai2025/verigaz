// app/api/debug/env-check/route.ts
// Reproduce EXACT logica din /dashboard/clienti pentru user id specificat.
// Șterge după debug.
import { NextResponse } from "next/server"
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GMAIL_USER_ID = "2069d785-4311-4aba-a1a7-882b09786b30"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get("uid") ?? GMAIL_USER_ID

  const out: Record<string, unknown> = {}

  try {
    const role = await getUserRole(userId)
    out.role = role

    if (role.role !== "firm_owner" || !role.firmId) {
      out.early_return = "not firm_owner"
      return NextResponse.json(out)
    }

    const admin = getServiceRoleSupabase()
    const [bksRes, contractsRes, linksRes] = await Promise.all([
      admin.from("bookings").select("customer_id, property_id").eq("firm_id", role.firmId),
      admin.from("contracts").select("customer_id, property_id").eq("firm_id", role.firmId),
      admin.from("firm_customer_links").select("customer_id").eq("firm_id", role.firmId),
    ])

    out.bookings = { count: bksRes.data?.length ?? 0, error: bksRes.error?.message ?? null }
    out.contracts = { count: contractsRes.data?.length ?? 0, error: contractsRes.error?.message ?? null }
    out.links = { count: linksRes.data?.length ?? 0, error: linksRes.error?.message ?? null }

    const customerIds = [...new Set([
      ...(bksRes.data ?? []).map((b) => b.customer_id as string),
      ...(contractsRes.data ?? []).map((c) => c.customer_id as string),
      ...(linksRes.data ?? []).map((l) => l.customer_id as string),
    ].filter(Boolean))]

    out.customerIds_count = customerIds.length
    out.customerIds_sample = customerIds.slice(0, 3)

    if (customerIds.length > 0) {
      const custRes = await admin
        .from("customers")
        .select("id, full_name, phone")
        .in("id", customerIds)
      out.customers = { count: custRes.data?.length ?? 0, error: custRes.error?.message ?? null, sample: custRes.data?.slice(0, 3) }

      const propRes = await admin.from("properties").select("id").in("customer_id", customerIds)
      out.properties = { count: propRes.data?.length ?? 0, error: propRes.error?.message ?? null }
    }
  } catch (e) {
    out.error = (e as Error).message
    out.stack = (e as Error).stack?.split("\n").slice(0, 5)
  }

  return NextResponse.json(out, { status: 200 })
}
