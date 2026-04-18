"use client"

import { useEffect, useState } from "react"
import OfferRequestModal from "./OfferRequestModal"

const DELAY_MS = 6000
const DISMISS_KEY = "vg-offer-dismissed-"
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000 // 24h

type Props = {
  firmSlug: string
  firmName: string
  judetId: number | null
  localitateId: number | null
}

export default function FirmaOfferAutoModal({ firmSlug, firmName, judetId, localitateId }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const k = DISMISS_KEY + firmSlug
    try {
      const v = localStorage.getItem(k)
      if (v && Date.now() - Number(v) < DISMISS_TTL_MS) return
    } catch {}
    const t = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [firmSlug])

  function handleClose() {
    setOpen(false)
    try { localStorage.setItem(DISMISS_KEY + firmSlug, String(Date.now())) } catch {}
  }

  return (
    <OfferRequestModal
      open={open}
      onClose={handleClose}
      defaultJudetId={judetId}
      defaultLocalitateId={localitateId}
      firmSlug={firmSlug}
      firmName={firmName}
      source="firma_auto"
    />
  )
}
