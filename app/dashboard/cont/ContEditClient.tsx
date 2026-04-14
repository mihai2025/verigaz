"use client"

import { useState, useTransition } from "react"
import { updateProfile } from "./actions"

type Props = {
  email: string
  fullName: string | null
  phone: string | null
  role: string
  createdAt: string | null
}

export default function ContEditClient({ email, fullName, phone, role, createdAt }: Props) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateProfile(fd)
      if (res.ok) setMsg({ kind: "ok", text: "Datele au fost salvate." })
      else setMsg({ kind: "err", text: res.error })
    })
  }

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {msg && (
        <div
          role="status"
          className={msg.kind === "ok" ? "dash-alert dash-alert--ok" : "auth-error"}
          style={
            msg.kind === "ok"
              ? {
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#e6f4ea",
                  color: "#1e6b34",
                  border: "1px solid #b7dfc3",
                  fontSize: 14,
                }
              : undefined
          }
        >
          {msg.text}
        </div>
      )}

      <fieldset className="dash-fieldset">
        <legend>Date cont</legend>
        <label className="dash-field">
          <span>Email</span>
          <input value={email} disabled readOnly />
          <small style={{ color: "var(--text-500)" }}>
            Emailul nu poate fi modificat din panou. Pentru schimbare, contactează suportul.
          </small>
        </label>
        <label className="dash-field">
          <span>Nume complet</span>
          <input name="full_name" defaultValue={fullName ?? ""} maxLength={120} placeholder="Ex: Ion Popescu" />
        </label>
        <label className="dash-field">
          <span>Telefon</span>
          <input name="phone" type="tel" defaultValue={phone ?? ""} maxLength={30} placeholder="Ex: 07XX XXX XXX" />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Informații cont</legend>
        <dl className="dash-dl">
          <dt>Rol</dt><dd>{role}</dd>
          <dt>Cont creat</dt>
          <dd>{createdAt ? new Date(createdAt).toLocaleDateString("ro-RO") : "—"}</dd>
        </dl>
      </fieldset>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : "Salvează modificările"}
      </button>
    </form>
  )
}
