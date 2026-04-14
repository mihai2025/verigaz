// app/dashboard/abonament/page.tsx
// Dashboard firmă: vezi abonamentul curent + istoric + upgrade button.
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { PLAN_ORDER, PLANS, type PlanKey, canUpgradeTo } from "@/lib/plans/plans"
import UpgradeButtons from "./UpgradeButtons"

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/abonament")

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Abonament</h1>
        <p className="dash-note">
          Doar firmele înregistrate au abonament. {" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const admin = getServiceRoleSupabase()
  const [firmRes, subsRes] = await Promise.all([
    admin.from("gas_firms").select("id, brand_name, legal_name, plan, plan_valid_until").eq("id", firmId).maybeSingle(),
    admin
      .from("firm_subscriptions")
      .select("id, plan, amount, currency, status, expires_at, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at")
      .eq("firm_id", firmId)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const firm = firmRes.data
  if (!firm) redirect("/dashboard")

  const subs = (subsRes.data ?? []) as Array<{
    id: string; plan: string; amount: number; currency: string; status: string
    expires_at: string | null; current_period_start: string | null
    current_period_end: string | null; canceled_at: string | null
    cancel_at_period_end: boolean; created_at: string
  }>

  const activeSub = subs.find((s) => s.status === "active" || s.status === "trialing") ?? null
  const currentPlan = (firm.plan as PlanKey) ?? "free"
  const currentDef = PLANS[currentPlan]

  return (
    <div className="dash-page">
      <h1 className="dash-title">Abonament</h1>

      <section className="dash-card">
        <h2>Planul curent: <strong>{currentDef.nume}</strong></h2>
        <p className="dash-subtle">{currentDef.tagline}</p>
        {activeSub ? (
          <dl className="dash-dl">
            <dt>Status</dt><dd>{activeSub.status}</dd>
            <dt>Preț</dt><dd>{activeSub.amount} {activeSub.currency} / an</dd>
            <dt>Perioadă curentă</dt>
            <dd>
              {activeSub.current_period_start
                ? new Date(activeSub.current_period_start).toLocaleDateString("ro-RO")
                : "—"}
              {" → "}
              {activeSub.current_period_end
                ? new Date(activeSub.current_period_end).toLocaleDateString("ro-RO")
                : "—"}
            </dd>
            {activeSub.cancel_at_period_end && (
              <>
                <dt>Anulare programată</dt>
                <dd>Abonamentul se oprește la sfârșitul perioadei curente.</dd>
              </>
            )}
          </dl>
        ) : currentPlan === "free" ? (
          <p>Firma e pe planul gratuit. Upgrade pentru vizibilitate prioritară + magazin + exclusivitate.</p>
        ) : (
          <p className="dash-note">Nu e niciun abonament activ asociat — contactează suportul.</p>
        )}
      </section>

      <section className="dash-card">
        <h2>Upgrade / downgrade</h2>
        <UpgradeButtons currentPlan={currentPlan} />
      </section>

      {subs.length > 1 && (
        <section className="dash-card">
          <h2>Istoric abonamente</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Creat</th>
                <th>Plan</th>
                <th>Preț</th>
                <th>Status</th>
                <th>Expiră</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.created_at).toLocaleDateString("ro-RO")}</td>
                  <td>{PLANS[s.plan as PlanKey]?.nume ?? s.plan}</td>
                  <td>{s.amount} {s.currency}</td>
                  <td><span className={`dash-status dash-status--${s.status}`}>{s.status}</span></td>
                  <td>{s.expires_at ? new Date(s.expires_at).toLocaleDateString("ro-RO") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="dash-note">
        Vezi detaliile planurilor pe <Link href="/abonamente">pagina de prețuri</Link>.
      </p>
    </div>
  )
}

// Suppress unused — keep import for future logic
void canUpgradeTo
void PLAN_ORDER
