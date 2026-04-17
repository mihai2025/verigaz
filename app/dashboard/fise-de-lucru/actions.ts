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

const STATUSES = ["planificat", "in_lucru", "finalizat", "anulat"] as const
const WORK_TYPES = ["verificare", "revizie", "reparatie", "instalare", "inspectie", "altul"] as const

async function syncSheetEquipments(
  admin: ReturnType<typeof getServiceRoleSupabase>,
  sheetId: string,
  equipmentIds: string[],
) {
  await admin.from("work_sheet_equipments").delete().eq("work_sheet_id", sheetId)
  if (equipmentIds.length === 0) return
  const rows = equipmentIds.map((id) => ({ work_sheet_id: sheetId, equipment_id: id }))
  await admin.from("work_sheet_equipments").insert(rows)
}

export async function upsertWorkSheet(
  sheetId: string | null,
  formData: FormData,
): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const workDate = String(formData.get("work_date") ?? "").trim()
  if (!workDate) return { ok: false, error: "Data e obligatorie." }

  const status = String(formData.get("status") ?? "planificat").trim()
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return { ok: false, error: "Status invalid." }
  }

  const workType = String(formData.get("work_type") ?? "altul").trim()
  if (!WORK_TYPES.includes(workType as (typeof WORK_TYPES)[number])) {
    return { ok: false, error: "Tip intervenție invalid." }
  }

  const contractId = String(formData.get("contract_id") ?? "").trim() || null
  const technicianId = String(formData.get("technician_id") ?? "").trim() || null
  const propertyId = String(formData.get("property_id") ?? "").trim() || null
  const startTime = String(formData.get("start_time") ?? "").trim() || null
  const endTime = String(formData.get("end_time") ?? "").trim() || null
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim()
  const duration = durationRaw ? Number(durationRaw) : null
  const tasksDone = String(formData.get("tasks_done") ?? "").trim() || null
  const materialsUsed = String(formData.get("materials_used") ?? "").trim() || null
  const observations = String(formData.get("observations") ?? "").trim() || null
  const signedByCustomer = formData.get("signed_by_customer") === "on"

  const equipmentIds = formData.getAll("equipment_ids").map((v) => String(v).trim()).filter(Boolean)

  const payload: Record<string, unknown> = {
    firm_id: ctx.firmId,
    contract_id: contractId,
    property_id: propertyId,
    technician_id: technicianId,
    work_date: workDate,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: Number.isFinite(duration) ? duration : null,
    tasks_done: tasksDone,
    materials_used: materialsUsed,
    observations,
    signed_by_customer: signedByCustomer,
    signed_at: signedByCustomer ? new Date().toISOString() : null,
    status,
    work_type: workType,
  }

  if (sheetId) {
    const { error } = await ctx.admin.from("work_sheets").update(payload).eq("id", sheetId).eq("firm_id", ctx.firmId)
    if (error) return { ok: false, error: error.message }
    await syncSheetEquipments(ctx.admin, sheetId, equipmentIds)
    await writeAudit({
      actorUserId: ctx.userId,
      actorRole: "firm_owner",
      action: "work_sheet.update",
      entityType: "work_sheets",
      entityId: sheetId,
    })
    revalidatePath("/dashboard/fise-de-lucru")
    return { ok: true, id: sheetId }
  }

  payload.created_by = ctx.userId
  const { data, error } = await ctx.admin.from("work_sheets").insert(payload).select("id").single()
  if (error || !data) return { ok: false, error: error?.message ?? "Eroare la creare fișă." }
  await syncSheetEquipments(ctx.admin, data.id as string, equipmentIds)
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "work_sheet.create",
    entityType: "work_sheets",
    entityId: data.id as string,
  })
  revalidatePath("/dashboard/fise-de-lucru")
  return { ok: true, id: data.id as string }
}

export async function deleteWorkSheet(sheetId: string): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  const { error } = await ctx.admin
    .from("work_sheets")
    .delete()
    .eq("id", sheetId)
    .eq("firm_id", ctx.firmId)
  if (error) return { ok: false, error: error.message }
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "work_sheet.delete",
    entityType: "work_sheets",
    entityId: sheetId,
  })
  revalidatePath("/dashboard/fise-de-lucru")
  return { ok: true }
}
