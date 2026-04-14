"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createEmployee, updateEmployee, toggleEmployeeActive } from "./actions"

type Initial = Record<string, string | boolean | null>

export default function EmployeeFormClient({
  mode,
  employeeId,
  initial,
}: {
  mode: "create" | "edit"
  employeeId?: string
  initial?: Initial
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const v = (k: string, fallback = "") => {
    const val = initial?.[k]
    return val == null || val === false || val === true ? fallback : String(val)
  }
  const isActive = initial?.is_active !== false

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setSaved(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = mode === "create" ? await createEmployee(fd) : await updateEmployee(employeeId!, fd)
      if (!res.ok) setError(res.error)
      else if (mode === "create") router.push("/dashboard/salariati")
      else setSaved(true)
    })
  }

  function toggleActive() {
    if (!employeeId) return
    setError(null)
    startTransition(async () => {
      const res = await toggleEmployeeActive(employeeId, !isActive)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {error && <div className="auth-error" role="alert">{error}</div>}
      {saved && <div className="auth-notice">Salvat.</div>}

      <fieldset className="dash-fieldset">
        <legend>Date angajat</legend>
        <label className="dash-field">
          <span>Nume complet *</span>
          <input name="full_name" required defaultValue={v("full_name")} maxLength={120} />
        </label>
        <div className="booking-row">
          <label className="dash-field">
            <span>Cod angajat (ex: ANG-001)</span>
            <input name="employee_code" defaultValue={v("employee_code")} maxLength={40} />
          </label>
          <label className="dash-field">
            <span>Rol (ex: tehnician verificare)</span>
            <input name="role" defaultValue={v("role")} maxLength={80} />
          </label>
        </div>
        <div className="booking-row">
          <label className="dash-field">
            <span>Telefon</span>
            <input name="phone" type="tel" defaultValue={v("phone")} maxLength={30} autoComplete="off" />
          </label>
          <label className="dash-field">
            <span>Email</span>
            <input name="email" type="email" defaultValue={v("email")} maxLength={120} autoComplete="off" />
          </label>
        </div>
        <label className="dash-field">
          <span>Nr. certificat ANRE personal (dacă are)</span>
          <input name="anre_personal_certificate_no" defaultValue={v("anre_personal_certificate_no")} maxLength={60} />
        </label>
      </fieldset>

      <div className="dash-actions-row">
        <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
          {pending ? "Se salvează…" : mode === "create" ? "Adaugă angajat" : "Salvează"}
        </button>
        {mode === "edit" && employeeId && (
          <button
            type="button"
            disabled={pending}
            className="dash-btn dash-btn--ghost"
            onClick={toggleActive}
          >
            {isActive ? "Dezactivează" : "Reactivează"}
          </button>
        )}
      </div>
    </form>
  )
}
