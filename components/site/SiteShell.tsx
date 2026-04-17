"use client"

import { usePathname } from "next/navigation"
import { Header } from "./Header"
import { Footer } from "./Footer"

type AuthUser = {
  firstName: string | null
  email: string | null
} | null

export function SiteShell({
  children,
  headerUser,
}: {
  children: React.ReactNode
  headerUser: AuthUser
}) {
  const pathname = usePathname() ?? ""
  const isDashboard = pathname.startsWith("/dashboard")
  if (isDashboard) {
    // Dashboard-ul are propriul layout (DashboardHeader) — nu mai renderezi
    // site header/footer + vg-main wrapper. Main-ul vine din dashboard/layout.tsx.
    return <>{children}</>
  }
  return (
    <>
      <Header user={headerUser} />
      <main className="vg-main">{children}</main>
      <Footer />
    </>
  )
}
