// app/api/debug/clienti-check/route.ts
// Debug endpoint — returnează exact ce vede pagina /dashboard/clienti
// ca să identificăm unde se rupe (auth, RLS, service_role).
import { NextResponse } from "next/server"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json({ step: "auth", error: "not logged in" }, { status: 401 })
  }

  const role = await getUserRole(data.user.id)
  const admin = getServiceRoleSupabase()

  const bks = await admin.from("bookings").select("customer_id").eq("firm_id", role.firmId ?? "").limit(5)
  const contracts = await admin.from("contracts").select("customer_id").eq("firm_id", role.firmId ?? "").limit(5)
  const links = await admin.from("firm_customer_links").select("customer_id").eq("firm_id", role.firmId ?? "").limit(5)
  const linksCount = await admin.from("firm_customer_links").select("*", { count: "exact", head: true }).eq("firm_id", role.firmId ?? "")
  const customers = await admin.from("customers").select("id, full_name, phone").limit(5)
  const customersForFirm = role.firmId
    ? await admin.from("customers").select("id, full_name").in("id", (links.data ?? []).map((l) => l.customer_id))
    : { data: [], error: null }

  return NextResponse.json({
    auth: { user_id: data.user.id, email: data.user.email },
    role,
    env: {
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      service_role_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) ?? null,
      supabase_url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    queries: {
      bookings: { count: bks.data?.length ?? 0, error: bks.error?.message ?? null },
      contracts: { count: contracts.data?.length ?? 0, error: contracts.error?.message ?? null },
      firm_customer_links_total: { count: linksCount.count ?? 0, error: linksCount.error?.message ?? null },
      firm_customer_links_sample: { data: links.data, error: links.error?.message ?? null },
      customers_all_sample: { count: customers.data?.length ?? 0, error: customers.error?.message ?? null },
      customers_for_firm: { count: customersForFirm.data?.length ?? 0, error: customersForFirm.error?.message ?? null, sample: customersForFirm.data?.slice(0, 3) },
    },
  })
}
