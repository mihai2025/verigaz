"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { slugifyRO } from "@/lib/utils/slugify"

type Result = { ok: true } | { ok: false; error: string }

async function requireSeller() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role === "user") return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, role, firmId, admin: getServiceRoleSupabase() }
}

export async function createProduct(formData: FormData): Promise<Result> {
  const ctx = await requireSeller()
  if (!ctx.ok) return ctx

  const nume = String(formData.get("nume") ?? "").trim()
  if (!nume) return { ok: false, error: "Numele e obligatoriu." }
  const priceRaw = Number(formData.get("price"))
  if (!priceRaw || priceRaw <= 0) return { ok: false, error: "Prețul e invalid." }

  const baseSlug = slugifyRO(nume).slice(0, 80) || "produs"
  let slug = baseSlug
  for (let i = 2; i < 100; i++) {
    const { data: hit } = await ctx.admin.from("shop_products").select("id").eq("slug", slug).maybeSingle()
    if (!hit) break
    slug = `${baseSlug}-${i}`
  }

  const categoryIdRaw = String(formData.get("category_id") ?? "")
  const stockRaw = String(formData.get("stock") ?? "0")
  const manageStock = formData.get("manage_stock") === "on"

  const { data: inserted, error } = await ctx.admin
    .from("shop_products")
    .insert({
      slug,
      nume,
      descriere: String(formData.get("descriere") ?? "").trim() || null,
      descriere_scurta: String(formData.get("descriere_scurta") ?? "").trim() || null,
      category_id: categoryIdRaw ? Number(categoryIdRaw) : null,
      brand: String(formData.get("brand") ?? "").trim() || null,
      model: String(formData.get("model") ?? "").trim() || null,
      sku: String(formData.get("sku") ?? "").trim() || null,
      price: priceRaw,
      price_old: Number(formData.get("price_old") ?? 0) || null,
      stock: Number(stockRaw) || 0,
      manage_stock: manageStock,
      image_url: String(formData.get("image_url") ?? "").trim() || null,
      seller_firm_id: ctx.role === "firm_owner" ? ctx.firmId : null,
      is_active: true,
    })
    .select("id")
    .single()
  if (error || !inserted) return { ok: false, error: error?.message ?? "Eroare." }

  redirect(`/dashboard/magazin-produse/${inserted.id}`)
}

export async function updateProduct(productId: string, formData: FormData): Promise<Result> {
  const ctx = await requireSeller()
  if (!ctx.ok) return ctx

  // Firm_owner poate edita doar produsele sale
  if (ctx.role === "firm_owner") {
    const { data: owned } = await ctx.admin
      .from("shop_products")
      .select("seller_firm_id")
      .eq("id", productId)
      .maybeSingle()
    if (!owned || owned.seller_firm_id !== ctx.firmId) {
      return { ok: false, error: "Acces refuzat." }
    }
  }

  const patch: Record<string, unknown> = {
    nume: String(formData.get("nume") ?? "").trim(),
    descriere: String(formData.get("descriere") ?? "").trim() || null,
    descriere_scurta: String(formData.get("descriere_scurta") ?? "").trim() || null,
    brand: String(formData.get("brand") ?? "").trim() || null,
    model: String(formData.get("model") ?? "").trim() || null,
    sku: String(formData.get("sku") ?? "").trim() || null,
    price: Number(formData.get("price")),
    price_old: Number(formData.get("price_old") ?? 0) || null,
    stock: Number(formData.get("stock") ?? 0) || 0,
    manage_stock: formData.get("manage_stock") === "on",
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
    category_id: String(formData.get("category_id") ?? "") ? Number(formData.get("category_id")) : null,
  }
  const { error } = await ctx.admin.from("shop_products").update(patch).eq("id", productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/magazin-produse")
  revalidatePath(`/dashboard/magazin-produse/${productId}`)
  return { ok: true }
}

export async function toggleProductActive(productId: string, isActive: boolean): Promise<Result> {
  const ctx = await requireSeller()
  if (!ctx.ok) return ctx

  if (ctx.role === "firm_owner") {
    const { data: owned } = await ctx.admin
      .from("shop_products")
      .select("seller_firm_id")
      .eq("id", productId)
      .maybeSingle()
    if (!owned || owned.seller_firm_id !== ctx.firmId) return { ok: false, error: "Acces refuzat." }
  }

  const { error } = await ctx.admin.from("shop_products").update({ is_active: isActive }).eq("id", productId)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard/magazin-produse")
  return { ok: true }
}
