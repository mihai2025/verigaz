"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function scrollToHash() {
  const hash = window.location.hash
  if (!hash) return

  const id = decodeURIComponent(hash.replace("#", ""))
  const el = document.getElementById(id)
  if (!el) return

  // IMPORTANT: "instant" ca să nu sară aiurea la reflow
  el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior })
}

export function HashScroller() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 1) imediat după render
    scrollToHash()

    // 2) încă o dată după ce Suspense/layout au timp să se așeze
    const t1 = window.setTimeout(scrollToHash, 50)
    const t2 = window.setTimeout(scrollToHash, 250)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [pathname, searchParams])

  return null
}
