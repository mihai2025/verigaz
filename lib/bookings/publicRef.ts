// lib/bookings/publicRef.ts
// Generează referința publică a programării în format "VG-YYYY-NNNNNN".
// Folosește un count pe an ca să evite coliziuni (retry-uri rezolvă race conditions).
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export async function generatePublicRef(): Promise<string> {
  const admin = getServiceRoleSupabase()
  const year = new Date().getFullYear()
  const prefix = `VG-${year}-`

  // Găsește ultimul număr folosit în anul curent
  const { data } = await admin
    .from("bookings")
    .select("public_ref")
    .ilike("public_ref", `${prefix}%`)
    .order("public_ref", { ascending: false })
    .limit(1)

  let next = 1
  if (data && data.length > 0) {
    const last = data[0].public_ref as string
    const tail = Number(last.slice(prefix.length))
    if (!Number.isNaN(tail)) next = tail + 1
  }
  return `${prefix}${String(next).padStart(6, "0")}`
}
