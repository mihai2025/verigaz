"use server"

import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"

type Result = { ok: true; slug: string } | { ok: false; error: string }

export async function createFirm(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Nu ești autentificat." }

  const legalName = String(formData.get("legal_name") ?? "").trim()
  const brandName = String(formData.get("brand_name") ?? "").trim() || null
  const cui = String(formData.get("cui") ?? "").trim() || null
  const anreNo = String(formData.get("anre_authorization_no") ?? "").trim() || null
  const anreCategory = String(formData.get("anre_category") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const email = String(formData.get("email") ?? "").trim() || null
  const judetIdRaw = String(formData.get("sediu_judet_id") ?? "").trim()
  const judetId = judetIdRaw ? Number(judetIdRaw) : null
  const localitateIdRaw = String(formData.get("sediu_localitate_id") ?? "").trim()
  const localitateId = localitateIdRaw ? Number(localitateIdRaw) : null
  const sediuAdresa = String(formData.get("sediu_adresa") ?? "").trim() || null
  const shortDescription = String(formData.get("short_description") ?? "").trim() || null

  if (!legalName) return { ok: false, error: "Denumirea legală e obligatorie." }
  if (!anreNo) return { ok: false, error: "Numărul de autorizație ANRE e obligatoriu." }

  const baseSlug = slugifyRO(brandName || legalName).slice(0, 60) || "firma"
  const admin = getServiceRoleSupabase()

  // Slug unic (sufix numeric dacă există deja)
  let slug = baseSlug
  for (let i = 2; i < 100; i++) {
    const { data: existing } = await admin
      .from("gas_firms")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${i}`
  }

  const { data: firm, error } = await admin
    .from("gas_firms")
    .insert({
      slug,
      legal_name: legalName,
      brand_name: brandName,
      cui,
      anre_authorization_no: anreNo,
      anre_category: anreCategory,
      phone,
      email,
      sediu_judet_id: judetId,
      sediu_localitate_id: localitateId,
      sediu_adresa: sediuAdresa,
      short_description: shortDescription,
      owner_user_id: data.user.id,
      verification_status: "pending",
      plan: "free",
      is_active: true,
    })
    .select("id, slug")
    .single()

  if (error || !firm) {
    console.error("[createFirm]", error)
    return { ok: false, error: error?.message ?? "Eroare la salvare." }
  }

  // Leagă profilul la firma nouă + setează rolul pe "firm"
  await admin
    .from("profiles")
    .update({ firm_id: firm.id, role: "firm" })
    .eq("user_id", data.user.id)

  redirect("/dashboard/firma-mea")
}
