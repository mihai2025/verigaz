"use client"

import { useEffect, useState } from "react"

type Firm = {
  id: string
  plan: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url?: string | null
  sediu_adresa?: string | null
  sediu_localitate_nume?: string | null
  sediu_judet_nume?: string | null
}

function normalizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = String(raw).replace(/[^\d+]/g, "")
  if (!digits) return null
  return digits.startsWith("0") ? `+4${digits}` : digits
}
function telLink(raw?: string | null) {
  const n = normalizePhone(raw)
  return n ? `tel:${n}` : null
}
function waLink(raw?: string | null) {
  const n = normalizePhone(raw)
  return n ? `https://wa.me/${n.replace("+", "")}` : null
}
function safeUrl(raw?: string | null) {
  const v = String(raw || "").trim()
  if (!v) return null
  return v.startsWith("http") ? v : `https://${v}`
}
function isRealMobile() {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")
}

function IconFacebook() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.3V12h2.3V9.7c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.4.7-1.4 1.4V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 22 12Z" /></svg>) }
function IconInstagram() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm5.3-.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></svg>) }
function IconTikTok() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 3a5.6 5.6 0 0 0 3 1v3a8.7 8.7 0 0 1-3-.6v7.1a6.5 6.5 0 1 1-6.5-6.5c.2 0 .5 0 .7.1v3.4a3.1 3.1 0 1 0 2.8 3.1V3h3Z" /></svg>) }
function IconGlobe() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.9 9h-3.3a15.7 15.7 0 0 0-1.2-5 8.1 8.1 0 0 1 4.5 5ZM12 4.1c.9 1.3 1.6 3.2 2 6H10c.4-2.8 1.1-4.7 2-6ZM4.1 13h3.3c.2 1.8.7 3.6 1.2 5A8.1 8.1 0 0 1 4.1 13Zm3.3-2H4.1a8.1 8.1 0 0 1 4.5-5c-.5 1.4-1 3.2-1.2 5Zm2.6 2h4c-.4 2.8-1.1 4.7-2 6-.9-1.3-1.6-3.2-2-6Zm6.6 5c.5-1.4 1-3.2 1.2-5h3.3a8.1 8.1 0 0 1-4.5 5Zm1.2-7a13.6 13.6 0 0 1 0 2h-5.6a13.6 13.6 0 0 1 0-2h5.6Z" /></svg>) }
function IconNavigate() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 4 20l8-3.5L20 20 12 2Zm0 5.2 4.5 9.1-4.5-2-4.5 2L12 7.2Z" /></svg>) }
function IconPhone() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.2c1.6 3.2 4 5.6 7.2 7.2l2.4-2.4c.3-.3.8-.4 1.2-.2 1 .4 2.1.7 3.2.8.5.1.9.5.9 1v3.8c0 .6-.4 1-1 1C10.4 21.2 2.8 13.6 2.8 4.5c0-.6.4-1 1-1h3.8c.5 0 .9.4 1 .9.1 1.1.4 2.2.8 3.2.2.4.1.9-.2 1.2l-2.6 2.4Z" /></svg>) }
function IconWhatsApp() { return (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.5c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.2.1-2-.1-.4-.1-1-.3-1.7-.6-2.9-1.2-4.8-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.3.8-.3h.6c.2 0 .5-.1.7.5l.9 2.1c.1.3.1.5 0 .7l-.3.5c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.5.3.1.5.1.7-.1l.8-.9c.2-.2.4-.3.7-.2l2.4 1.1c.3.1.5.2.6.3.1.1.1.6-.1 1.2Z" /></svg>) }

function IconBtn({ href, disabled, label, className, children }: { href?: string | null; disabled?: boolean; label: string; className?: string; children: React.ReactNode }) {
  if (!href || disabled) {
    return <span className={`firmaStickyIconBtn ${className || ""} isDisabled`} aria-label={label} title="Disponibil Premium">{children}</span>
  }
  return <a className={`firmaStickyIconBtn ${className || ""}`} href={href} target="_blank" rel="noreferrer" title={label}>{children}</a>
}

function NavPill({ href, disabled }: { href?: string | null; disabled?: boolean }) {
  if (!href || disabled) {
    return (
      <span className="firmaStickyNavPill isDisabled" aria-label="Condu către" title="Disponibil Premium">
        <IconNavigate /><span>Condu către</span>
      </span>
    )
  }
  return (
    <a className="firmaStickyNavPill" href={href} target="_blank" rel="noreferrer" aria-label="Condu către" title="Condu către">
      <IconNavigate /><span>Condu către</span>
    </a>
  )
}

export function FirmaStickyCta({ firm }: { firm: Firm }) {
  const [show, setShow] = useState(false)
  useEffect(() => { setShow(isRealMobile()) }, [])
  if (!show) return null

  const plan = String(firm.plan || "free").toLowerCase()
  const isPremium = plan === "premium"
  const isStart = plan === "start" || plan === "plus"
  const canAll = isStart || isPremium

  const tel = telLink(firm.phone || firm.whatsapp || null)
  const wa = waLink(firm.whatsapp || firm.phone || null)
  const fb = safeUrl(firm.facebook_url ?? null)
  const ig = safeUrl(firm.instagram_url ?? null)
  const tt = safeUrl(firm.tiktok_url ?? null)
  const site = safeUrl(firm.website ?? null)

  // Build maps query from address if no coordinates
  const addr = [firm.sediu_adresa, firm.sediu_localitate_nume, firm.sediu_judet_nume].filter(Boolean).join(", ")
  const navHref = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : null

  return (
    <div className="firmaStickyCta">
      <div className="firmaStickyInner">
        <div className="firmaStickyTopRow">
          <div className="firmaStickyIcons">
            <IconBtn href={fb} disabled={!canAll} label="Facebook" className="firmaStickyIconBtn--fb"><IconFacebook /></IconBtn>
            <IconBtn href={ig} disabled={!canAll} label="Instagram" className="firmaStickyIconBtn--ig"><IconInstagram /></IconBtn>
            <IconBtn href={tt} disabled={!canAll} label="TikTok" className="firmaStickyIconBtn--tt"><IconTikTok /></IconBtn>
            <IconBtn href={site} disabled={!canAll} label="Website" className="firmaStickyIconBtn--web"><IconGlobe /></IconBtn>
            <NavPill href={navHref} disabled={!canAll || !navHref} />
          </div>
        </div>

        <div className="firmaStickyActions">
          <a
            className={`firmaStickyBtn firmaStickyBtn--call ${!canAll || !tel ? "isDisabled" : ""}`}
            href={canAll && tel ? tel : undefined}
          >
            <IconPhone />
            Sună acum
          </a>
          <a
            className={`firmaStickyBtn firmaStickyBtn--wa ${!canAll || !wa ? "isDisabled" : ""}`}
            href={canAll && wa ? wa : undefined}
            target={canAll && wa ? "_blank" : undefined}
            rel={canAll && wa ? "noreferrer" : undefined}
          >
            <IconWhatsApp />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
