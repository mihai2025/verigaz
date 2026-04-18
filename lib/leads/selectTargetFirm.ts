// lib/leads/selectTargetFirm.ts
// Selecție firmă țintă pentru lead: prioritate plan premium > plus > start > free.
// Fallback chain: localitate → județ → oricare activă.

import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type TargetFirm = {
  id: string
  slug: string
  brand_name: string | null
  legal_name: string
  phone: string | null
  plan: string
  sediu_judet_id: number | null
  sediu_localitate_id: number | null
}

const PLAN_PRIORITY: Record<string, number> = { premium: 1, plus: 2, start: 3, free: 4 }

type Opts = {
  judetId: number
  localitateId?: number | null
  firmSlug?: string | null  // override: dacă lead vine din profilul unei firme, target e acea firmă
}

export async function selectTargetFirm(opts: Opts): Promise<TargetFirm | null> {
  const admin = getServiceRoleSupabase()

  // 1) Override: dacă firma specificată are plan plătit, o folosim direct
  //    (free NU primește cereri — cade în fallback pe zonă cu firme plătite)
  if (opts.firmSlug) {
    const { data: firm } = await admin
      .from("gas_firms")
      .select("id, slug, brand_name, legal_name, phone, plan, sediu_judet_id, sediu_localitate_id")
      .eq("slug", opts.firmSlug)
      .eq("is_active", true)
      .eq("verification_status", "approved")
      .maybeSingle()
    if (firm && firm.phone && firm.plan && firm.plan !== "free") return firm as TargetFirm
  }

  // 2) Caută firme plătite în aceeași localitate (exclude free)
  let candidates: TargetFirm[] = []
  if (opts.localitateId != null) {
    const { data } = await admin
      .from("gas_firms")
      .select("id, slug, brand_name, legal_name, phone, plan, sediu_judet_id, sediu_localitate_id")
      .eq("sediu_localitate_id", opts.localitateId)
      .eq("is_active", true)
      .eq("verification_status", "approved")
      .neq("plan", "free")
      .not("phone", "is", null)
    if (data && data.length > 0) candidates = data as TargetFirm[]
  }

  // 3) Fallback: firme plătite în același județ
  if (candidates.length === 0) {
    const { data } = await admin
      .from("gas_firms")
      .select("id, slug, brand_name, legal_name, phone, plan, sediu_judet_id, sediu_localitate_id")
      .eq("sediu_judet_id", opts.judetId)
      .eq("is_active", true)
      .eq("verification_status", "approved")
      .neq("plan", "free")
      .not("phone", "is", null)
      .limit(50)
    if (data && data.length > 0) candidates = data as TargetFirm[]
  }

  if (candidates.length === 0) return null

  // 4) Sortare după plan + random în cadrul aceluiași tier
  candidates.sort((a, b) => {
    const pa = PLAN_PRIORITY[a.plan] ?? 5
    const pb = PLAN_PRIORITY[b.plan] ?? 5
    if (pa !== pb) return pa - pb
    return Math.random() - 0.5
  })
  return candidates[0] ?? null
}
