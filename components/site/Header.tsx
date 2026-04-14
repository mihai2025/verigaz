"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SearchModal } from "@/components/ui/SearchModal"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"
import { getIsAdmin } from "@/lib/auth/getIsAdmin"
import { DOMAIN } from "@/lib/config/domain"

type HeaderProps = {
  initialQ?: string
  currentPath?: string
  accountHref?: string
}

// ── Icons ──────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 3.75a6.75 6.75 0 1 0 4.19 12.04l4.42 4.42a.9.9 0 1 0 1.27-1.27l-4.42-4.42A6.75 6.75 0 0 0 10.5 3.75Zm0 1.8a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12.25a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Zm0-1.8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM4.75 20.35c.9-3.77 4.02-5.6 7.25-5.6s6.35 1.83 7.25 5.6a.9.9 0 1 1-1.75.42c-.67-2.8-3-4.22-5.5-4.22s-4.83 1.42-5.5 4.22a.9.9 0 1 1-1.75-.42Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7.5h14a.9.9 0 1 0 0-1.8H5a.9.9 0 0 0 0 1.8Zm14 4.4H5a.9.9 0 1 0 0 1.8h14a.9.9 0 1 0 0-1.8Zm0 6.2H5a.9.9 0 1 0 0 1.8h14a.9.9 0 1 0 0-1.8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="nav-dd__arrow">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Mobile Menu ─────────────────────────────────────────

