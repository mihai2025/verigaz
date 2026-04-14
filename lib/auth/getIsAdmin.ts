//lib\auth\getIsAdmin.ts
import type { SupabaseClient } from "@supabase/supabase-js"

export async function getIsAdmin(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return false
  const role = String((data as any).role ?? "").trim().toLowerCase()
  return role === "admin" || role === "administrator"
}
