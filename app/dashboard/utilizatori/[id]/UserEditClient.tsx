"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { assignUserToFirm, deleteUser, updateUser } from "../actions"

type Firm = { id: string; name: string; ownerId: string | null }

type Props = {
  userId: string
  initial: {
    email: string
    fullName: string | null
    phone: string | null
    role: string
    firmId: string | null
  }
  currentFirm: { id: string; slug: string; brand_name: string | null; legal_name: string } | null
  firms: Firm[]
}

export default function UserEditClient({ userId, initial, currentFirm, firms }: Props) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [firmMsg, setFirmMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set("user_id", userId)
    startTransition(async () => {
      const res = await updateUser(fd)
      if (res.ok) setMsg({ kind: "ok", text: "Datele au fost salvate." })
      else setMsg({ kind: "err", text: res.error })
    })
  }

  function onAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFirmMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set("user_id", userId)
    startTransition(async () => {
      const res = await assignUserToFirm(fd)
      if (res.ok) setFirmMsg({ kind: "ok", text: "Atribuirea a fost actualizată. Reîncarcă pagina." })
      else setFirmMsg({ kind: "err", text: res.error })
    })
  }

  function onDelete() {
    if (!confirm("Sigur vrei să ștergi userul? Acțiune ireversibilă.")) return
    const fd = new FormData()
    fd.set("user_id", userId)
    startTransition(async () => {
      const res = await deleteUser(fd)
      if (res && !res.ok) setMsg({ kind: "err", text: res.error })
    })
  }

  const okStyle = {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#e6f4ea",
    color: "#1e6b34",
    border: "1px solid #b7dfc3",
    fontSize: 14,
  } as const

  return (
    <>
      <form onSubmit={onUpdate} className="dash-form">
        {msg && (
          <div role="status" style={msg.kind === "ok" ? okStyle : undefined} className={msg.kind === "err" ? "auth-error" : undefined}>
            {msg.text}
          </div>
        )}

        <fieldset className="dash-fieldset">
          <legend>Date profil</legend>
          <label className="dash-field">
            <span>Email</span>
            <input value={initial.email} disabled readOnly />
          </label>
          <label className="dash-field">
            <span>Nume complet</span>
            <input name="full_name" defaultValue={initial.fullName ?? ""} maxLength={120} />
          </label>
          <label className="dash-field">
            <span>Telefon</span>
            <input name="phone" type="tel" defaultValue={initial.phone ?? ""} maxLength={30} />
          </label>
          <label className="dash-field">
            <span>Rol</span>
            <select name="role" defaultValue={initial.role}>
              <option value="user">user</option>
              <option value="firm_owner">firm_owner</option>
              <option value="firm">firm</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </fieldset>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
            {pending ? "Se salvează…" : "Salvează profilul"}
          </button>
        </div>
      </form>

      <form onSubmit={onAssign} className="dash-form" style={{ marginTop: 28 }}>
        {firmMsg && (
          <div role="status" style={firmMsg.kind === "ok" ? okStyle : undefined} className={firmMsg.kind === "err" ? "auth-error" : undefined}>
            {firmMsg.text}
          </div>
        )}

        <fieldset className="dash-fieldset">
          <legend>Atribuire firmă</legend>
          {currentFirm && (
            <p className="dash-note" style={{ marginBottom: 8 }}>
              Atribuit momentan la: <Link href={`/dashboard/firme/${currentFirm.id}`}><strong>{currentFirm.brand_name || currentFirm.legal_name}</strong></Link>
            </p>
          )}
          <label className="dash-field">
            <span>Firmă</span>
            <select name="firm_id" defaultValue={initial.firmId ?? ""}>
              <option value="">— dezleagă —</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {f.ownerId && f.ownerId !== userId ? " · are alt owner (va fi înlocuit)" : ""}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
          {pending ? "Se salvează…" : "Atribuie firmă"}
        </button>
      </form>

      <div style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <h2 style={{ color: "#a01818", fontSize: 18, margin: 0 }}>Zonă periculoasă</h2>
        <p className="dash-note">Ștergerea userului este ireversibilă. Firma atribuită (dacă există) va rămâne fără owner.</p>
        <button type="button" onClick={onDelete} disabled={pending} className="dash-btn" style={{ background: "#dc3545", color: "#fff", borderColor: "#dc3545" }}>
          Șterge user
        </button>
      </div>
    </>
  )
}
