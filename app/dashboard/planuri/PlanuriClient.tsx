"use client"

import { useState, useTransition } from "react"
import { saveSettings } from "./actions"
import type { PlanPrices } from "@/lib/settings/appSettings"

type PlanMeta = { nume: string; tagline: string }

type Props = {
  initialPrices: PlanPrices
  initialTariffCents: number
  plans: { free: PlanMeta; start: PlanMeta; plus: PlanMeta; premium: PlanMeta }
}

export default function PlanuriClient({ initialPrices, initialTariffCents, plans }: Props) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveSettings(fd)
      if (res.ok) setMsg({ kind: "ok", text: "Setările au fost salvate." })
      else setMsg({ kind: "err", text: res.error })
    })
  }

  const tariffRon = (initialTariffCents / 100).toFixed(2)

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {msg && (
        <div
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: msg.kind === "ok" ? "#e6f4ea" : "#fde8e8",
            color: msg.kind === "ok" ? "#1e6b34" : "#a01818",
            border: `1px solid ${msg.kind === "ok" ? "#b7dfc3" : "#f0b4b4"}`,
            fontSize: 14,
          }}
        >
          {msg.text}
        </div>
      )}

      <fieldset className="dash-fieldset">
        <legend>Prețuri planuri (lei/an)</legend>
        <div className="dash-help" style={{ fontSize: 13, color: "var(--text-600)", marginBottom: 12 }}>
          Planul <strong>{plans.free.nume}</strong> e gratuit și nu poate fi editat.
        </div>

        <label className="dash-field">
          <span>
            {plans.start.nume} <em>({plans.start.tagline})</em>
          </span>
          <input
            name="price_start"
            type="number"
            min={0}
            step={1}
            defaultValue={initialPrices.start}
            required
          />
        </label>

        <label className="dash-field">
          <span>
            {plans.plus.nume} <em>({plans.plus.tagline})</em>
          </span>
          <input
            name="price_plus"
            type="number"
            min={0}
            step={1}
            defaultValue={initialPrices.plus}
            required
          />
        </label>

        <label className="dash-field">
          <span>
            {plans.premium.nume} <em>({plans.premium.tagline})</em>
          </span>
          <input
            name="price_premium"
            type="number"
            min={0}
            step={1}
            defaultValue={initialPrices.premium}
            required
          />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Tarif SMS (bani/segment)</legend>
        <label className="dash-field">
          <span>
            Cost per segment <em>(actual: {tariffRon} lei/segment)</em>
          </span>
          <input
            name="sms_tariff_cents"
            type="number"
            min={0}
            step={1}
            defaultValue={initialTariffCents}
            required
          />
          <small style={{ color: "var(--text-500)" }}>
            Valoare în bani (1 leu = 100 bani). Folosită pe raportul de facturare lunar.
          </small>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Salvează modificările"}
      </button>
    </form>
  )
}
