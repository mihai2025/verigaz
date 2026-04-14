"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

type Mode = "login" | "signup" | "reset"

export default function LoginClient({
  nextUrl,
  defaultMode = "login",
}: {
  nextUrl: string
  defaultMode?: Mode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [asFirm, setAsFirm] = useState(searchParams.get("as") === "firm")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setNotice(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    router.push(nextUrl)
    router.refresh()
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setNotice(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          intended_role: asFirm ? "firm" : "user",
        },
      },
    })
    setLoading(false)
    if (error) return setError(error.message)
    if (data.user && !data.session) {
      setNotice("Cont creat. Confirmă email-ul din mesajul trimis pentru a intra în cont.")
    } else {
      router.push(nextUrl)
      router.refresh()
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setNotice(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })
    setLoading(false)
    if (error) return setError(error.message)
    setNotice("Ți-am trimis un link pentru resetarea parolei.")
  }

  const titles = {
    login: "Autentificare",
    signup: asFirm ? "Înregistrare firmă" : "Creează cont",
    reset: "Recuperare parolă",
  }
  const intros = {
    login: "Intră în contul tău pentru a vedea programările și documentele.",
    signup: asFirm
      ? "Înregistrează-ți firma autorizată ANRE în directorul nostru național."
      : "Creează cont pentru a programa verificări și a primi certificat digital.",
    reset: "Introdu email-ul — îți trimitem link-ul de resetare.",
  }

  return (
    <div className="vg-auth-page">
      <div className="vg-auth-card">
        <h1>{titles[mode]}</h1>
        <p className="vg-auth-intro">{intros[mode]}</p>

        {error && <div className="vg-auth-error" role="alert">{error}</div>}
        {notice && <div className="vg-auth-notice">{notice}</div>}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="vg-auth-form">
            <label className="vg-auth-field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="vg-auth-field">
              <span>Parolă</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
            <button type="submit" disabled={loading} className="vg-auth-btn">
              {loading ? "Se autentifică…" : "Intră în cont"}
            </button>
            <div className="vg-auth-actions">
              <button type="button" onClick={() => setMode("reset")} className="vg-auth-link">
                Am uitat parola
              </button>
              <button type="button" onClick={() => setMode("signup")} className="vg-auth-link">
                Creează cont
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="vg-auth-form">
            <label className="vg-auth-field">
              <span>Nume complet</span>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </label>
            <label className="vg-auth-field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="vg-auth-field">
              <span>Telefon</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="07..." />
            </label>
            <label className="vg-auth-field">
              <span>Parolă (min. 8 caractere)</span>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </label>

            <label className="vg-auth-checkbox">
              <input type="checkbox" checked={asFirm} onChange={(e) => setAsFirm(e.target.checked)} />
              <span>Sunt reprezentantul unei firme autorizate ANRE</span>
            </label>

            <button type="submit" disabled={loading} className="vg-auth-btn">
              {loading ? "Se creează contul…" : asFirm ? "Înregistrează firma" : "Creează cont"}
            </button>
            <div className="vg-auth-actions">
              <button type="button" onClick={() => setMode("login")} className="vg-auth-link">
                ← Am deja cont
              </button>
            </div>
            <p className="vg-auth-legal">
              Prin crearea contului accepți <Link href="/termeni">Termenii</Link> și{" "}
              <Link href="/confidentialitate">Politica de confidențialitate</Link>.
            </p>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleReset} className="vg-auth-form">
            <label className="vg-auth-field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <button type="submit" disabled={loading} className="vg-auth-btn">
              {loading ? "Se trimite…" : "Trimite link de resetare"}
            </button>
            <div className="vg-auth-actions">
              <button type="button" onClick={() => setMode("login")} className="vg-auth-link">
                ← Înapoi la autentificare
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
