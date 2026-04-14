// app/dashboard/layout.tsx
// Role-gated shell. Middleware-ul redirectează deja vizitatorii anonimi la
// /login?redirect=/dashboard, dar facem double-check aici pentru cazurile în
// care middleware-ul e bypass-uit (ex: generator SSG accidental).
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

async function getAdminBadgeCounts() {
  try {
    const admin = getServiceRoleSupabase()
    const [firmsPending, shopPending] = await Promise.all([
      admin
        .from("gas_firms")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      admin
        .from("shop_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ])
    return {
      pendingClaims: firmsPending.count ?? 0,
      pendingOrders: shopPending.count ?? 0,
    }
  } catch {
    return { pendingClaims: 0, pendingOrders: 0 }
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard")

  const isOAuth = data.user.app_metadata?.provider !== "email"
  const isVerified = isOAuth || !!data.user.email_confirmed_at

  const userRole = await getUserRole(data.user.id)
  const badges =
    userRole.role === "admin"
      ? await getAdminBadgeCounts()
      : { pendingClaims: 0, pendingOrders: 0 }

  return (
    <div className="dash-layout">
      <DashboardNav
        role={userRole.role}
        firmId={userRole.firmId}
        pendingClaims={badges.pendingClaims}
        pendingOrders={badges.pendingOrders}
      />
      {!isVerified && <EmailVerificationBanner email={data.user.email ?? ""} />}
      <main className="dash-main">{children}</main>
    </div>
  )
}
