"use client"

import { useEffect, useState } from "react"
import "@/styles/cookie-banner.css"

const STORAGE_KEY = "cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cb" role="dialog" aria-label="Cookie consent">
      <div className="cb__card">
        <div className="cb__icon">🍪</div>

        <div className="cb__body">
          <div className="cb__title">Folosim cookie-uri</div>
          <p className="cb__text">
            Acest site folosește cookie-uri pentru a-ți oferi o experiență mai bună.{" "}
            <a href="/politica-de-cookies" className="cb__link">Detalii</a>
          </p>
        </div>

        <div className="cb__actions">
          <button type="button" className="cb__btn cb__btn--accept" onClick={accept}>
            Accept
          </button>
          <button type="button" className="cb__btn cb__btn--reject" onClick={reject}>
            Refuz
          </button>
        </div>
      </div>
    </div>
  )
}
