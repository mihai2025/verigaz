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

const STATUSES = ["activ", "reziliat", "suspendat"] as const

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
  const startDate = String(formData.get("start_date") ?? "").trim()
  const expiryDateRaw = String(formData.get("expiry_date") ?? "").trim()
  const expiryDate = expiryDateRaw || null
  const monthlyFeeRaw = String(formData.get("monthly_fee") ?? "").trim()
  const totalAmountRaw = String(formData.get("total_amount") ?? "").trim()
  const status = String(formData.get("status") ?? "activ").trim()
  const notes = String(formData.get("notes") ?? "").trim() || null

  if (!customerId) return { ok: false, error: "Clientul e obligatoriu." }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return { ok: false, error: "Status invalid." }
  }
  if (!startDate) return { ok: false, error: "Data de început e obligatorie." }
  if (expiryDate && new Date(expiryDate) <= new Date(startDate)) {
    return { ok: false, error: "Data de expirare (opțională) trebuie să fie după data de început." }
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
  newStatus: "activ" | "reziliat" | "suspendat",
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

type CreateCustomerResult = { ok: true; customerId: string } | { ok: false; error: string }
type AddPropertyResult = { ok: true; propertyId: string } | { ok: false; error: string }

export async function createCustomer(formData: FormData): Promise<CreateCustomerResult> {
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

  // Dedup după telefon
  const { data: existing } = await ctx.admin
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle()

  if (existing) {
    await linkFirmCustomer(ctx.admin, ctx.firmId, existing.id as string, ctx.userId)
    await writeAudit({
      actorUserId: ctx.userId,
      actorRole: "firm_owner",
      action: "customer.link_existing",
      entityType: "customers",
      entityId: existing.id as string,
      summary: fullName,
    })
    revalidatePath("/dashboard/contracte")
    revalidatePath("/dashboard/clienti")
    return { ok: true, customerId: existing.id as string }
  }

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

  await linkFirmCustomer(ctx.admin, ctx.firmId, newCust.id as string, ctx.userId)
  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "customer.create",
    entityType: "customers",
    entityId: newCust.id as string,
    summary: fullName,
  })

  revalidatePath("/dashboard/contracte")
  revalidatePath("/dashboard/clienti")
  return { ok: true, customerId: newCust.id as string }
}

async function linkFirmCustomer(
  admin: ReturnType<typeof getServiceRoleSupabase>,
  firmId: string,
  customerId: string,
  userId: string,
) {
  await admin
    .from("firm_customer_links")
    .upsert({ firm_id: firmId, customer_id: customerId, added_by: userId }, { onConflict: "firm_id,customer_id" })
}

export async function addPropertyForCustomer(customerId: string, formData: FormData): Promise<AddPropertyResult> {
  const ctx = await requireFirm()
  if (!ctx.ok) return ctx
  if (!customerId) return { ok: false, error: "Clientul e obligatoriu." }

  // Verifică că clientul există
  const { data: cust } = await ctx.admin.from("customers").select("id").eq("id", customerId).maybeSingle()
  if (!cust) return { ok: false, error: "Clientul nu există." }

  // Asigură linkul firm↔customer (dacă firma adaugă adresă, îl consideră clientul ei)
  await linkFirmCustomer(ctx.admin, ctx.firmId, customerId, ctx.userId)

  const propertyType = String(formData.get("property_type") ?? "apartment").trim()
  const address = String(formData.get("address") ?? "").trim()
  const judetIdRaw = String(formData.get("judet_id") ?? "").trim()
  const localitateIdRaw = String(formData.get("localitate_id") ?? "").trim()
  const blockName = String(formData.get("block_name") ?? "").trim() || null
  const stair = String(formData.get("stair") ?? "").trim() || null
  const apartment = String(formData.get("apartment") ?? "").trim() || null
  const floor = String(formData.get("floor") ?? "").trim() || null

  if (!address) return { ok: false, error: "Adresa e obligatorie." }

  const judetId = judetIdRaw ? Number(judetIdRaw) : null
  const localitateId = localitateIdRaw ? Number(localitateIdRaw) : null

  // Dedup: aceeași (customer_id, address) nu se dublează
  const { data: existingProp } = await ctx.admin
    .from("properties")
    .select("id")
    .eq("customer_id", customerId)
    .eq("address", address)
    .maybeSingle()
  if (existingProp) {
    return { ok: true, propertyId: existingProp.id as string }
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
      stair,
      apartment,
      floor,
    })
    .select("id")
    .single()
  if (propErr || !newProp) return { ok: false, error: propErr?.message ?? "Eroare la creare adresă." }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "firm_owner",
    action: "property.create",
    entityType: "properties",
    entityId: newProp.id as string,
    summary: address,
  })

  revalidatePath("/dashboard/contracte")
  revalidatePath("/dashboard/clienti")
  return { ok: true, propertyId: newProp.id as string }
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
