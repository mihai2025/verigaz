"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { writeAudit } from "@/lib/audit/log"

type Result = { ok: true } | { ok: false; error: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false as const, error: "Acces refuzat." }
  return { ok: true as const, userId: data.user.id, admin: getServiceRoleSupabase() }
}

export async function moderateReview(
  reviewId: string,
  decision: "approved" | "rejected" | "flagged",
): Promise<Result> {
  const ctx = await requireAdmin()
  if (!ctx.ok) return ctx

  const { error } = await ctx.admin
    .from("reviews")
    .update({
      moderation_status: decision,
      moderated_by: ctx.userId,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorUserId: ctx.userId,
    actorRole: "admin",
    action: `review.${decision}`,
    entityType: "reviews",
    entityId: reviewId,
  })

  revalidatePath("/dashboard/reviews-admin")
  return { ok: true }
}
