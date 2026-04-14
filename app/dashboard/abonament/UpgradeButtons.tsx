"use client"

import { useState, useTransition } from "react"
import { PLANS, PLAN_ORDER, type PlanKey, canUpgradeTo, planRank } from "@/lib/plans/plans"
import { createSubscriptionCheckout } from "./actions"

export default function UpgradeButtons({ currentPlan }: { currentPlan: PlanKey }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function subscribe(target: PlanKey) {
    setError(null)
    startTransition(async () => {
      const res = await createSubscriptionCheckout(target)
      if (!res.ok) setError(res.error)
      else window.location.href = res.url
    })
  }

  return (
    <div className="pricing-grid pricing-grid--compact">
      {error && <div className="auth-error" role="alert">{error}</div>}
      {PLAN_ORDER.filter((k) => k !== "free").map((key) => {
        const p = PLANS[key]
        const isCurrent = key === currentPlan
        const isUpgrade = canUpgradeTo(currentPlan, key)
        const isDowngrade = planRank(key) < planRank(currentPlan)
        return (
          <div key={key} className={`pricing-card pricing-card--${key}${isCurrent ? " pricing-card--current" : ""}`}>
            <h3>{p.nume}</h3>
            <p className="dash-subtle">{p.tagline}</p>
            <div className="pricing-card__price">
              <strong>{p.priceYearly} lei</strong>
              <span className="pricing-card__period"> / an</span>
            </div>
            {isCurrent ? (
              <span className="dash-status dash-status--active">Plan curent</span>
            ) : isUpgrade ? (
              <button
                type="button"
                disabled={pending}
                className="shop-btn shop-btn--primary"
                onClick={() => subscribe(key)}
              >
                {pending ? "Se inițiază…" : `Upgrade la ${p.nume} →`}
              </button>
            ) : isDowngrade ? (
              <p className="dash-subtle">
                Downgrade: anulează planul curent, apoi alege {p.nume}.
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
