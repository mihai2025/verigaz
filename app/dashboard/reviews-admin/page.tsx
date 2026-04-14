// app/dashboard/reviews-admin/page.tsx
// Admin — moderare review-uri verigaz (aprobă/respinge/flagged).
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import ReviewsAdminClient from "./ReviewsAdminClient"

type Props = { searchParams: Promise<{ status?: string }> }
const STATUS_TABS = ["pending", "approved", "rejected", "flagged"] as const

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) redirect("/login?redirect=/dashboard/reviews-admin")
  const { role } = await getUserRole(u.user.id)
  if (role !== "admin") redirect("/dashboard")

  const sp = await searchParams
  const status = (STATUS_TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "pending"

  const admin = getServiceRoleSupabase()
  const { data } = await admin
    .from("reviews")
    .select(
      "id, rating_overall, rating_punctuality, rating_clarity, rating_professionalism, " +
      "body, moderation_status, firm_reply, created_at, " +
      "gas_firms(slug, brand_name, legal_name), " +
      "customers(full_name), " +
      "bookings(public_ref)",
    )
    .eq("moderation_status", status)
    .order("created_at", { ascending: false })
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Review-uri — moderare</h1>
      <nav className="dash-tabs">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/reviews-admin?status=${s}`}
            className={`dash-tab ${status === s ? "dash-tab--active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="dash-note">Nicio recenzie cu status „{status}".</p>
      ) : (
        <ReviewsAdminClient reviews={rows} />
      )}
    </div>
  )
}
