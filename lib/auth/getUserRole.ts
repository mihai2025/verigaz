// lib/auth/getUserRole.ts
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type UserRole = {
  role: "admin" | "firm_owner" | "user"
  isAdmin: boolean
  firmId: string | null
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const admin = getServiceRoleSupabase()

  // 1) Check profiles.role
  const { data: prof } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle()

  const role = (typeof (prof as Record<string, unknown>)?.role === "string"
    ? ((prof as Record<string, unknown>).role as string).trim().toLowerCase()
    : "")

  if (role === "admin" || role === "administrator") {
    return { role: "admin", isAdmin: true, firmId: null }
  }

  // 2) Check if user owns a firm
  const { data: firm } = await admin
    .from("funeral_firms")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle()

  if (firm) {
    return { role: "firm_owner", isAdmin: false, firmId: (firm as Record<string, unknown>).id as string }
  }

  // 3) Regular user
  return { role: "user", isAdmin: false, firmId: null }
}
