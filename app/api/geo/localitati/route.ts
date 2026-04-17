// app/api/geo/localitati/route.ts
// Returnează lista localităților pentru un județ dat. Folosit de UI pentru
// cascade select (județ → localitate) în formulare admin.
import { NextResponse } from "next/server"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "admin" && (role !== "firm_owner" || !firmId)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const judetIdRaw = url.searchParams.get("judet")
  const judetId = judetIdRaw ? Number(judetIdRaw) : null
  if (!judetId || !Number.isFinite(judetId)) {
    return NextResponse.json({ ok: false, error: "judet invalid" }, { status: 400 })
  }

  const admin = getServiceRoleSupabase()
  const { data: localitati, error } = await admin
    .from("localitati")
    .select("id, nume")
    .eq("judet_id", judetId)
    .order("nume")

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, localitati: localitati ?? [] })
}
