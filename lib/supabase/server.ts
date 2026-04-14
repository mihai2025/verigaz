// lib/supabase/server.ts
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js"

function mustEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const SUPABASE_URL = mustEnv("NEXT_PUBLIC_SUPABASE_URL")
const SUPABASE_ANON = mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

/**
 * Auth-aware server client (RSC / Server Actions / Route Handlers)
 * Uses cookies store.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // In Server Components you can't set cookies; ignore.
        }
      },
    },
  })
}

/**
 * Public server supabase (no auth cookies needed).
 * Useful for public API routes that only read public data.
 */
export function getPublicServerSupabase(): SupabaseClient {
  return createSupabaseJsClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Service role server supabase (ADMIN).
 * IMPORTANT: only use on server, never in client bundles.
 */
export function getServiceRoleSupabase(): SupabaseClient {
  const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY")
  return createSupabaseJsClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
