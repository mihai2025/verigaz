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

export async function assignLead(leadId: string, firmId: string | null): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  const patch: Record<string, unknown> = {
    assigned_firm_id: firmId,
    status: firmId ? "assigned" : "new",
    assigned_at: firmId ? new Date().toISOString() : null,
  }
  const { error } = await ctx.admin.from("leads").update(patch).eq("id", leadId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: firmId ? "lead.assign" : "lead.unassign",
    entityType: "leads",
    entityId: leadId,
    metadata: { firmId },
  })

  revalidatePath("/dashboard/leads-admin")
  return { ok: true }
}

export async function updateLeadStatus(leadId: string, status: string): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx
  const allowed = ["new", "assigned", "contacted", "converted", "lost", "spam"]
  if (!allowed.includes(status)) return { ok: false, error: "Status invalid." }

  const { error } = await ctx.admin.from("leads").update({ status }).eq("id", leadId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: `lead.${status}`,
    entityType: "leads",
    entityId: leadId,
  })

  revalidatePath("/dashboard/leads-admin")
  return { ok: true }
}
