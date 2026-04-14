"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Result = { ok: true } | { ok: false; error: string }

export async function updateFirmProfile(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false, error: "Acces refuzat." }

  const advanceRaw = String(formData.get("reminder_advance_days") ?? "").trim()
  const advanceDays = advanceRaw ? Math.max(0, Math.min(90, Number(advanceRaw))) : 7

  const patch = {
    brand_name:          String(formData.get("brand_name") ?? "").trim() || null,
    short_description:   String(formData.get("short_description") ?? "").trim() || null,
    description:         String(formData.get("description") ?? "").trim() || null,
    phone:               String(formData.get("phone") ?? "").trim() || null,
    phone_secondary:     String(formData.get("phone_secondary") ?? "").trim() || null,
    email:               String(formData.get("email") ?? "").trim() || null,
    whatsapp:            String(formData.get("whatsapp") ?? "").trim() || null,
    website:             String(formData.get("website") ?? "").trim() || null,
    facebook_url:        String(formData.get("facebook_url") ?? "").trim() || null,
    instagram_url:       String(formData.get("instagram_url") ?? "").trim() || null,
    contact_person_name: String(formData.get("contact_person_name") ?? "").trim() || null,
    contact_person_role: String(formData.get("contact_person_role") ?? "").trim() || null,
    contact_person_phone: String(formData.get("contact_person_phone") ?? "").trim() || null,
    contact_person_email: String(formData.get("contact_person_email") ?? "").trim() || null,
    sediu_adresa:        String(formData.get("sediu_adresa") ?? "").trim() || null,
    reminder_advance_days: advanceDays,
  }

  const admin = getServiceRoleSupabase()
  const { error } = await admin.from("gas_firms").update(patch).eq("id", firmId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/firma-mea")
  return { ok: true }
}
