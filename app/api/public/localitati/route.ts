// app/api/public/localitati/route.ts
// Endpoint public: întoarce localitățile dintr-un județ, sortate pe tip
// (sector → municipiu → oraș → comună → sat), apoi alfabetic.
import { NextResponse } from "next/server"
import { getPublicServerSupabase } from "@/lib/supabase/server"

const TIP_RANK: Record<string, number> = {
  sector: 1,
  municipiu: 2,
  oras: 3,
  comuna: 4,
  sat: 5,
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const judetRaw = searchParams.get("judet_id") ?? searchParams.get("judet")
  const judetId = judetRaw ? Number(judetRaw) : NaN
  if (!judetRaw || Number.isNaN(judetId)) {
    return NextResponse.json({ items: [] })
  }

  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("localitati")
    .select("id, nume, tip_localitate, slug")
    .eq("judet_id", judetId)
    .order("nume")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = (data ?? []).slice().sort((a: any, b: any) => {
    const ra = TIP_RANK[(a.tip_localitate ?? "").toLowerCase()] ?? 6
    const rb = TIP_RANK[(b.tip_localitate ?? "").toLowerCase()] ?? 6
    if (ra !== rb) return ra - rb
    return String(a.nume).localeCompare(String(b.nume), "ro")
  })

  return NextResponse.json(
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: sorted.map((l: any) => ({
        id: l.id,
        nume: l.nume,
        slug: l.slug,
        tip: l.tip_localitate ?? null,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  )
}
