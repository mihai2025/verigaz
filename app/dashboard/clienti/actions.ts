"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true; id?: string } | { ok: false; error: string }

async function requireFirm() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, firmId, admin: getServiceRoleSupabase() }
}

async function firmHasTouchedProperty(admin: any, firmId: string, propertyId: string): Promise<boolean> {
  // O firmă poate gestiona echipamente doar pentru proprietățile clienților săi
  // (definit ca: a avut booking-uri cu acel property_id).
  const { data } = await admin
    .from("bookings")
    .select("id")
    .eq("firm_id", firmId)
    .eq("property_id", propertyId)
    .limit(1)
    .maybeSingle()
  return !!data
}

export async function upsertPropertyEquipment(
  equipmentId: string | null,
  formData: FormData,
): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const propertyId = String(formData.get("property_id") ?? "").trim()
  if (!propertyId) return { ok: false, error: "Adresa e obligatorie." }
  if (!(await firmHasTouchedProperty(ctx.admin, ctx.firmId, propertyId))) {
    return { ok: false, error: "Nu ai acces la această adresă (clientul nu e client al firmei tale)." }
  }

  const equipmentTypeRaw = String(formData.get("equipment_type_id") ?? "").trim()
  const firmEquipmentTypeRaw = String(formData.get("firm_equipment_type_id") ?? "").trim()
  if (!equipmentTypeRaw && !firmEquipmentTypeRaw) {
    return { ok: false, error: "Alege tipul de echipament." }
  }

  const payload: Record<string, unknown> = {
    property_id: propertyId,
    equipment_type_id: equipmentTypeRaw ? Number(equipmentTypeRaw) : null,
    firm_equipment_type_id: firmEquipmentTypeRaw || null,
    brand: String(formData.get("brand") ?? "").trim() || null,
    model: String(formData.get("model") ?? "").trim() || null,
    serial_number: String(formData.get("serial_number") ?? "").trim() || null,
    manufacture_date: String(formData.get("manufacture_date") ?? "").trim() || null,
    installation_date: String(formData.get("installation_date") ?? "").trim() || null,
    observations: String(formData.get("observations") ?? "").trim() || null,
    is_active: formData.get("is_active") !== "off",
  }

  if (equipmentId) {
    const { error } = await ctx.admin
      .from("property_equipments")
      .update(payload)
      .eq("id", equipmentId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorUserId: ctx.userId,
      actorRole: "firm_owner",
      action: "property_equipment.update",
      entityType: "property_equipments",
      entityId: equipmentId,
    })
    revalidatePath("/dashboard/clienti")
    return { ok: true, id: equipmentId }
  }

  const { data, error } = await ctx.admin
    .from("property_equipments")
    .insert(payload)
    .select("id")
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? "Eroare." }
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "property_equipment.create",
    entityType: "property_equipments",
    entityId: data.id as string,
    summary: `${payload.brand ?? ""} ${payload.model ?? ""}`.trim(),
  })
  revalidatePath("/dashboard/clienti")
  return { ok: true, id: data.id as string }
}

export async function deactivateEquipment(equipmentId: string): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const { data: eq } = await ctx.admin
    .from("property_equipments")
    .select("property_id")
    .eq("id", equipmentId)
    .maybeSingle()
  if (!eq) return { ok: false, error: "Echipament negăsit." }
  if (!(await firmHasTouchedProperty(ctx.admin, ctx.firmId, eq.property_id as string))) {
    return { ok: false, error: "Nu ai acces la această adresă." }
  }

  const { error } = await ctx.admin
    .from("property_equipments")
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq("id", equipmentId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/clienti")
  return { ok: true }
}
