"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { sendSms } from "@/lib/sms/smsadvert"

type Result = { ok: true; message?: string } | { ok: false; error: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Neautentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false as const, error: "Doar admin." }
  return { ok: true as const, userId: data.user.id, admin: getServiceRoleSupabase() }
}

async function getLeadContext(
  admin: ReturnType<typeof getServiceRoleSupabase>,
  leadId: string,
): Promise<{ body: string; leadId: string; serviceName?: string; customerName?: string; customerPhone?: string; judetNume?: string; locNume?: string } | null> {
  const { data: lead } = await admin
    .from("leads")
    .select(
      "id, full_name, phone, judet_id, localitate_id, service_category_id, " +
      "service_categories:service_category_id(nume), " +
      "judete:judet_id(nume), localitati:localitate_id(nume)",
    )
    .eq("id", leadId)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = lead as any
  if (!l) return null
  const cat = Array.isArray(l.service_categories) ? l.service_categories[0] : l.service_categories
  const jud = Array.isArray(l.judete) ? l.judete[0] : l.judete
  const loc = Array.isArray(l.localitati) ? l.localitati[0] : l.localitati
  const body = [
    `Verigaz: cerere noua pt ${cat?.nume ?? "serviciu"}`,
    `Client ${l.full_name} tel ${l.phone}`,
    `Zona ${loc?.nume ?? "-"}, ${jud?.nume ?? "-"}`,
    `Raspunde in 24h`,
  ].join(". ").slice(0, 160)
  return {
    body,
    leadId: l.id,
    serviceName: cat?.nume,
    customerName: l.full_name,
    customerPhone: l.phone,
    judetNume: jud?.nume,
    locNume: loc?.nume,
  }
}

/** Retrimite același SMS la aceeași firmă (refresh phone din DB). */
export async function retrySmsLog(smsLogId: string): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  const { data: log } = await ctx.admin
    .from("sms_logs")
    .select("id, phone, body, firm_id, lead_id, template_key")
    .eq("id", smsLogId)
    .maybeSingle()
  if (!log) return { ok: false, error: "SMS log negăsit." }

  let phone = log.phone as string | null
  let body = log.body as string
  let firmId = log.firm_id as string | null

  // Refresh phone from firm
  if (firmId) {
    const { data: firm } = await ctx.admin.from("gas_firms").select("phone").eq("id", firmId).maybeSingle()
    if (firm?.phone) phone = firm.phone as string
  }

  if (!phone) return { ok: false, error: "Firma nu are telefon configurat." }

  // Refresh body from lead (dacă are)
  if (log.lead_id) {
    const ctxLead = await getLeadContext(ctx.admin, log.lead_id as string)
    if (ctxLead) body = ctxLead.body
  }

  const res = await sendSms(phone, body)
  await ctx.admin.from("sms_logs").insert({
    phone,
    body,
    template_key: log.template_key,
    status: res.ok ? "sent" : "failed",
    error_message: res.ok ? null : res.error,
    lead_id: log.lead_id,
    firm_id: firmId,
    direction: "outbound",
  })

  revalidatePath("/dashboard/sms-log")
  return { ok: true, message: res.ok ? "SMS retrimis cu succes." : `Eroare: ${res.error}` }
}

/** Retrimite SMS la o altă firmă (ales de admin). */
export async function retrySmsToFirm(smsLogId: string, targetFirmId: string): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  const { data: log } = await ctx.admin
    .from("sms_logs")
    .select("id, body, lead_id, template_key")
    .eq("id", smsLogId)
    .maybeSingle()
  if (!log) return { ok: false, error: "SMS log negăsit." }

  const { data: firm } = await ctx.admin
    .from("gas_firms")
    .select("id, phone, brand_name, legal_name")
    .eq("id", targetFirmId)
    .maybeSingle()
  if (!firm || !firm.phone) return { ok: false, error: "Firma aleasă nu are telefon." }

  let body = log.body as string
  if (log.lead_id) {
    const ctxLead = await getLeadContext(ctx.admin, log.lead_id as string)
    if (ctxLead) body = ctxLead.body
  }

  const res = await sendSms(firm.phone as string, body)
  await ctx.admin.from("sms_logs").insert({
    phone: firm.phone,
    body,
    template_key: log.template_key,
    status: res.ok ? "sent" : "failed",
    error_message: res.ok ? null : res.error,
    lead_id: log.lead_id,
    firm_id: firm.id,
    direction: "outbound",
  })

  // Update lead assigned_firm_id (ca să știm unde s-a redirecționat)
  if (log.lead_id) {
    await ctx.admin.from("leads").update({ assigned_firm_id: firm.id, assigned_at: new Date().toISOString() }).eq("id", log.lead_id as string)
  }

  revalidatePath("/dashboard/sms-log")
  return { ok: true, message: res.ok ? `SMS redirecționat la ${firm.brand_name || firm.legal_name}.` : `Eroare: ${res.error}` }
}
