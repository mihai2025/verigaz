"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type Props = {
  role: "admin" | "firm_owner" | "user"
  firmId: string | null
  userName: string | null
  pendingClaims?: number
  pendingOrders?: number
}

type MenuItem =
  | { kind: "link"; href: string; label: string; badge?: number }
  | { kind: "dropdown"; label: string; items: Array<{ href: string; label: string; badge?: number }> }

function buildMenu(role: Props["role"], firmId: string | null, pendingClaims: number, pendingOrders: number): MenuItem[] {
  if (role === "admin") {
    return [
      { kind: "link", href: "/dashboard", label: "Acasă" },
      {
        kind: "dropdown",
        label: "Administrare",
        items: [
          { href: "/dashboard/firme", label: "Firme", badge: pendingClaims },
          { href: "/dashboard/utilizatori", label: "Utilizatori" },
          { href: "/dashboard/leads-admin", label: "Lead-uri" },
          { href: "/dashboard/reviews-admin", label: "Review-uri" },
          { href: "/dashboard/audit", label: "Audit log" },
        ],
      },
      {
        kind: "dropdown",
        label: "SMS",
        items: [
          { href: "/dashboard/sms-templates", label: "Template-uri" },
          { href: "/dashboard/sms-log", label: "Log SMS" },
        ],
      },
      { kind: "link", href: "/dashboard/planuri", label: "Planuri & tarife" },
      { kind: "link", href: "/dashboard/pixeli-tracking", label: "Pixeli & Tracking" },
      { kind: "link", href: "/dashboard/magazin-comenzi", label: "Comenzi", badge: pendingOrders },
      {
        kind: "dropdown",
        label: "Rapoarte",
        items: [
          { href: "/dashboard/rapoarte/facturare-sms", label: "Facturare SMS" },
        ],
      },
      { kind: "link", href: "/dashboard/cont", label: "Contul meu" },
    ]
  }

  if (role === "firm_owner" && firmId) {
    return [
      { kind: "link", href: "/dashboard", label: "Acasă" },
      {
        kind: "dropdown",
        label: "Firma",
        items: [
          { href: "/dashboard/cont", label: "Contul meu" },
          { href: "/dashboard/firma-mea", label: "Profil firmă" },
          { href: "/dashboard/salariati", label: "Tehnicieni" },
          { href: "/dashboard/echipamente", label: "Echipamente catalog" },
          { href: "/dashboard/abonament", label: "Abonament" },
        ],
      },
      { kind: "link", href: "/dashboard/clienti", label: "Clienți" },
      { kind: "link", href: "/dashboard/contracte", label: "Contracte" },
      { kind: "link", href: "/dashboard/fise-de-lucru", label: "Fișe de lucru" },
      { kind: "link", href: "/dashboard/programari", label: "Programări" },
      {
        kind: "dropdown",
        label: "Magazin",
        items: [
          { href: "/dashboard/magazin-produse", label: "Produse" },
          { href: "/dashboard/magazin-comenzi", label: "Comenzi", badge: pendingOrders },
        ],
      },
      {
        kind: "dropdown",
        label: "Rapoarte",
        items: [
          { href: "/dashboard/rapoarte/scadente", label: "Scadențe echipamente" },
          { href: "/dashboard/rapoarte/contracte", label: "Contracte" },
          { href: "/dashboard/rapoarte/interventii", label: "Intervenții pe tip" },
          { href: "/dashboard/rapoarte/revizii", label: "Revizii (10 ani)" },
          { href: "/dashboard/rapoarte/verificari", label: "Verificări" },
          { href: "/dashboard/rapoarte/tehnicieni", label: "Tehnicieni" },
        ],
      },
      {
        kind: "dropdown",
        label: "Comunicare",
        items: [
          { href: "/dashboard/notificari", label: "Notificări" },
          { href: "/dashboard/documente", label: "Documente emise" },
        ],
      },
    ]
  }

  return [
    { kind: "link", href: "/dashboard", label: "Acasă" },
    { kind: "link", href: "/dashboard/cont", label: "Contul meu" },
    { kind: "link", href: "/dashboard/adauga-firma", label: "Adaugă firmă" },
  ]
}

function Badge({ count }: { count?: number }) {
  if (!count) return null
  return <span className="dash-hdr__badge">{count}</span>
}

function Dropdown({
  label,
  items,
  active,
  onNavigate,
}: {
  label: string
  items: Array<{ href: string; label: string; badge?: number }>
  active: boolean
  onNavigate: () => void
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  // Închide dropdown pe click în afară
  useEffect(() => {
    function handler(e: MouseEvent) {
      const d = ref.current
      if (!d || !d.open) return
      if (!d.contains(e.target as Node)) d.open = false
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  function handleItemClick() {
    if (ref.current) ref.current.open = false
    onNavigate()
  }

  return (
    <details className="dash-hdr__dropdown" ref={ref}>
      <summary
        className={`dash-hdr__link dash-hdr__dropdown-btn ${active ? "is-active" : ""}`}
        aria-haspopup="true"
      >
        {label}
        <span className="dash-hdr__caret" aria-hidden="true">▾</span>
      </summary>
      <div className="dash-hdr__dropdown-panel" role="menu">
        {items.map((sub) => (
          <Link
            key={sub.href}
            href={sub.href}
            role="menuitem"
            className="dash-hdr__dropdown-link"
            onClick={handleItemClick}
          >
            <span>{sub.label}</span>
            <Badge count={sub.badge} />
          </Link>
        ))}
      </div>
    </details>
  )
}

export function DashboardHeader({ role, firmId, userName, pendingClaims = 0, pendingOrders = 0 }: Props) {
  const pathname = usePathname() ?? ""
  const [mobileOpen, setMobileOpen] = useState(false)

  const menu = buildMenu(role, firmId, pendingClaims, pendingOrders)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  function isDropdownActive(items: Array<{ href: string }>): boolean {
    return items.some((i) => isActive(i.href))
  }

  return (
    <header className="dash-hdr">
      <div className="dash-hdr__inner">
        <Link href="/" className="dash-hdr__brand" title="verificari-gaze.ro">
          <span className="dash-hdr__brand-mark">V</span>
        </Link>

        <nav className={`dash-hdr__nav ${mobileOpen ? "is-open" : ""}`} aria-label="Navigare dashboard">
          {menu.map((item, idx) => {
            if (item.kind === "link") {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`dash-hdr__link ${isActive(item.href) ? "is-active" : ""}`}
                >
                  {item.label}
                  <Badge count={item.badge} />
                </Link>
              )
            }
            return (
              <Dropdown
                key={idx}
                label={item.label}
                items={item.items}
                active={isDropdownActive(item.items)}
                onNavigate={() => setMobileOpen(false)}
              />
            )
          })}
        </nav>

        <div className="dash-hdr__actions">
          {userName && (
            <span className="dash-hdr__user" title="Contul meu">
              <span className="dash-hdr__user-avatar" aria-hidden="true">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="dash-hdr__user-name">{userName}</span>
            </span>
          )}
          <form action="/logout" method="post" style={{ display: "inline" }}>
            <button type="submit" className="dash-hdr__logout" title="Ieșire">
              Ieșire
            </button>
          </form>
          <button
            type="button"
            className="dash-hdr__burger"
            aria-label="Meniu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
