"use client"

import { useState, useTransition } from "react"
import { assignLead, updateLeadStatus } from "./actions"

type Lead = {
  id: string
  full_name: string
  phone: string
  email: string | null
  message: string | null
  status: string
  source: string | null
  utm_source: string | null
  preferred_firm_id: string | null
  assigned_firm_id: string | null
  created_at: string
  assigned_at: string | null
  judete: { nume: string } | { nume: string }[] | null
  localitati: { nume: string } | { nume: string }[] | null
  service_categories: { slug: string; nume: string } | { slug: string; nume: string }[] | null
  preferred_firm:
    | { slug: string; brand_name: string | null; legal_name: string }
    | Array<{ slug: string; brand_name: string | null; legal_name: string }>
    | null
  assigned_firm:
    | { slug: string; brand_name: string | null; legal_name: string }
    | Array<{ slug: string; brand_name: string | null; legal_name: string }>
    | null
}

type Firm = { id: string; brand_name: string | null; legal_name: string }

const STATUS_NEXT = ["assigned", "contacted", "converted", "lost", "spam"] as const

function take<T>(v: T | T[] | null): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export default function LeadsAdminClient({ leads, firms }: { leads: Lead[]; firms: Firm[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [assignSel, setAssignSel] = useState<Record<string, string>>({})

  function run(promise: Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null)
      const res = await promise
      if (!res.ok) setError(res.error ?? "Eroare.")
    })
  }

  return (
    <>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <table className="dash-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Serviciu</th>
            <th>Zonă</th>
            <th>Firmă preferată</th>
            <th>Atribuire</th>
            <th>Sursă</th>
            <th>Creat</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const j = take(l.judete); const loc = take(l.localitati)
            const sc = take(l.service_categories)
            const pref = take(l.preferred_firm); const assigned = take(l.assigned_firm)
            return (
              <tr key={l.id}>
                <td>
                  <div>{l.full_name}</div>
                  <div className="dash-subtle">
                    <a href={`tel:${l.phone}`}>{l.phone}</a>
                    {l.email && <> · {l.email}</>}
                  </div>
                  {l.message && <div className="dash-subtle">„{l.message}"</div>}
                </td>
                <td>{sc?.nume ?? "—"}</td>
                <td>{[loc?.nume, j?.nume].filter(Boolean).join(", ") || "—"}</td>
                <td>{pref ? (pref.brand_name || pref.legal_name) : "—"}</td>
                <td>
                  {assigned ? (
                    <div>
                      <strong>{assigned.brand_name || assigned.legal_name}</strong>
                      <button
                        type="button"
                        disabled={pending}
                        className="dash-btn dash-btn--ghost"
                        onClick={() => run(assignLead(l.id, null))}
                      >
                        Dezasignează
                      </button>
                    </div>
                  ) : (
                    <div className="dash-actions-row">
                      <select
                        value={assignSel[l.id] ?? ""}
                        onChange={(e) => setAssignSel({ ...assignSel, [l.id]: e.target.value })}
                      >
                        <option value="">— alege firmă —</option>
                        {firms.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.brand_name || f.legal_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={pending || !assignSel[l.id]}
                        className="dash-btn dash-btn--primary"
                        onClick={() => run(assignLead(l.id, assignSel[l.id]))}
                      >
                        Atribuie
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  {l.source ?? "—"}
                  {l.utm_source && <div className="dash-subtle">utm: {l.utm_source}</div>}
                </td>
                <td>{new Date(l.created_at).toLocaleDateString("ro-RO")}</td>
                <td>
                  <select
                    value={l.status}
                    disabled={pending}
                    onChange={(e) => run(updateLeadStatus(l.id, e.target.value))}
                  >
                    {STATUS_NEXT.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="new">new</option>
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
