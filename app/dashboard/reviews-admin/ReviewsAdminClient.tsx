"use client"

import { useState, useTransition } from "react"
import { moderateReview } from "./actions"

type Review = {
  id: string
  rating_overall: number
  rating_punctuality: number | null
  rating_clarity: number | null
  rating_professionalism: number | null
  body: string | null
  moderation_status: string
  firm_reply: string | null
  created_at: string
  gas_firms: { slug: string; brand_name: string | null; legal_name: string } | { slug: string; brand_name: string | null; legal_name: string }[] | null
  customers: { full_name: string } | { full_name: string }[] | null
  bookings: { public_ref: string } | { public_ref: string }[] | null
}

function take<T>(v: T | T[] | null): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function Stars({ n }: { n: number | null }) {
  if (!n) return <span>—</span>
  return <span title={`${n}/5`}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>
}

export default function ReviewsAdminClient({ reviews }: { reviews: Review[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
      <ul className="dash-reviews">
        {reviews.map((r) => {
          const f = take(r.gas_firms); const c = take(r.customers); const b = take(r.bookings)
          return (
            <li key={r.id} className="dash-review">
              <header>
                <div>
                  <strong>{c?.full_name ?? "—"}</strong>
                  {" → "}
                  <strong>{f ? (f.brand_name || f.legal_name) : "—"}</strong>
                </div>
                <div className="dash-subtle">
                  {b?.public_ref && <code>{b.public_ref}</code>}
                  {" · "}
                  {new Date(r.created_at).toLocaleDateString("ro-RO")}
                </div>
              </header>
              <div className="dash-review__ratings">
                <span>overall <Stars n={r.rating_overall} /></span>
                <span>punctualitate <Stars n={r.rating_punctuality} /></span>
                <span>claritate <Stars n={r.rating_clarity} /></span>
                <span>profesionalism <Stars n={r.rating_professionalism} /></span>
              </div>
              {r.body && <p className="dash-review__body">„{r.body}"</p>}
              {r.firm_reply && (
                <p className="dash-review__reply">
                  <strong>Răspuns firmă:</strong> {r.firm_reply}
                </p>
              )}
              <div className="dash-actions-row">
                <button
                  type="button"
                  disabled={pending}
                  className="dash-btn dash-btn--primary"
                  onClick={() => run(moderateReview(r.id, "approved"))}
                >
                  Aprobă
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="dash-btn dash-btn--ghost"
                  onClick={() => run(moderateReview(r.id, "rejected"))}
                >
                  Respinge
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="dash-btn dash-btn--ghost"
                  onClick={() => run(moderateReview(r.id, "flagged"))}
                >
                  Flag
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
