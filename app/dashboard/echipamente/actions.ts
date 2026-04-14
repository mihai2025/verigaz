"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true } | { ok: false; error: string }

async function requireFirm() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, firmId, admin: getServiceRoleSupabase() }
}

function parseMonths(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

/**
 * Override pe un default existent (sau update pe un override).
 * Creează rândul dacă nu există, altfel îl actualizează.
 */
export async function overrideDefaultEquipment(
  defaultId: number,
  formData: FormData,
): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const nume = String(formData.get("nume") ?? "").trim()
  if (!nume) return { ok: false, error: "Numele e obligatoriu." }

  const payload = {
    firm_id: ctx.firmId,
    equipment_type_id: defaultId,
    nume,
    descriere: String(formData.get("descriere") ?? "").trim() || null,
    verificare_months: parseMonths(formData.get("verificare_months")),
    revizie_months: parseMonths(formData.get("revizie_months")),
    service_category_slug: String(formData.get("service_category_slug") ?? "").trim() || null,
    is_active: formData.get("is_active") !== "off",
  }

  // Upsert: dacă există override, update; altfel insert
  const { data: existing } = await ctx.admin
    .from("firm_equipment_types")
    .select("id")
    .eq("firm_id", ctx.firmId)
    .eq("equipment_type_id", defaultId)
    .maybeSingle()

  if (existing) {
    const { error } = await ctx.admin
      .from("firm_equipment_types")
      .update(payload)
      .eq("id", existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await ctx.admin.from("firm_equipment_types").insert(payload)
    if (error) return { ok: false, error: error.message }
  }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "equipment.override",
    entityType: "firm_equipment_types",
    entityId: String(defaultId),
    summary: nume,
  })

  revalidatePath("/dashboard/echipamente")
  return { ok: true }
}

/**
 * Revocă un override — șterge rândul firm_equipment_types (default rămâne activ).
 */
export async function resetOverride(defaultId: number): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const { error } = await ctx.admin
    .from("firm_equipment_types")
    .delete()
    .eq("firm_id", ctx.firmId)
    .eq("equipment_type_id", defaultId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/echipamente")
  return { ok: true }
}

/**
 * Creează un tip custom (fără legătură cu defaults) — doar pentru firma asta.
 */
export async function createCustomEquipment(formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const nume = String(formData.get("nume") ?? "").trim()
  if (!nume) return { ok: false, error: "Numele e obligatoriu." }

  const { error } = await ctx.admin.from("firm_equipment_types").insert({
    firm_id: ctx.firmId,
    equipment_type_id: null,
    nume,
    descriere: String(formData.get("descriere") ?? "").trim() || null,
    verificare_months: parseMonths(formData.get("verificare_months")),
    revizie_months: parseMonths(formData.get("revizie_months")),
    service_category_slug: String(formData.get("service_category_slug") ?? "").trim() || null,
    is_active: true,
  })
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "equipment.custom_create",
    entityType: "firm_equipment_types",
    entityId: ctx.firmId,
    summary: nume,
  })

  revalidatePath("/dashboard/echipamente")
  return { ok: true }
}

/**
 * Update pe un custom existent.
 */
export async function updateCustomEquipment(firmEquipmentId: string, formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const { data: existing } = await ctx.admin
    .from("firm_equipment_types")
    .select("firm_id, equipment_type_id")
    .eq("id", firmEquipmentId)
    .maybeSingle()
  if (!existing || existing.firm_id !== ctx.firmId) return { ok: false, error: "Nu există." }
  if (existing.equipment_type_id != null) return { ok: false, error: "Folosește overrideDefaultEquipment pentru override." }

  const nume = String(formData.get("nume") ?? "").trim()
  if (!nume) return { ok: false, error: "Numele e obligatoriu." }

  const { error } = await ctx.admin
    .from("firm_equipment_types")
    .update({
      nume,
      descriere: String(formData.get("descriere") ?? "").trim() || null,
      verificare_months: parseMonths(formData.get("verificare_months")),
      revizie_months: parseMonths(formData.get("revizie_months")),
      service_category_slug: String(formData.get("service_category_slug") ?? "").trim() || null,
      is_active: formData.get("is_active") !== "off",
    })
    .eq("id", firmEquipmentId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/echipamente")
  return { ok: true }
}

export async function deleteCustomEquipment(firmEquipmentId: string): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const { data: existing } = await ctx.admin
    .from("firm_equipment_types")
    .select("firm_id, equipment_type_id")
    .eq("id", firmEquipmentId)
    .maybeSingle()
  if (!existing || existing.firm_id !== ctx.firmId) return { ok: false, error: "Nu există." }
  if (existing.equipment_type_id != null) {
    return { ok: false, error: "Folosește resetOverride pentru a reveni la default." }
  }

  const { error } = await ctx.admin
    .from("firm_equipment_types")
    .delete()
    .eq("id", firmEquipmentId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/echipamente")
  return { ok: true }
}
