"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"
import { composeReminderSms } from "@/lib/sms/compose"

type Result = { ok: true } | { ok: false; error: string }
type PreviewResult = { ok: true; body: string; length: number; truncated: boolean } | { ok: false; error: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false as const, error: "Acces refuzat (doar admin)." }
  return { ok: true as const, userId: data.user.id, admin: getServiceRoleSupabase() }
}

export async function upsertSmsTemplate(
  id: string | null,
  formData: FormData,
): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  const reminderType = String(formData.get("reminder_type") ?? "").trim()
  const template = String(formData.get("template") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const maxChars = Number(formData.get("max_chars") ?? 160) || 160
  const isActive = formData.get("is_active") !== "off"

  if (!reminderType) return { ok: false, error: "reminder_type e obligatoriu." }
  if (!template) return { ok: false, error: "Template-ul nu poate fi gol." }
  if (maxChars < 50 || maxChars > 320) return { ok: false, error: "max_chars trebuie între 50 și 320." }

  const payload = { reminder_type: reminderType, template, description, max_chars: maxChars, is_active: isActive }

  if (id) {
    const { error } = await ctx.admin.from("sms_templates_admin").update(payload).eq("id", id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await ctx.admin
      .from("sms_templates_admin")
      .upsert(payload, { onConflict: "reminder_type" })
    if (error) return { ok: false, error: error.message }
  }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: "sms_template.save",
    entityType: "sms_templates_admin",
    entityId: id ?? reminderType,
    summary: `${reminderType}: ${template.slice(0, 60)}`,
  })

  revalidatePath("/dashboard/sms-templates")
  return { ok: true }
}

export async function deleteSmsTemplate(id: string): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx
  const { error } = await ctx.admin.from("sms_templates_admin").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: "sms_template.delete",
    entityType: "sms_templates_admin",
    entityId: id,
  })

  revalidatePath("/dashboard/sms-templates")
  return { ok: true }
}

/** Preview live — simulează compoziția SMS-ului pentru template curent */
export async function previewSmsTemplate(
  reminderType: string,
  template: string,
  maxChars: number,
): Promise<PreviewResult> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  // Upsert temporar template-ul ca să folosim composeReminderSms
  // (pentru preview real). Alternativa e să duplicăm logica — păstrăm simplu:
  // salvăm ca "preview_*" cu reminder_type unic.
  // Simplu: apelăm direct funcția helper cu override local.
  // Dar composeReminderSms citește din DB — pentru preview exact să folosim sample data.

  // Simulăm date reale
  const sampleDate = new Date()
  sampleDate.setMonth(sampleDate.getMonth() + 1)

  // Înlocuim direct placeholdere (fără a merge la DB)
  const vars: Record<string, string> = {
    FIRMA: "GazTech SRL",
    TELEFON: "0721234567",
    DATA: `${String(sampleDate.getDate()).padStart(2, "0")}.${String(sampleDate.getMonth() + 1).padStart(2, "0")}.${sampleDate.getFullYear()}`,
    ECHIPAMENT: reminderType === "iscir_centrala" ? "centralei termice"
              : reminderType === "service_detector_12m" ? "detectorului de gaz"
              : "instalatiei de gaz",
    ACTIUNE: reminderType === "revizie_120m" ? "revizia"
           : reminderType === "service_detector_12m" ? "service-ul"
           : "verificarea",
    ADRESA: "Str. Exemplu 10, Bucuresti",
    LINK: "https://bit.ly/ex5hort",
    REF: "ABCDEF12",
  }
  let body = template
  for (const [k, v] of Object.entries(vars)) {
    body = body.replace(new RegExp(`\\{${k}\\}`, "g"), v)
  }
  // Strip diacritics
  const dia: Record<string, string> = {
    ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
    Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
  }
  body = body.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => dia[ch] ?? ch).replace(/\s+/g, " ").trim()

  let truncated = false
  if (body.length > maxChars) {
    body = body.slice(0, maxChars - 1) + "…"
    truncated = true
  }
  return { ok: true, body, length: body.length, truncated }
}

// Suppress unused
void composeReminderSms
