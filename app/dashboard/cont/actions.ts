"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }

export async function updateProfile(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Nu ești autentificat." }

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120) || null
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30) || null

  const admin = getServiceRoleSupabase()
  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("user_id", data.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/cont")
  return { ok: true }
}
