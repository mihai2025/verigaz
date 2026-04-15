"use client"

import { useRouter } from "next/navigation"
import { FirmLogo } from "@/components/firms/FirmLogo"

type Firm = {
  slug: string
  name: string
  logo_url: string | null
  phone: string | null
  sediu_localitate_nume: string | null
  sediu_judet_nume: string | null
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Zm0-9.3a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z" />
    </svg>
  )
}
function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FirmaMobileHeader({ firm }: { firm: Firm }) {
  const router = useRouter()
  const locText = [firm.sediu_localitate_nume, firm.sediu_judet_nume].filter(Boolean).join(", ") || "România"

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back()
    else router.push("/")
  }

  return (
    <div className="firmaMobileHeader" role="banner" aria-label="Header firmă (mobil)">
      <div className="firmaMobileHeader__inner">
        <div className="firmaMobileHeader__left">
          <div className="firmaMobileHeader__logo">
            <FirmLogo logoUrl={firm.logo_url} firmName={firm.name} size={40} />
          </div>
          <div className="firmaMobileHeader__meta">
            <div className="firmaMobileHeader__name" title={firm.name}>{firm.name}</div>
            <div className="firmaMobileHeader__loc" title={locText}>
              <span className="firmaMobileHeader__pin" aria-hidden="true"><IconPin /></span>
              <span className="firmaMobileHeader__locText">{locText}</span>
            </div>
          </div>
        </div>

        <div className="firmaMobileHeader__actions">
          <button type="button" className="firmaMobileHeader__back" onClick={onBack} aria-label="Înapoi în site">
            <IconBack />
          </button>
        </div>
      </div>
    </div>
  )
}
