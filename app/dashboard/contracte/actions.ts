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

const PERIOD_TYPES = ["2_ani", "10_ani", "anual", "custom"] as const
const STATUSES = ["activ", "expirat", "reziliat", "suspendat"] as const

async function syncContractEquipments(
  admin: ReturnType<typeof getServiceRoleSupabase>,
  contractId: string,
  equipmentIds: string[],
) {
  await admin.from("contract_equipments").delete().eq("contract_id", contractId)
  if (equipmentIds.length === 0) return
  const rows = equipmentIds.map((id) => ({ contract_id: contractId, equipment_id: id }))
  await admin.from("contract_equipments").insert(rows)
}

export async function upsertContract(
  contractId: string | null,
  formData: FormData,
): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const customerId = String(formData.get("customer_id") ?? "").trim()
  const propertyIdRaw = String(formData.get("property_id") ?? "").trim()
  const propertyId = propertyIdRaw || null
  const contractNumber = String(formData.get("contract_number") ?? "").trim() || null
  const periodType = String(formData.get("period_type") ?? "").trim()
  const startDate = String(formData.get("start_date") ?? "").trim()
  const expiryDate = String(formData.get("expiry_date") ?? "").trim()
  const monthlyFeeRaw = String(formData.get("monthly_fee") ?? "").trim()
  const totalAmountRaw = String(formData.get("total_amount") ?? "").trim()
  const status = String(formData.get("status") ?? "activ").trim()
  const notes = String(formData.get("notes") ?? "").trim() || null

  if (!customerId) return { ok: false, error: "Clientul e obligatoriu." }
  if (!PERIOD_TYPES.includes(periodType as (typeof PERIOD_TYPES)[number])) {
    return { ok: false, error: "Tipul de perioadă e invalid." }
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return { ok: false, error: "Status invalid." }
  }
  if (!startDate || !expiryDate) return { ok: false, error: "Data de început și cea de expirare sunt obligatorii." }
  if (new Date(expiryDate) <= new Date(startDate)) {
    return { ok: false, error: "Data de expirare trebuie să fie după data de început." }
  }

  const monthlyFee = monthlyFeeRaw ? Number(monthlyFeeRaw) : null
  const totalAmount = totalAmountRaw ? Number(totalAmountRaw) : null
  if (monthlyFee != null && (!Number.isFinite(monthlyFee) || monthlyFee < 0)) {
    return { ok: false, error: "Tariful lunar trebuie să fie număr ≥ 0." }
  }
  if (totalAmount != null && (!Number.isFinite(totalAmount) || totalAmount < 0)) {
    return { ok: false, error: "Valoarea totală trebuie să fie număr ≥ 0." }
  }

  const equipmentIds = formData.getAll("equipment_ids").map((v) => String(v).trim()).filter(Boolean)

  const payload: Record<string, unknown> = {
    firm_id: ctx.firmId,
    customer_id: customerId,
    property_id: propertyId,
    contract_number: contractNumber,
    period_type: periodType,
    start_date: startDate,
    expiry_date: expiryDate,
    monthly_fee: monthlyFee,
    total_amount: totalAmount,
    status,
    notes,
  }

  if (contractId) {
    const { error } = await ctx.admin.from("contracts").update(payload).eq("id", contractId).eq("firm_id", ctx.firmId)
    if (error) return { ok: false, error: error.message }
    await syncContractEquipments(ctx.admin, contractId, equipmentIds)
    await writeAudit({
      actorUserId: ctx.userId,
      actorRole: "firm_owner",
      action: "contract.update",
      entityType: "contracts",
      entityId: contractId,
    })
    revalidatePath("/dashboard/contracte")
    return { ok: true, id: contractId }
  }

  payload.created_by = ctx.userId
  const { data, error } = await ctx.admin.from("contracts").insert(payload).select("id").single()
  if (error || !data) return { ok: false, error: error?.message ?? "Eroare la creare contract." }
  await syncContractEquipments(ctx.admin, data.id as string, equipmentIds)
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "contract.create",
    entityType: "contracts",
    entityId: data.id as string,
    summary: contractNumber ?? undefined,
  })
  revalidatePath("/dashboard/contracte")
  return { ok: true, id: data.id as string }
}

export async function changeContractStatus(
  contractId: string,
  newStatus: "activ" | "expirat" | "reziliat" | "suspendat",
  reason: string | null,
): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const patch: Record<string, unknown> = { status: newStatus }
  if (newStatus === "reziliat") {
    patch.cancelled_at = new Date().toISOString()
    patch.cancellation_reason = reason
  }
  const { error } = await ctx.admin
    .from("contracts")
    .update(patch)
    .eq("id", contractId)
    .eq("firm_id", ctx.firmId)
  if (error) return { ok: false, error: error.message }
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: `contract.status_${newStatus}`,
    entityType: "contracts",
    entityId: contractId,
  })
  revalidatePath("/dashboard/contracte")
  return { ok: true }
}

