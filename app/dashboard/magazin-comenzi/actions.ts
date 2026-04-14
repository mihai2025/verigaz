"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true } | { ok: false; error: string }

async function requireAdminOrOwner() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role === "user") return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, role, firmId, admin: getServiceRoleSupabase() }
}

export async function updateOrderFulfillment(
  orderId: string,
  fulfillmentStatus: string,
  opts: { trackingUrl?: string; trackingNumber?: string; internalNote?: string } = {},
): Promise<Result> {
  const ctx = await requireAdminOrOwner()
  if (!ctx.ok) return ctx

  // Firm_owner poate modifica doar comenzile propriilor produse
  if (ctx.role === "firm_owner") {
    const { data: o } = await ctx.admin
      .from("shop_orders")
      .select("seller_firm_id")
      .eq("id", orderId)
      .maybeSingle()
    if (!o || o.seller_firm_id !== ctx.firmId) {
      return { ok: false, error: "Acces refuzat." }
    }
  }

  const patch: Record<string, unknown> = { fulfillment_status: fulfillmentStatus }
  if (opts.trackingUrl)    patch.tracking_url = opts.trackingUrl
  if (opts.trackingNumber) patch.tracking_number = opts.trackingNumber
  if (opts.internalNote !== undefined) patch.internal_notes = opts.internalNote
  if (fulfillmentStatus === "shipped") patch.shipped_at = new Date().toISOString()
  if (fulfillmentStatus === "delivered") patch.delivered_at = new Date().toISOString()

  const { error } = await ctx.admin.from("shop_orders").update(patch).eq("id", orderId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: `order.${fulfillmentStatus}`,
    entityType: "shop_orders",
    entityId: orderId,
    metadata: patch,
  })

  revalidatePath("/dashboard/magazin-comenzi")
  revalidatePath(`/dashboard/magazin-comenzi/${orderId}`)
  return { ok: true }
}
