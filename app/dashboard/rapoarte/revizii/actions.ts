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

async function ensureDocBelongsToFirm(admin: any, documentId: string, firmId: string) {
  const { data } = await admin
    .from("documents")
    .select("firm_id, document_type")
    .eq("id", documentId)
    .maybeSingle()
  if (!data || data.firm_id !== firmId) return false
  if (data.document_type !== "proces_verbal_revizie") return false
  return true
}

export async function updateRevizie(documentId: string, formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  if (!(await ensureDocBelongsToFirm(ctx.admin, documentId, ctx.firmId))) {
    return { ok: false, error: "Revizia nu îți aparține." }
  }

  const patch: Record<string, unknown> = {
    issued_at: String(formData.get("issued_at") ?? "").trim() || null,
    valid_until: String(formData.get("valid_until") ?? "").trim() || null,
  }

  const observations = String(formData.get("observations") ?? "").trim()
  const techEmployeeId = String(formData.get("technician_id") ?? "").trim() || null

  // Update documents (datele)
  const { error: docErr } = await ctx.admin
    .from("documents")
    .update(patch)
    .eq("id", documentId)
  if (docErr) return { ok: false, error: docErr.message }

  // Update booking-ul asociat pentru notes_internal (observații) + tehnician
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
    action: "revizie.update",
    entityType: "documents",
    entityId: documentId,
  })

  revalidatePath("/dashboard/rapoarte/revizii")
  return { ok: true }
}

export async function deleteRevizie(documentId: string, reason?: string): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  if (!(await ensureDocBelongsToFirm(ctx.admin, documentId, ctx.firmId))) {
    return { ok: false, error: "Revizia nu îți aparține." }
  }

  // Soft delete = revocare
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
    action: "revizie.revoke",
    entityType: "documents",
    entityId: documentId,
    summary: reason ?? null,
  })

  revalidatePath("/dashboard/rapoarte/revizii")
  return { ok: true }
}

/**
 * Adaugă manuală a unei revizii (pentru migrarea dosarelor vechi de hârtie).
 * Creează customer (dacă nu există pe phone), property, booking, job, documents.
 */
export async function addRevizieManual(formData: FormData): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const documentNumber = String(formData.get("document_number") ?? "").trim()
  const issuedAt = String(formData.get("issued_at") ?? "").trim()
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

  if (!documentNumber) return { ok: false, error: "Nr. document obligatoriu." }
  if (!issuedAt) return { ok: false, error: "Data reviziei obligatorie." }
  if (!customerName) return { ok: false, error: "Numele clientului obligatoriu." }
  if (!customerPhone) return { ok: false, error: "Telefonul obligatoriu." }
  if (!address) return { ok: false, error: "Adresa obligatorie." }

  // Valabilitate = issued_at + 120 luni
  const issued = new Date(issuedAt)
  const valid = new Date(issued)
  valid.setMonth(valid.getMonth() + 120)

  // Upsert customer pe telefon
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
      last_revizie_at: issuedAt,
      next_revizie_due: valid.toISOString().slice(0, 10),
    })
    .select("id")
    .single()
  if (pErr || !prop) return { ok: false, error: pErr?.message ?? "Eroare adresă." }

  // Booking (cu public_ref manual prefix)
  const publicRef = `VG-M-${Date.now().toString(36).toUpperCase()}`
  const { data: cat } = await ctx.admin
    .from("service_categories")
    .select("id")
    .eq("slug", "revizie-instalatie")
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
    })
    .select("id")
    .single()
  if (bErr || !booking) return { ok: false, error: bErr?.message ?? "Eroare booking." }

  // Job
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

  // Document
  const { error: dErr } = await ctx.admin.from("documents").insert({
    job_id: job.id,
    booking_id: booking.id,
    firm_id: ctx.firmId,
    customer_id: customerId,
    property_id: prop.id,
    document_type: "proces_verbal_revizie",
    document_number: documentNumber,
    issued_at: issuedAt,
    valid_from: issuedAt,
    valid_until: valid.toISOString().slice(0, 10),
    signed_status: "unsigned",
    file_url: "",  // fără PDF pentru entry-urile manuale
    meta: { manual_entry: true },
  })
  if (dErr) return { ok: false, error: dErr.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "revizie.create_manual",
    entityType: "documents",
    entityId: publicRef,
    summary: `Manual: ${documentNumber} - ${customerName}`,
  })

  revalidatePath("/dashboard/rapoarte/revizii")
  return { ok: true }
}
