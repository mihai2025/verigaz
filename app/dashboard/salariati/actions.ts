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

export async function createEmployee(formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const fullName = String(formData.get("full_name") ?? "").trim()
  if (!fullName) return { ok: false, error: "Numele e obligatoriu." }

  const { data: inserted, error } = await ctx.admin
    .from("firm_employees")
    .insert({
      firm_id: ctx.firmId,
      full_name: fullName,
      employee_code: String(formData.get("employee_code") ?? "").trim() || null,
      role: String(formData.get("role") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      anre_personal_certificate_no: String(formData.get("anre_personal_certificate_no") ?? "").trim() || null,
      is_active: true,
    })
    .select("id")
    .single()
  if (error || !inserted) return { ok: false, error: error?.message ?? "Eroare salvare." }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "employee.create",
    entityType: "firm_employees",
    entityId: inserted.id as string,
    summary: fullName,
  })

  revalidatePath("/dashboard/salariati")
  return { ok: true }
}

export async function updateEmployee(employeeId: string, formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  // Verify ownership
  const { data: emp } = await ctx.admin
    .from("firm_employees")
    .select("firm_id")
    .eq("id", employeeId)
    .maybeSingle()
  if (!emp || emp.firm_id !== ctx.firmId) return { ok: false, error: "Angajat negăsit." }

  const fullName = String(formData.get("full_name") ?? "").trim()
  if (!fullName) return { ok: false, error: "Numele e obligatoriu." }

  const { error } = await ctx.admin
    .from("firm_employees")
    .update({
      full_name: fullName,
      employee_code: String(formData.get("employee_code") ?? "").trim() || null,
      role: String(formData.get("role") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      anre_personal_certificate_no: String(formData.get("anre_personal_certificate_no") ?? "").trim() || null,
    })
    .eq("id", employeeId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/salariati")
  revalidatePath(`/dashboard/salariati/${employeeId}`)
  return { ok: true }
}

export async function toggleEmployeeActive(employeeId: string, isActive: boolean): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const { data: emp } = await ctx.admin
    .from("firm_employees")
    .select("firm_id")
    .eq("id", employeeId)
    .maybeSingle()
  if (!emp || emp.firm_id !== ctx.firmId) return { ok: false, error: "Angajat negăsit." }

  const { error } = await ctx.admin
    .from("firm_employees")
    .update({
      is_active: isActive,
      deactivated_at: isActive ? null : new Date().toISOString(),
    })
    .eq("id", employeeId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: isActive ? "employee.reactivate" : "employee.deactivate",
    entityType: "firm_employees",
    entityId: employeeId,
  })

  revalidatePath("/dashboard/salariati")
  return { ok: true }
}
