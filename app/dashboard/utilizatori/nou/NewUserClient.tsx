"use client"

import { useState, useTransition } from "react"
import { createUser } from "../actions"

type Firm = { id: string; name: string; hasOwner: boolean }

export default function NewUserClient({ firms }: { firms: Firm[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createUser(fd)
      if (res && !res.ok) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {error && <div className="auth-error" role="alert">{error}</div>}

      <fieldset className="dash-fieldset">
        <legend>Credențiale</legend>
        <label className="dash-field">
          <span>Email *</span>
          <input name="email" type="email" required maxLength={120} />
        </label>
        <label className="dash-field">
          <span>Parolă (minim 8 caractere) *</span>
          <input name="password" type="text" required minLength={8} maxLength={100} />
          <small style={{ color: "var(--text-500)" }}>Va primi parola direct de la tine; o va schimba din cont.</small>
        </label>
        <label className="dash-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input name="auto_confirm" type="checkbox" defaultChecked />
          <span>Confirmare automată email (nu trimite link de verificare)</span>
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Profil</legend>
        <label className="dash-field">
          <span>Nume complet</span>
          <input name="full_name" maxLength={120} />
        </label>
        <label className="dash-field">
          <span>Telefon</span>
          <input name="phone" type="tel" maxLength={30} />
        </label>
        <label className="dash-field">
          <span>Rol *</span>
          <select name="role" defaultValue="user" required>
            <option value="user">user</option>
            <option value="firm_owner">firm_owner</option>
            <option value="firm">firm (legacy)</option>
            <option value="admin">admin</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Atribuire firmă (opțional)</legend>
        <label className="dash-field">
          <span>Firmă</span>
          <select name="firm_id" defaultValue="">
            <option value="">— fără atribuire —</option>
            {firms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} {f.hasOwner ? "· are deja owner (va fi înlocuit)" : ""}
              </option>
            ))}
          </select>
          <small style={{ color: "var(--text-500)" }}>
            Userul devine owner al firmei. Dacă firma avea alt owner, îi este anulată atribuirea.
          </small>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se creează…" : "Creează utilizator"}
      </button>
    </form>
  )
}
