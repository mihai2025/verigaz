// app/api/geo/judete-public/route.ts — listă județe, public (pt modal)
import { NextResponse } from "next/server"
import { getPublicServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const revalidate = 86400

export async function GET() {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase.from("judete").select("id, nume").order("nume")
  return NextResponse.json({ ok: true, judete: data ?? [] })
}
