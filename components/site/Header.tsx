"use client"

import Link from "next/link"
import { useState } from "react"

const NAV_LINKS = [
  { href: "/servicii-gaze", label: "Firme & servicii" },
  { href: "/verificari-centrala", label: "Centrale termice" },
  { href: "/magazin", label: "Magazin" },
  { href: "/utile", label: "Ghiduri utile" },
  { href: "/platforma", label: "Platformă gestiune" },
  { href: "/abonamente", label: "Pentru firme" },
]

type AuthUser = {
  firstName: string | null
  email: string | null
} | null

function firstNameFrom(fullName: string | null, email: string | null): string | null {
  if (fullName) {
    const first = fullName.trim().split(/\s+/)[0]
    if (first) return first
  }
  if (email) {
    const local = email.split("@")[0] ?? ""
    if (local) return local.charAt(0).toUpperCase() + local.slice(1)
  }
  return null
}

export function Header({ user }: { user?: AuthUser }) {
  const [open, setOpen] = useState(false)
  const greetingName = user ? firstNameFrom(user.firstName, user.email) : null

  return (
    <header className="vg-header">
      <div className="vg-header__inner">
        <Link href="/" className="vg-logo" aria-label="verificari-gaze.ro home">
          <span className="vg-logo__mark">V</span>
          <span>verificari-gaze.ro</span>
        </Link>

        <nav className="vg-nav" aria-label="Navigare principală">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>

        <div className="vg-header__actions">
          {user ? (
            <Link href="/dashboard" className="vg-user-chip" aria-label="Contul meu">
              <span className="vg-user-chip__avatar" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="currentColor" />
                  <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="currentColor" />
                </svg>
              </span>
              <span className="vg-user-chip__text">
                <span className="vg-user-chip__hello">Salut,</span>
                <span className="vg-user-chip__name">{greetingName ?? "cont"}</span>
              </span>
            </Link>
          ) : (
            <Link href="/login" className="vg-btn vg-btn--ghost">Autentificare</Link>
          )}
          <Link href="/programare" className="vg-btn vg-btn--primary">Programează</Link>
          <button
            type="button"
            className="vg-menu-toggle"
            aria-label="Meniu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className={`vg-mobile-menu ${open ? "is-open" : ""}`}>
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        {user ? (
          <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard{greetingName ? ` (${greetingName})` : ""}</Link>
        ) : (
          <>
            <Link href="/login" onClick={() => setOpen(false)}>Autentificare</Link>
            <Link href="/inregistrare" onClick={() => setOpen(false)}>Înregistrare</Link>
          </>
        )}
      </div>
    </header>
  )
}
