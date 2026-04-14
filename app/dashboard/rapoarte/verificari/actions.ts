"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true } | { ok: false; error: string }
const VERIF_TYPES = ["certificat_verificare", "fisa_tehnica_centrala", "certificat_conformitate"]

async function requireFirm() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, firmId, admin: getServiceRoleSupabase() }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureVerificareBelongsToFirm(admin: any, documentId: string, firmId: string) {
  const { data } = await admin
    .from("documents")
    .select("firm_id, document_type")
    .eq("id", documentId)
    .maybeSingle()
  if (!data || data.firm_id !== firmId) return false
  if (!VERIF_TYPES.includes(data.document_type as string)) return false
  return true
}

export async function updateVerificare(documentId: string, formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  if (!(await ensureVerificareBelongsToFirm(ctx.admin, documentId, ctx.firmId))) {
    return { ok: false, error: "Verificarea nu îți aparține." }
  }

  const patch: Record<string, unknown> = {
    issued_at: String(formData.get("issued_at") ?? "").trim() || null,
    valid_until: String(formData.get("valid_until") ?? "").trim() || null,
  }

  const observations = String(formData.get("observations") ?? "").trim()
  const techEmployeeId = String(formData.get("technician_id") ?? "").trim() || null

  const { error: docErr } = await ctx.admin.from("documents").update(patch).eq("id", documentId)
  if (docErr) return { ok: false, error: docErr.message }

  const { data: doc } = await ctx.admin
    .from("documents")
    .select("booking_id")
    .eq("id", documentId)
    .maybeSingle()
  if (doc?.booking_id) {
    const bookingPatch: Record<string, unknown> = { notes_internal: observations || null }
    if (techEmployeeId) bookingPatch.assigned_team_member_id = techEmployeeId
    await ctx.admin.from("bookings").update(bookingPatch).eq("id", doc.booking_id)
  }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "verificare.update",
    entityType: "documents",
    entityId: documentId,
  })

  revalidatePath("/dashboard/rapoarte/verificari")
  return { ok: true }
}

export async function deleteVerificare(documentId: string, reason?: string): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  if (!(await ensureVerificareBelongsToFirm(ctx.admin, documentId, ctx.firmId))) {
    return { ok: false, error: "Verificarea nu îți aparține." }
  }

  const { error } = await ctx.admin
    .from("documents")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: reason?.trim() || "Șters de firmă",
    })
    .eq("id", documentId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "verificare.revoke",
    entityType: "documents",
    entityId: documentId,
    summary: reason ?? null,
  })

  revalidatePath("/dashboard/rapoarte/verificari")
  return { ok: true }
}

/**
 * Adaugă manual o verificare — creează customer/property/booking/job/document.
 * Opțional, leagă un equipment existent (dacă firma l-a creat deja).
 */
