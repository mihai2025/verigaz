"use server"

import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { generatePublicRef } from "@/lib/bookings/publicRef"
import { writeAudit } from "@/lib/audit/log"

export type CreateBookingResult =
  | { ok: true; publicRef: string }
  | { ok: false; error: string }

export async function createBooking(formData: FormData): Promise<CreateBookingResult> {
  const admin = getServiceRoleSupabase()

  // ── 1. Input validation ─────────────────────────────────────
  const firmSlug = String(formData.get("firm_slug") ?? "").trim()
  const categorySlug = String(formData.get("category_slug") ?? "").trim()
  const customerType = String(formData.get("customer_type") ?? "individual").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim() || null

  // PF-specific
  const firstName = String(formData.get("first_name") ?? "").trim() || null
  const lastName = String(formData.get("last_name") ?? "").trim() || null
  const cnp = String(formData.get("cnp") ?? "").trim() || null

  // PJ-specific
  const companyName = String(formData.get("company_name") ?? "").trim() || null
  const cui = String(formData.get("cui") ?? "").trim() || null

  // Calculăm full_name din câmpurile explicite
  let fullName: string
  if (customerType === "individual") {
    fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
  } else {
    fullName = companyName ?? ""
  }
  if (!fullName) {
    fullName = String(formData.get("full_name") ?? "").trim() // fallback
  }

  // Backward compat cu câmpul vechi association_name (pt cazuri când clientul vechi lasă field-ul)
  const associationName = customerType === "association" ? companyName : null
  const propertyType = String(formData.get("property_type") ?? "apartment").trim()
  const judetIdRaw = String(formData.get("judet_id") ?? "").trim()
  const localitateIdRaw = String(formData.get("localitate_id") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const blockName = String(formData.get("block_name") ?? "").trim() || null
  const stair = String(formData.get("stair") ?? "").trim() || null
  const apartment = String(formData.get("apartment") ?? "").trim() || null
  const floor = String(formData.get("floor") ?? "").trim() || null
  const preferredDate = String(formData.get("preferred_date") ?? "").trim() || null
  const preferredWindow = String(formData.get("preferred_time_window") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null
  const consent = formData.get("consent_gdpr")

  if (customerType === "individual" && (!firstName || !lastName)) {
    return { ok: false, error: "Numele și prenumele sunt obligatorii pentru persoană fizică." }
  }
  if (customerType !== "individual" && !companyName) {
    return { ok: false, error: "Denumirea firmei/asociației e obligatorie pentru persoană juridică." }
  }
  if (!fullName) return { ok: false, error: "Numele e obligatoriu." }
  if (!phone) return { ok: false, error: "Telefonul e obligatoriu." }
  if (!firmSlug) return { ok: false, error: "Firma nu e specificată." }
  if (!categorySlug) return { ok: false, error: "Alege serviciul dorit." }
  if (!address) return { ok: false, error: "Adresa e obligatorie." }
  if (!consent) return { ok: false, error: "Acceptarea politicii de confidențialitate e obligatorie." }

  // Validare CNP opțional (13 cifre)
  if (cnp && !/^\d{13}$/.test(cnp)) {
    return { ok: false, error: "CNP-ul trebuie să aibă 13 cifre." }
  }

  // ── 2. Resolve firm + category ──────────────────────────────
  const [firmRes, catRes] = await Promise.all([
    admin
      .from("gas_firms")
      .select("id, brand_name, legal_name")
      .eq("slug", firmSlug)
      .eq("is_active", true)
      .eq("verification_status", "approved")
      .maybeSingle(),
    admin.from("service_categories").select("id, nume").eq("slug", categorySlug).maybeSingle(),
  ])
  if (!firmRes.data) return { ok: false, error: "Firma nu mai e disponibilă." }
  if (!catRes.data) return { ok: false, error: "Serviciul selectat nu e valid." }

  const judetId = judetIdRaw ? Number(judetIdRaw) : null
  const localitateId = localitateIdRaw ? Number(localitateIdRaw) : null

  // ── 3. Link cu user autentificat (dacă e cazul) ────────────
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const authedUserId = authData.user?.id ?? null

  // ── 4. Creează sau reutilizează customer (match pe phone + optional user_id) ─
  let customerId: string
  {
    const lookup = admin
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle()
    const existing = await lookup
    if (existing.data) {
      customerId = existing.data.id as string
      // Link la auth user dacă nu era legat
      if (authedUserId) {
        await admin
          .from("customers")
          .update({ user_id: authedUserId })
          .eq("id", customerId)
          .is("user_id", null)
      }
    } else {
      const { data: inserted, error } = await admin
        .from("customers")
        .insert({
          user_id: authedUserId,
          customer_type: customerType,
          full_name: fullName,
          first_name: customerType === "individual" ? firstName : null,
          last_name: customerType === "individual" ? lastName : null,
          cnp: customerType === "individual" ? cnp : null,
          company_name: customerType !== "individual" ? companyName : null,
          cui: customerType !== "individual" ? cui : null,
          association_name: associationName,
          phone,
          email,
        })
        .select("id")
        .single()
      if (error || !inserted) return { ok: false, error: error?.message ?? "Eroare salvare client." }
      customerId = inserted.id as string
    }
  }

  // ── 5. Creează property ─────────────────────────────────────
  const { data: property, error: propError } = await admin
    .from("properties")
    .insert({
      customer_id: customerId,
      property_type: propertyType,
      judet_id: judetId,
      localitate_id: localitateId,
      address,
      block_name: blockName,
      stair,
      apartment,
      floor,
    })
    .select("id")
    .single()
  if (propError || !property) return { ok: false, error: propError?.message ?? "Eroare salvare adresă." }

  // ── 6. Creează booking cu public_ref ────────────────────────
  let publicRef = await generatePublicRef()
  // Retry scurt pe race condition (două requesturi simultane pot genera același ref)
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await admin.from("bookings").insert({
      public_ref: publicRef,
      customer_id: customerId,
      property_id: property.id,
      firm_id: firmRes.data.id,
      service_category_id: catRes.data.id,
      status: "pending",
      preferred_date: preferredDate,
      preferred_time_window: preferredWindow,
      notes_customer: notes,
      source: "web",
    })
    if (!error) break
    if (error.code === "23505") {
      publicRef = await generatePublicRef()
      continue
    }
    return { ok: false, error: error.message }
  }

  await writeAudit({
    actorUserId: authedUserId,
    actorRole: authedUserId ? "user" : "guest",
    action: "booking.create",
    entityType: "bookings",
    entityId: publicRef,
    summary: `${catRes.data.nume} @ ${firmRes.data.brand_name ?? firmRes.data.legal_name}`,
    metadata: { firmSlug, categorySlug, preferredDate, preferredWindow },
  })

  redirect(`/programare/${publicRef}`)
}
