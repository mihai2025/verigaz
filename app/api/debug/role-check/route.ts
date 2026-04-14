// app/api/debug/role-check/route.ts
// TEMP debug — verifică dacă SUPABASE_SERVICE_ROLE_KEY funcționează corect.
// Șterge după diagnosticare.
import { NextResponse } from "next/server"
import { createClient as createSupabaseJs } from "@supabase/supabase-js"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING"
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  // JWT anatomy: 3 segments; payload in segment[1] is base64-url-encoded JSON.
  function keyRole(k: string): string {
    try {
      const parts = k.split(".")
      if (parts.length !== 3) return "invalid"
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"))
      return `role=${payload.role} · ref=${payload.ref ?? "?"}`
    } catch {
      return "parse-err"
    }
  }

  const serviceClient = createSupabaseJs(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const anonClient = createSupabaseJs(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: viaService, error: svcErr } = await serviceClient
    .from("profiles")
    .select("user_id, email, role")
    .eq("email", "mihaiparjolea@yahoo.com")
    .maybeSingle()

  const { data: viaAnon, error: anonErr } = await anonClient
    .from("profiles")
    .select("user_id, email, role")
    .eq("email", "mihaiparjolea@yahoo.com")
    .maybeSingle()

  return NextResponse.json({
    env: {
      supabaseUrl: url,
      serviceKey: keyRole(serviceKey),
      anonKey: keyRole(anonKey),
      serviceKeyTail: serviceKey.slice(-10),
      anonKeyTail: anonKey.slice(-10),
    },
    viaServiceRole: { data: viaService, error: svcErr?.message ?? null },
    viaAnon: { data: viaAnon, error: anonErr?.message ?? null },
  })
}