export async function addVerificareManual(formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const docType = String(formData.get("document_type") ?? "certificat_verificare").trim()
  if (!VERIF_TYPES.includes(docType)) return { ok: false, error: "Tip document invalid." }

  const documentNumber = String(formData.get("document_number") ?? "").trim()
  const issuedAt = String(formData.get("issued_at") ?? "").trim()
  const validMonths = Number(formData.get("valid_months") ?? 24)
  const customerName = String(formData.get("customer_name") ?? "").trim()
  const customerPhone = String(formData.get("customer_phone") ?? "").trim()
  const customerEmail = String(formData.get("customer_email") ?? "").trim() || null
  const judetId = String(formData.get("judet_id") ?? "").trim()
  const localitateId = String(formData.get("localitate_id") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const blockName = String(formData.get("block_name") ?? "").trim() || null
  const apartment = String(formData.get("apartment") ?? "").trim() || null
  const technicianId = String(formData.get("technician_id") ?? "").trim() || null
  const observations = String(formData.get("observations") ?? "").trim() || null

  // Equipment info (optional — se creează property_equipments dacă sunt date)
  const equipmentTypeId = String(formData.get("equipment_type_id") ?? "").trim()
  const firmEquipmentTypeId = String(formData.get("firm_equipment_type_id") ?? "").trim()
  const equipmentBrand = String(formData.get("equipment_brand") ?? "").trim() || null
  const equipmentModel = String(formData.get("equipment_model") ?? "").trim() || null
  const equipmentSerial = String(formData.get("equipment_serial") ?? "").trim() || null
  const equipmentInstallDate = String(formData.get("equipment_install_date") ?? "").trim() || null
  const equipmentManufactureDate = String(formData.get("equipment_manufacture_date") ?? "").trim() || null

  if (!documentNumber) return { ok: false, error: "Nr. document obligatoriu." }
  if (!issuedAt) return { ok: false, error: "Data verificării obligatorie." }
  if (!customerName || !customerPhone) return { ok: false, error: "Client + telefon obligatorii." }
  if (!address) return { ok: false, error: "Adresa obligatorie." }

  const issued = new Date(issuedAt)
  const valid = new Date(issued)
  valid.setMonth(valid.getMonth() + validMonths)

  // Customer upsert
  let customerId: string
  const { data: existing } = await ctx.admin
    .from("customers")
    .select("id")
    .eq("phone", customerPhone)
    .maybeSingle()
  if (existing) {
    customerId = existing.id as string
  } else {
    const { data: inserted, error } = await ctx.admin
      .from("customers")
      .insert({
        customer_type: "individual",
        full_name: customerName,
        phone: customerPhone,
        email: customerEmail,
      })
      .select("id")
      .single()
    if (error || !inserted) return { ok: false, error: error?.message ?? "Eroare client." }
    customerId = inserted.id as string
  }

  // Property
  const { data: prop, error: pErr } = await ctx.admin
    .from("properties")
    .insert({
      customer_id: customerId,
      property_type: "apartment",
      judet_id: judetId ? Number(judetId) : null,
      localitate_id: localitateId ? Number(localitateId) : null,
      address,
      block_name: blockName,
      apartment,
      last_verificare_at: issuedAt,
      next_verificare_due: valid.toISOString().slice(0, 10),
    })
    .select("id")
    .single()
  if (pErr || !prop) return { ok: false, error: pErr?.message ?? "Eroare adresă." }

  // Optional equipment
  let equipmentId: string | null = null
  if (equipmentTypeId || firmEquipmentTypeId) {
    const { data: eq } = await ctx.admin
      .from("property_equipments")
      .insert({
        property_id: prop.id,
        equipment_type_id: equipmentTypeId ? Number(equipmentTypeId) : null,
        firm_equipment_type_id: firmEquipmentTypeId || null,
        brand: equipmentBrand,
        model: equipmentModel,
        serial_number: equipmentSerial,
        installation_date: equipmentInstallDate,
        manufacture_date: equipmentManufactureDate,
        last_verificare_at: issuedAt,
        next_verificare_due: valid.toISOString().slice(0, 10),
        is_active: true,
      })
      .select("id")
      .single()
    equipmentId = eq?.id as string | null
  }

  // Booking
  const publicRef = `VG-M-${Date.now().toString(36).toUpperCase()}`
  const catSlug = docType === "fisa_tehnica_centrala" ? "verificare-centrala"
                : docType === "certificat_conformitate" ? "montaj-detector"
                : "verificare-instalatie"
  const { data: cat } = await ctx.admin
    .from("service_categories")
    .select("id")
    .eq("slug", catSlug)
    .maybeSingle()

  const { data: booking, error: bErr } = await ctx.admin
    .from("bookings")
    .insert({
      public_ref: publicRef,
      customer_id: customerId,
      property_id: prop.id,
      firm_id: ctx.firmId,
      service_category_id: cat?.id ?? null,
      status: "completed",
      preferred_date: issuedAt,
      scheduled_start: issuedAt,
      completed_at: issuedAt,
      source: "manual",
      assigned_team_member_id: technicianId,
      notes_internal: observations,
      equipment_id: equipmentId,
    })
    .select("id")
    .single()
  if (bErr || !booking) return { ok: false, error: bErr?.message ?? "Eroare booking." }

  const { data: job, error: jErr } = await ctx.admin
    .from("jobs")
    .insert({
      booking_id: booking.id,
      job_status: "completed",
      started_at: issuedAt,
      completed_at: issuedAt,
    })
    .select("id")
    .single()
  if (jErr || !job) return { ok: false, error: jErr?.message ?? "Eroare job." }

  const { error: dErr } = await ctx.admin.from("documents").insert({
    job_id: job.id,
    booking_id: booking.id,
    firm_id: ctx.firmId,
    customer_id: customerId,
    property_id: prop.id,
    document_type: docType,
    document_number: documentNumber,
    issued_at: issuedAt,
    valid_from: issuedAt,
    valid_until: valid.toISOString().slice(0, 10),
    signed_status: "unsigned",
    file_url: "",
    meta: { manual_entry: true },
  })
  if (dErr) return { ok: false, error: dErr.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "verificare.create_manual",
    entityType: "documents",
    entityId: publicRef,
    summary: `Manual: ${documentNumber} - ${customerName}`,
  })

  revalidatePath("/dashboard/rapoarte/verificari")
  return { ok: true }
}
