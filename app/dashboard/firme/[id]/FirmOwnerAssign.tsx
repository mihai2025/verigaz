"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { assignFirmToUser } from "../../utilizatori/actions"

type User = { userId: string; email: string | null; fullName: string | null; firmId: string | null }

type Props = {
  firmId: string
  currentOwner: { userId: string; email: string | null; fullName: string | null } | null
  users: User[]
}

export default function FirmOwnerAssign({ firmId, currentOwner, users }: Props) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set("firm_id", firmId)
    const userId = String(fd.get("user_id") ?? "").trim()
    if (!userId) {
      // dezlegare — dacă există owner curent, îl trimitem cu firm_id="" ca să reseteze
      if (currentOwner) {
        fd.set("user_id", currentOwner.userId)
        fd.set("firm_id", "")
      } else {
        setMsg({ kind: "err", text: "Nu e nimic de schimbat." })
        return
      }
    }
    startTransition(async () => {
      const res = await assignFirmToUser(fd)
      if (res.ok) setMsg({ kind: "ok", text: "Atribuirea a fost salvată. Reîncarcă pagina." })
      else setMsg({ kind: "err", text: res.error })
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
    <form onSubmit={onSubmit} className="dash-form">
      {msg && (
        <div role="status" style={msg.kind === "ok" ? okStyle : undefined} className={msg.kind === "err" ? "auth-error" : undefined}>
          {msg.text}
        </div>
      )}

      {currentOwner ? (
        <p className="dash-note" style={{ marginBottom: 8 }}>
          Owner curent:{" "}
          <Link href={`/dashboard/utilizatori/${currentOwner.userId}`}>
            <strong>{currentOwner.fullName ?? currentOwner.email ?? currentOwner.userId.slice(0, 8)}</strong>
          </Link>{" "}
          {currentOwner.email && <span className="dash-subtle">· {currentOwner.email}</span>}
        </p>
      ) : (
        <p className="dash-note" style={{ marginBottom: 8 }}>Firma nu are owner atribuit.</p>
      )}

      <label className="dash-field">
        <span>Atribuie unui user</span>
        <select name="user_id" defaultValue={currentOwner?.userId ?? ""}>
          <option value="">— dezleagă owner curent —</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.fullName ?? "—"} · {u.email ?? "—"}
              {u.firmId && u.firmId !== firmId ? " · deja atribuit altei firme" : ""}
            </option>
          ))}
        </select>
        <small style={{ color: "var(--text-500)" }}>
          Dacă userul ales e deja atribuit altei firme, acea legătură va fi ruptă.
        </small>
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
          {pending ? "Se salvează…" : "Atribuie"}
        </button>
        <Link className="dash-btn dash-btn--ghost" href="/dashboard/utilizatori/nou">
          + Creează user nou
        </Link>
      </div>
    </form>
  )
}
