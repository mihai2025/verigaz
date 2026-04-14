"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type R = { ok: true; userId?: string } | { ok: false; error: string }

async function requireAdmin(): Promise<{ ok: true; actorId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Neautentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false, error: "Permisiune insuficientă." }
  return { ok: true, actorId: data.user.id }
}

export async function createUser(formData: FormData): Promise<R> {
  const check = await requireAdmin()
  if (!check.ok) return check

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const fullName = String(formData.get("full_name") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const role = String(formData.get("role") ?? "user").trim()
  const firmIdRaw = String(formData.get("firm_id") ?? "").trim()
  const firmId = firmIdRaw || null
  const autoConfirm = String(formData.get("auto_confirm") ?? "") === "on"

  if (!email || !email.includes("@")) return { ok: false, error: "Email invalid." }
  if (!password || password.length < 8) return { ok: false, error: "Parola trebuie să aibă minim 8 caractere." }

  const admin = getServiceRoleSupabase()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: autoConfirm,
    user_metadata: { full_name: fullName ?? undefined },
  })
  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? "Eroare la crearea userului." }
  }

  const userId = created.user.id

  // profile row is auto-created via trigger; update with our values
  const { error: profErr } = await admin
    .from("profiles")
    .upsert({
      user_id: userId,
      email,
      full_name: fullName,
      phone,
      role,
      firm_id: firmId,
      updated_at: new Date().toISOString(),
    })
  if (profErr) return { ok: false, error: `User creat dar profil ne-scris: ${profErr.message}` }

  // Dacă s-a selectat o firmă, setează și owner_user_id pe gas_firms
  if (firmId) {
    await admin.from("gas_firms").update({ owner_user_id: userId }).eq("id", firmId)
  }

  revalidatePath("/dashboard/utilizatori")
  redirect(`/dashboard/utilizatori/${userId}`)
}

export async function updateUser(formData: FormData): Promise<R> {
  const check = await requireAdmin()
  if (!check.ok) return check

  const userId = String(formData.get("user_id") ?? "").trim()
  const fullName = String(formData.get("full_name") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const role = String(formData.get("role") ?? "user").trim()

  if (!userId) return { ok: false, error: "user_id lipsă." }

  const admin = getServiceRoleSupabase()
  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName, phone, role, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/dashboard/utilizatori/${userId}`)
  revalidatePath("/dashboard/utilizatori")
  return { ok: true }
}

export async function assignUserToFirm(formData: FormData): Promise<R> {
  const check = await requireAdmin()
  if (!check.ok) return check

  const userId = String(formData.get("user_id") ?? "").trim()
  const firmIdRaw = String(formData.get("firm_id") ?? "").trim()
  const firmId = firmIdRaw || null
  if (!userId) return { ok: false, error: "user_id lipsă." }

  const admin = getServiceRoleSupabase()

  // Dezleagă firma anterioară (dacă userul era owner)
  const { data: prev } = await admin.from("profiles").select("firm_id").eq("user_id", userId).maybeSingle()
  const prevFirmId = (prev as { firm_id: string | null } | null)?.firm_id ?? null
  if (prevFirmId && prevFirmId !== firmId) {
    await admin.from("gas_firms").update({ owner_user_id: null }).eq("id", prevFirmId).eq("owner_user_id", userId)
  }

  // Update profil
  await admin.from("profiles").update({ firm_id: firmId, updated_at: new Date().toISOString() }).eq("user_id", userId)

  // Setează owner pe firma nouă (dacă există)
  if (firmId) {
    // dacă firma are deja alt owner, îl dezleagă din profilul lui
    const { data: currentOwner } = await admin.from("gas_firms").select("owner_user_id").eq("id", firmId).maybeSingle()
    const prevOwnerId = (currentOwner as { owner_user_id: string | null } | null)?.owner_user_id ?? null
    if (prevOwnerId && prevOwnerId !== userId) {
      await admin.from("profiles").update({ firm_id: null, updated_at: new Date().toISOString() }).eq("user_id", prevOwnerId)
    }
    await admin.from("gas_firms").update({ owner_user_id: userId }).eq("id", firmId)
  }

  revalidatePath(`/dashboard/utilizatori/${userId}`)
  revalidatePath("/dashboard/utilizatori")
  revalidatePath("/dashboard/firme")
  return { ok: true }
}

export async function assignFirmToUser(formData: FormData): Promise<R> {
  // same backing logic — helper pentru UI din pagina firmei
  return assignUserToFirm(formData)
}

export async function deleteUser(formData: FormData): Promise<R> {
  const check = await requireAdmin()
  if (!check.ok) return check

  const userId = String(formData.get("user_id") ?? "").trim()
  if (!userId) return { ok: false, error: "user_id lipsă." }
  if (userId === check.actorId) return { ok: false, error: "Nu te poți șterge pe tine." }

  const admin = getServiceRoleSupabase()

  // Dezleagă firma (dacă userul e owner) înainte de delete
  await admin.from("gas_firms").update({ owner_user_id: null }).eq("owner_user_id", userId)

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/utilizatori")
  redirect("/dashboard/utilizatori")
}
