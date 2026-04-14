// app/login/page.tsx
import type { Metadata } from "next"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
  title: "Autentificare — verigaz",
  description: "Intră în contul tău verigaz pentru firme și clienți.",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ redirect?: string; next?: string; signup?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams
  const redirect =
    (typeof sp.redirect === "string" && sp.redirect) ||
    (typeof sp.next === "string" && sp.next) ||
    "/dashboard"
  const defaultMode = sp.signup === "1" ? "signup" : "login"
  return <LoginClient nextUrl={redirect} defaultMode={defaultMode} />
}
