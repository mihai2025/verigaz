// app/inregistrare/page.tsx
// /inregistrare trimite vizitatorul direct în modul "signup" al LoginClient,
// cu opțiunea implicită "cont firmă" când vine din CTA-urile de listing.
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{ firm?: string; redirect?: string }>
}

export default async function InregistrarePage({ searchParams }: Props) {
  const sp = await searchParams
  const params = new URLSearchParams()
  params.set("signup", "1")
  if (sp.firm === "1" || sp.firm === "true") params.set("as", "firm")
  if (typeof sp.redirect === "string" && sp.redirect) params.set("redirect", sp.redirect)
  redirect(`/login?${params.toString()}`)
}
