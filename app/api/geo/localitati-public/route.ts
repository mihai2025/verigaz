// app/api/geo/localitati-public/route.ts — localități pe județ, public (pt modal)
import { NextResponse } from "next/server"
import { getPublicServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const judetId = Number(url.searchParams.get("judet"))
  if (!judetId || !Number.isFinite(judetId)) {
    return NextResponse.json({ ok: false, error: "judet invalid" }, { status: 400 })
  }
  const supabase = getPublicServerSupabase()
  const { data } = await supabase.from("localitati").select("id, nume").eq("judet_id", judetId).order("nume")
  return NextResponse.json({ ok: true, localitati: data ?? [] })
}