function MobileMenu({
  open,
  onClose,
  showAdminLink,
  isLoggedIn,
  userHref,
}: {
  open: boolean
  onClose: () => void
  showAdminLink: boolean
  isLoggedIn: boolean
  userHref: string
}) {
  // Lock body scroll & close on ESC
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="mm-root" role="dialog" aria-modal="true">
      <button className="mm-backdrop" onClick={onClose} aria-label="Închide meniul" />
      <div className="mm-panel">
        <div className="mm-head">
          <div className="mm-title">Meniu</div>
          <button className="mm-close-btn" onClick={onClose} type="button" aria-label="Închide meniul">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="mm-body">
          <Link className="mm-link" href="/servicii" onClick={onClose}>
            Servicii funerare
          </Link>
          <Link className="mm-link" href="/comemorari" onClick={onClose}>
            Comemorări / Anunțuri
          </Link>

          {/* Ghiduri */}
          <div className="mm-group__label">Ghiduri</div>
          <Link className="mm-sublink mm-sublink--accent" href="/servicii-funerare/ce-trebuie-facut-dupa-deces-ghid-pdf" onClick={onClose}>
            Ghid PDF — primele 72 de ore
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/acte-necesare-dupa-deces" onClick={onClose}>
            Acte necesare după deces
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/cost-inmormantare" onClick={onClose}>
            Cost înmormântare
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ajutor-de-inmormantare" onClick={onClose}>
            Ajutor de înmormântare
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ghid-complet-dupa-deces" onClick={onClose}>
            Ghid complet după deces
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ghid/model-anunt-deces" onClick={onClose}>
            Model anunț deces
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ghid/model-mesaje-condoleante" onClick={onClose}>
            Modele mesaje condoleanțe
          </Link>

          {/* Calendar & Parastase */}
          <div className="mm-group__label">Calendar & Parastase</div>
          <Link className="mm-sublink mm-sublink--accent" href="/calendar-ortodox" onClick={onClose}>
            Calendar Ortodox 2026
          </Link>
          <Link className="mm-sublink" href="/mesaje-condoleante" onClick={onClose}>
            100+ Mesaje de condoleanțe
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/calendar-parastase" onClick={onClose}>
            Calendar parastase
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/calculator-parastase" onClick={onClose}>
            Calculator date parastas
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/reminder-parastase" onClick={onClose}>
            Reminder parastas SMS
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ghid/ghid-complet-parastas" onClick={onClose}>
            Ghid complet parastas
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ghid/ce-se-da-la-40-zile" onClick={onClose}>
            Ce se dă la 40 de zile
          </Link>
          <Link className="mm-sublink" href="/servicii-funerare/ghid/model-pomelnic-40-zile-sarindar" onClick={onClose}>
            Model pomelnic 40 zile
          </Link>

          <div className="mm-divider" />

          <Link className="mm-link" href="/articole" onClick={onClose}>
            Articole și ghiduri
          </Link>
          <Link className="mm-link" href="/psihologi" onClick={onClose}>
            Psihologi doliu
          </Link>
          <Link className="mm-link" href="/magazin" onClick={onClose}>
            Magazin online
          </Link>

          <div className="mm-divider" />

          <Link className="mm-link mm-link--cta" href="/servicii-funerare/life-plan" onClick={onClose}>
            LifePlan QR
          </Link>
          <Link className="mm-link" href="/adauga-firma" onClick={onClose}>
            Adaugă firmă
          </Link>

          <div className="mm-divider" />

          <Link className="mm-link" href={userHref} onClick={onClose}>
            {isLoggedIn ? "Contul meu" : "Autentificare"}
          </Link>

          {showAdminLink ? (
            <Link className="mm-link" href="/dashboard" onClick={onClose}>
              Panou administrare
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Main Header ─────────────────────────────────────────

export function Header({
  initialQ = "",
  currentPath = "/",
  accountHref = "/dashboard",
}: HeaderProps) {
  const router = useRouter()

  const [q, setQ] = useState(initialQ)
  const [openSearch, setOpenSearch] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [openDd, setOpenDd] = useState<"ghiduri" | "parastase" | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const isLoggedIn = !!session

  const [clientPath, setClientPath] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const ddRef = useRef<HTMLDivElement | null>(null)
  const ddLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelDdLeave() {
    if (ddLeaveTimer.current !== null) {
      clearTimeout(ddLeaveTimer.current)
      ddLeaveTimer.current = null
    }
  }

  function scheduleDdLeave() {
    cancelDdLeave()
    ddLeaveTimer.current = setTimeout(() => setOpenDd(null), 150)
  }

  useEffect(() => {
    setQ(initialQ || "")
  }, [initialQ])

  useEffect(() => {
    if (typeof window === "undefined") return
    setClientPath((window.location.pathname + window.location.search) || "/")
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDd) return
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setOpenDd(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [openDd])

  // Close dropdown on ESC
  useEffect(() => {
    if (!openDd) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDd(null)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [openDd])

  const isFirmPage = useMemo(() => {
    const p = (clientPath || currentPath || "").split("?")[0] || ""
    return p.startsWith("/firme/")
  }, [clientPath, currentPath])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!session) {
        if (!cancelled) { setIsAdmin(false); setAvatarUrl(null) }
        return
      }

      const userId = session.user.id

      try {
        const admin = await getIsAdmin(supabase as any, userId)
        if (!cancelled) setIsAdmin(admin)
      } catch {
        if (!cancelled) setIsAdmin(false)
      }

      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", userId)
          .maybeSingle()
        if (!cancelled && prof) setAvatarUrl((prof as any).avatar_url || null)
      } catch {}
    })()

    return () => {
      cancelled = true
    }
  }, [session, supabase])

  function buildTarget(query: string) {
    const cleaned = query.trim()
    if (!cleaned) return "/servicii"
    return `/cauta?q=${encodeURIComponent(cleaned)}`
  }

  function onSubmitModalSearch(value: string) {
    setQ(value)
    router.push(buildTarget(value))
  }

  const effectivePath = clientPath || currentPath || "/"
  const isDashboardPath = effectivePath.startsWith("/dashboard") || effectivePath.startsWith("/cont")
  const userHref = isLoggedIn ? accountHref : isDashboardPath ? `/login?redirect=${encodeURIComponent(effectivePath)}` : "/login"
  const showAdminLink = isLoggedIn && isAdmin

  return (
    <>
      <header className={`nav ${isFirmPage ? "nav--firm" : ""}`}>
        <div className="nav-inner nav-inner--hdr">
          {/* Brand */}
          <Link href="/" className="brand">
            <span className="brand-mark">gf</span>
            <span className="brand-text brand-text--desktop">
              <span className="brand-name">{DOMAIN.domain}</span>
              <span className="brand-sub">{DOMAIN.headerTagline}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="top-nav top-nav--desktop" aria-label="Navigație principală" ref={ddRef}>
            <Link href="/servicii" className="top-link">
              Servicii
            </Link>
            <Link href="/comemorari" className="top-link">
              Comemorări
            </Link>

            {/* Dropdown: Ghiduri */}
            <div
              className={`nav-dd ${openDd === "ghiduri" ? "nav-dd--open" : ""}`}
              onMouseEnter={() => { cancelDdLeave(); setOpenDd("ghiduri") }}
              onMouseLeave={scheduleDdLeave}
            >
              <button
                className="nav-dd__trigger"
                onClick={() => setOpenDd(openDd === "ghiduri" ? null : "ghiduri")}
                aria-expanded={openDd === "ghiduri"}
                aria-haspopup="true"
              >
                Ghiduri
                <IconChevron />
              </button>
              {openDd === "ghiduri" && (
                <div className="nav-dd__panel" role="menu">
                  <Link
                    className="nav-dd__item nav-dd__item--featured"
                    href="/servicii-funerare/ce-trebuie-facut-dupa-deces-ghid-pdf"
                    role="menuitem"
                  >
                    Ghid PDF — primele 72 de ore
                  </Link>
                  <div className="nav-dd__sep" />
                  <Link className="nav-dd__item" href="/servicii-funerare/acte-necesare-dupa-deces" role="menuitem">
                    Acte necesare după deces
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/cost-inmormantare" role="menuitem">
                    Cost înmormântare
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ajutor-de-inmormantare" role="menuitem">
                    Ajutor de înmormântare
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid-complet-dupa-deces" role="menuitem">
                    Ghid complet după deces
                  </Link>
                  <div className="nav-dd__sep" />
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/model-anunt-deces" role="menuitem">
                    Model anunț deces
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/model-mesaje-condoleante" role="menuitem">
                    Modele mesaje condoleanțe
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/ghid-complet-doliu" role="menuitem">
                    Ghid complet doliu
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/ghid-complet-traditii" role="menuitem">
                    Ghid complet tradiții
                  </Link>
                  <div className="nav-dd__sep" />
                  <Link className="nav-dd__item nav-dd__item--all" href="/articole" role="menuitem">
                    Toate articolele
                  </Link>
                </div>
              )}
            </div>

            {/* Dropdown: Parastase */}
            <div
              className={`nav-dd ${openDd === "parastase" ? "nav-dd--open" : ""}`}
              onMouseEnter={() => { cancelDdLeave(); setOpenDd("parastase") }}
              onMouseLeave={scheduleDdLeave}
            >
              <button
                className="nav-dd__trigger"
                onClick={() => setOpenDd(openDd === "parastase" ? null : "parastase")}
                aria-expanded={openDd === "parastase"}
                aria-haspopup="true"
              >
                Parastase
                <IconChevron />
              </button>
              {openDd === "parastase" && (
                <div className="nav-dd__panel" role="menu">
                  <Link className="nav-dd__item" href="/servicii-funerare/calendar-parastase" role="menuitem">
                    Calendar parastase
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/calculator-parastase" role="menuitem">
                    Calculator date parastas
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/reminder-parastase" role="menuitem">
                    Reminder parastas SMS
                  </Link>
                  <div className="nav-dd__sep" />
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/ghid-complet-parastas" role="menuitem">
                    Ghid complet parastas
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/ce-se-da-la-40-zile" role="menuitem">
                    Ce se dă la 40 de zile
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/ce-se-imparte-la-parastas" role="menuitem">
                    Ce se împarte la parastas
                  </Link>
                  <Link className="nav-dd__item" href="/servicii-funerare/ghid/model-pomelnic-40-zile-sarindar" role="menuitem">
                    Model pomelnic 40 zile
                  </Link>
                </div>
              )}
            </div>

            <Link href="/magazin" className="top-link">
              Magazin
            </Link>

            <span className="top-nav-sep" aria-hidden="true" />
            <Link href="/servicii-funerare/ce-trebuie-facut-dupa-deces-ghid-pdf" className="top-cta top-cta--outline">
              Ghid PDF Deces
            </Link>
            <Link href="/servicii-funerare/life-plan" className="top-cta top-cta--filled">
              LifePlan QR
            </Link>
          </nav>

          {/* Right actions */}
          <div className="top-actions">
            {/* Mobile only — mini pills */}
            <Link href="/servicii-funerare/ce-trebuie-facut-dupa-deces-ghid-pdf" className="top-mcta top-mcta--outline" title="Ghid PDF Deces">
              <svg className="top-mcta__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span className="top-mcta__text">Ghid PDF</span>
            </Link>
            <Link href="/servicii-funerare/life-plan" className="top-mcta top-mcta--gold" title="Life Plan QR">
              <svg className="top-mcta__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="2" y="2" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="4" y="4" width="4" height="4" rx=".5" />
                <rect x="14" y="2" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="16" y="4" width="4" height="4" rx=".5" />
                <rect x="2" y="14" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="4" y="16" width="4" height="4" rx=".5" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="19" y="14" width="3" height="3" />
                <rect x="14" y="19" width="3" height="3" />
                <rect x="19" y="19" width="3" height="3" />
              </svg>
              <span className="top-mcta__text">Plan QR</span>
            </Link>
            <Link href="/magazin" className="top-mcta top-mcta--shop" title="Magazin">
              <svg className="top-mcta__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </Link>

            <button
              className="icon-btn icon-btn--v2 top-search-trigger"
              type="button"
              aria-label="Cautare"
              onClick={() => setOpenSearch(true)}
            >
              <IconSearch />
            </button>

            <button
              className="icon-btn icon-btn--v2 top-menu-btn"
              type="button"
              aria-label="Meniu"
              onClick={() => setOpenMenu(true)}
            >
              <IconMenu />
            </button>

            <Link
              className={`icon-btn icon-btn--v2 icon-btn--user ${isLoggedIn ? "is-auth" : "is-guest"} ${avatarUrl ? "has-avatar" : ""}`}
              href={userHref}
              aria-label={isLoggedIn ? "Contul meu" : "Autentificare"}
              title={isLoggedIn ? "Contul meu" : "Autentificare"}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "25%" }}
                />
              ) : (
                <IconUser />
              )}
            </Link>
          </div>
        </div>
      </header>

      <SearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        initialValue={q}
        onSubmit={onSubmitModalSearch}
      />

      <MobileMenu
        open={openMenu}
        onClose={() => setOpenMenu(false)}
        showAdminLink={showAdminLink}
        isLoggedIn={isLoggedIn}
        userHref={userHref}
      />
    </>
  )
}
