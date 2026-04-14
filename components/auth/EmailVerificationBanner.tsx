// components/auth/EmailVerificationBanner.tsx
"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export function EmailVerificationBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function resend() {
    setSending(true); setMsg(null)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setSending(false)
    setMsg(error ? error.message : "Email de confirmare retrimis.")
  }

  return (
    <div className="auth-banner" role="status">
      <span>
        Email-ul <strong>{email}</strong> nu e confirmat. Verifică inbox-ul pentru link-ul trimis.
      </span>
      <button type="button" onClick={resend} disabled={sending} className="auth-banner__btn">
        {sending ? "Se trimite…" : "Retrimite"}
      </button>
      {msg && <span className="auth-banner__msg">{msg}</span>}
    </div>
  )
}
