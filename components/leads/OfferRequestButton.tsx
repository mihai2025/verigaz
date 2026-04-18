"use client"

import { useState } from "react"
import OfferRequestModal from "./OfferRequestModal"

type Props = {
  className?: string
  label?: string
  defaultJudetId?: number | null
  defaultLocalitateId?: number | null
  firmSlug?: string | null
  firmName?: string | null
  source?: string
  children?: React.ReactNode
}

export default function OfferRequestButton({
  className = "vg-btn vg-btn--primary",
  label = "Cere rapid ofertă",
  defaultJudetId,
  defaultLocalitateId,
  firmSlug,
  firmName,
  source,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children ?? label}
      </button>
      <OfferRequestModal
        open={open}
        onClose={() => setOpen(false)}
        defaultJudetId={defaultJudetId}
        defaultLocalitateId={defaultLocalitateId}
        firmSlug={firmSlug}
        firmName={firmName}
        source={source}
      />
    </>
  )
}
