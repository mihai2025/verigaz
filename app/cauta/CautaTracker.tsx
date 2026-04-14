"use client"

import { useEffect, useRef } from "react"
import { trackSearchImpressions } from "@/lib/analytics/useAnalytics"

export function CautaTracker({ firmIds }: { firmIds: string[] }) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current || firmIds.length === 0) return
    trackedRef.current = true
    trackSearchImpressions(firmIds)
  }, [firmIds])

  return null
}
