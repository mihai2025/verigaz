"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true } | { ok: false; error: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, admin: getServiceRoleSupabase() }
}

async function applyStatus(
  firmId: string,
  status: "approved" | "rejected" | "suspended",
  reason: string | null,
): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  const patch: Record<string, unknown> = { verification_status: status }
  if (status === "approved") {
    patch.verified_at = new Date().toISOString()
    patch.verified_by = ctx.userId
    patch.rejection_reason = null
  } else if (status === "rejected") {
    patch.rejection_reason = reason ?? null
  } else if (status === "suspended") {
    patch.rejection_reason = reason ?? null
  }

  const { error } = await ctx.admin.from("gas_firms").update(patch).eq("id", firmId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: `firm.${status}`,
    entityType: "gas_firms",
    entityId: firmId,
    summary: reason ? `${status}: ${reason}` : status,
    metadata: { status, reason },
  })

  revalidatePath("/dashboard/firme")
  revalidatePath(`/dashboard/firme/${firmId}`)
  return { ok: true }
}

export async function approveFirm(firmId: string): Promise<Result> {
  return applyStatus(firmId, "approved", null)
}
export async function rejectFirm(firmId: string, reason: string): Promise<Result> {
  return applyStatus(firmId, "rejected", reason.trim() || null)
}
export async function suspendFirm(firmId: string, reason: string): Promise<Result> {
  return applyStatus(firmId, "suspended", reason.trim() || null)
}

export async function toggleFirmActive(firmId: string, isActive: boolean): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx
  const { error } = await ctx.admin
    .from("gas_firms")
    .update({ is_active: isActive })
    .eq("id", firmId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: isActive ? "firm.activate" : "firm.deactivate",
    entityType: "gas_firms",
    entityId: firmId,
  })

  revalidatePath(`/dashboard/firme/${firmId}`)
  return { ok: true }
}
