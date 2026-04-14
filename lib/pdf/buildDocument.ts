// lib/pdf/buildDocument.ts
//
// Orchestrator: preia un booking finalizat, randează PDF-ul potrivit
// (certificat/ proces-verbal), îl urcă pe R2 și creează rândul în `documents`
// cu sha256 + public_ref. Public_ref permite verificarea online.
import { createHash, randomBytes } from "node:crypto"
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { putObject } from "@/lib/r2/putObject"
import { renderCertificatVerificare } from "./templates/certificatVerificare"
import { renderProcesVerbalRevizie } from "./templates/procesVerbalRevizie"

export type DocumentType =
  | "certificat_verificare"
  | "proces_verbal_revizie"
  | "certificat_conformitate"
  | "fisa_tehnica_centrala"

export type BuildDocumentResult =
  | { ok: true; documentId: string; publicRef: string; fileUrl: string; sha256: string }
  | { ok: false; error: string }

// Mapare categorie → tip document generat la completeBooking
const CATEGORY_TO_DOC_TYPE: Record<string, DocumentType> = {
  "verificare-instalatie": "certificat_verificare",
  "revizie-instalatie":    "proces_verbal_revizie",
  "verificare-centrala":   "fisa_tehnica_centrala",
  "revizie-centrala":      "fisa_tehnica_centrala",
  "montaj-detector":       "certificat_conformitate",
}

const VALIDITY_MONTHS: Record<DocumentType, number> = {
  certificat_verificare:   24,
  proces_verbal_revizie:   120,
  certificat_conformitate: 24,
  fisa_tehnica_centrala:   12,
}

function genPublicRef(): string {
  // 12 hex chars — suficient pt verificare online, ușor de scanat
  return randomBytes(6).toString("hex")
}

export async function buildDocumentForBooking(
  bookingId: string,
  opts: { technician?: string } = {},
): Promise<BuildDocumentResult> {
  const admin = getServiceRoleSupabase()

  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, public_ref, firm_id, customer_id, service_category_id, completed_at, " +
      "gas_firms(brand_name, legal_name, cui, anre_authorization_no, anre_category, phone, sediu_adresa), " +
      "service_categories(slug), " +
      "customers(full_name, phone, email), " +
      "properties(id, address, block_name, apartment, judete:judet_id(nume), localitati:localitate_id(nume)), " +
      "jobs(id)",
    )
    .eq("id", bookingId)
    .maybeSingle()
  if (error || !booking) return { ok: false, error: error?.message ?? "Booking negăsit." }
  if (!booking.completed_at) return { ok: false, error: "Programarea nu e finalizată." }

  const f = Array.isArray(booking.gas_firms) ? booking.gas_firms[0] : booking.gas_firms
  const sc = Array.isArray(booking.service_categories) ? booking.service_categories[0] : booking.service_categories
  const c = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers
  const p = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties
  const jobRow = Array.isArray(booking.jobs) ? booking.jobs[0] : booking.jobs

  if (!f || !sc || !c || !p) return { ok: false, error: "Date incomplete pe booking." }

  const docType = CATEGORY_TO_DOC_TYPE[sc.slug as string]
  if (!docType) {
    return { ok: false, error: `Categoria ${sc.slug} nu are template PDF.` }
  }

  // Un job trebuie să existe pentru referire în documents.job_id.
  let jobId: string
  if (jobRow?.id) {
    jobId = jobRow.id as string
  } else {
    const { data: newJob, error: jobErr } = await admin
      .from("jobs")
      .insert({
        booking_id: booking.id,
        job_status: "completed",
        completed_at: booking.completed_at,
      })
      .select("id")
      .single()
    if (jobErr || !newJob) return { ok: false, error: jobErr?.message ?? "Eroare creare job." }
    jobId = newJob.id as string
  }

  // Document number format: "{firm-short}/{year}/{seq}"
  const year = new Date().getFullYear()
  const { count } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", booking.firm_id)
    .gte("issued_at", `${year}-01-01`)
  const seq = (count ?? 0) + 1
  const documentNumber = `${year}/${String(seq).padStart(5, "0")}`

  const issuedAt = new Date()
  const validUntil = new Date(issuedAt)
  validUntil.setMonth(validUntil.getMonth() + VALIDITY_MONTHS[docType])

  const publicRef = genPublicRef()

  // Randează PDF în funcție de tip
  const firmData = {
    brandName: f.brand_name as string | null,
    legalName: f.legal_name as string,
    anreAuthorizationNo: f.anre_authorization_no as string | null,
    anreCategory: f.anre_category as string | null,
    cui: f.cui as string | null,
    phone: f.phone as string | null,
    sediuAdresa: f.sediu_adresa as string | null,
  }
  const customerData = {
    fullName: c.full_name as string,
    phone: c.phone as string,
    email: c.email as string | null,
  }
  const propertyData = {
    address: p.address as string,
    blockName: p.block_name as string | null,
    apartment: p.apartment as string | null,
    localitateNume: (Array.isArray(p.localitati) ? p.localitati[0]?.nume : p.localitati?.nume) ?? null,
    judetNume: (Array.isArray(p.judete) ? p.judete[0]?.nume : p.judete?.nume) ?? null,
  }

  let pdfBytes: Uint8Array
  if (docType === "certificat_verificare") {
    pdfBytes = await renderCertificatVerificare({
      documentNumber, publicRef, issuedAt, validUntil,
      firm: firmData, customer: customerData, property: propertyData,
      signedBy: opts.technician,
    })
  } else if (docType === "proces_verbal_revizie") {
    pdfBytes = await renderProcesVerbalRevizie({
      documentNumber, publicRef, issuedAt, validUntil,
      firm: firmData, customer: customerData, property: propertyData,
      signedBy: opts.technician,
    })
  } else {
    // certificat_conformitate / fisa_tehnica_centrala — reuse certificatVerificare
    // ca template neutru până când avem template dedicat (V2).
    pdfBytes = await renderCertificatVerificare({
      documentNumber, publicRef, issuedAt, validUntil,
      firm: firmData, customer: customerData, property: propertyData,
      signedBy: opts.technician,
    })
  }

  // Hash + upload
  const sha256 = createHash("sha256").update(pdfBytes).digest("hex")
  const r2Key = `documents/${year}/${docType}/${publicRef}.pdf`
  const { publicUrl } = await putObject({
    key: r2Key,
    body: Buffer.from(pdfBytes),
    contentType: "application/pdf",
    cacheControl: "public, max-age=31536000, immutable",
    metadata: { "booking-id": booking.id, "doc-type": docType, sha256 },
  })

  // Insert documents row
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .insert({
      job_id: jobId,
      booking_id: booking.id,
      firm_id: booking.firm_id,
      customer_id: booking.customer_id,
      property_id: p.id,
      document_type: docType,
      document_number: documentNumber,
      version: 1,
      public_ref: publicRef,
      file_url: publicUrl,
      sha256_hash: sha256,
      signed_status: "unsigned",
      issued_at: issuedAt.toISOString(),
      valid_from: issuedAt.toISOString().slice(0, 10),
      valid_until: validUntil.toISOString().slice(0, 10),
    })
    .select("id")
    .single()
  if (docErr || !doc) return { ok: false, error: docErr?.message ?? "Eroare salvare document." }

  return {
    ok: true,
    documentId: doc.id as string,
    publicRef,
    fileUrl: publicUrl,
    sha256,
  }
}