type CreateCustomerResult = { ok: true; customerId: string; propertyId: string } | { ok: false; error: string }

export async function createCustomerAndProperty(formData: FormData): Promise<CreateCustomerResult> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx

  const customerType = String(formData.get("customer_type") ?? "individual").trim()
  if (!["individual", "association", "business"].includes(customerType)) {
    return { ok: false, error: "Tip client invalid." }
  }

  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim() || null
  const firstName = String(formData.get("first_name") ?? "").trim() || null
  const lastName = String(formData.get("last_name") ?? "").trim() || null
  const companyName = String(formData.get("company_name") ?? "").trim() || null
  const cnp = String(formData.get("cnp") ?? "").trim() || null
  const cui = String(formData.get("cui") ?? "").trim() || null

  if (!phone) return { ok: false, error: "Telefonul e obligatoriu." }
  if (customerType === "individual" && (!firstName || !lastName)) {
    return { ok: false, error: "Numele și prenumele sunt obligatorii pentru persoană fizică." }
  }
  if (customerType !== "individual" && !companyName) {
    return { ok: false, error: "Denumirea firmei/asociației e obligatorie." }
  }
  if (cnp && !/^\d{13}$/.test(cnp)) return { ok: false, error: "CNP invalid (13 cifre)." }

  const fullName = customerType === "individual"
    ? [firstName, lastName].filter(Boolean).join(" ")
    : (companyName ?? "")

  const propertyType = String(formData.get("property_type") ?? "apartment").trim()
  const address = String(formData.get("address") ?? "").trim()
  const judetIdRaw = String(formData.get("judet_id") ?? "").trim()
  const localitateText = String(formData.get("localitate_text") ?? "").trim() || null
  const blockName = String(formData.get("block_name") ?? "").trim() || null
  const apartment = String(formData.get("apartment") ?? "").trim() || null

  if (!address) return { ok: false, error: "Adresa e obligatorie." }

  // Caută client existent după telefon
  const { data: existing } = await ctx.admin
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle()

  let customerId: string
  if (existing) {
    customerId = existing.id as string
  } else {
    const { data: newCust, error: custErr } = await ctx.admin
      .from("customers")
      .insert({
        phone,
        email,
        customer_type: customerType,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        cnp,
        cui,
      })
      .select("id")
      .single()
    if (custErr || !newCust) return { ok: false, error: custErr?.message ?? "Eroare la creare client." }
    customerId = newCust.id as string
  }

  // Încearcă să găsești property existent la aceeași adresă pentru acest client
  const { data: existingProp } = await ctx.admin
    .from("properties")
    .select("id")
    .eq("customer_id", customerId)
    .eq("address", address)
    .maybeSingle()

  let propertyId: string
  if (existingProp) {
    propertyId = existingProp.id as string
  } else {
    // Încearcă rezolvare localitate după text + judet (exact match, insensitive)
    let localitateId: number | null = null
    const judetId = judetIdRaw ? Number(judetIdRaw) : null
    if (localitateText && judetId) {
      const { data: loc } = await ctx.admin
        .from("localitati")
        .select("id")
        .eq("judet_id", judetId)
        .ilike("nume", localitateText)
        .maybeSingle()
      if (loc) localitateId = loc.id as number
    }

    const { data: newProp, error: propErr } = await ctx.admin
      .from("properties")
      .insert({
        customer_id: customerId,
        property_type: propertyType,
        address,
        judet_id: judetId,
        localitate_id: localitateId,
        block_name: blockName,
        apartment,
      })
      .select("id")
      .single()
    if (propErr || !newProp) return { ok: false, error: propErr?.message ?? "Eroare la creare adresă." }
    propertyId = newProp.id as string
  }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: existing ? "customer.link_via_contract" : "customer.create_via_contract",
    entityType: "customers",
    entityId: customerId,
    summary: fullName,
  })

  revalidatePath("/dashboard/contracte")
  return { ok: true, customerId, propertyId }
}

export async function deleteContract(contractId: string): Promise<Result> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  const { error } = await ctx.admin
    .from("contracts")
    .delete()
    .eq("id", contractId)
    .eq("firm_id", ctx.firmId)
  if (error) return { ok: false, error: error.message }
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "contract.delete",
    entityType: "contracts",
    entityId: contractId,
  })
  revalidatePath("/dashboard/contracte")
  return { ok: true }
}
