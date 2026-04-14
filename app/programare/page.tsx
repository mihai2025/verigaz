// app/programare/page.tsx
// Formular public de programare — firma și/sau serviciul pot fi pre-selectate prin query.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import ProgramareClient from "./ProgramareClient"

export const metadata: Metadata = {
  title: "Programează o verificare sau revizie gaze — verigaz",
  description:
    "Programează rapid online o firmă autorizată ANRE pentru verificare, revizie, montaj detector sau centrală termică. Confirmare prin SMS/email.",
  alternates: { canonical: "/programare" },
}

type Props = {
  searchParams: Promise<{ firma?: string; serviciu?: string; judet?: string; localitate?: string }>
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = getPublicServerSupabase()

  const [firmRes, categoriesRes, judeteRes] = await Promise.all([
    sp.firma
      ? supabase
          .from("gas_firms")
          .select("id, slug, brand_name, legal_name, short_description, sediu_judet_id, sediu_localitate_id")
          .eq("slug", sp.firma)
          .eq("is_active", true)
          .eq("verification_status", "approved")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("service_categories")
      .select("id, slug, nume")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("judete").select("id, nume").order("nume"),
  ])

  const firm = firmRes.data as
    | { id: string; slug: string; brand_name: string | null; legal_name: string; short_description: string | null; sediu_judet_id: number | null; sediu_localitate_id: number | null }
    | null
  const categories = (categoriesRes.data ?? []) as { id: number; slug: string; nume: string }[]
  const judete = (judeteRes.data ?? []) as { id: number; nume: string }[]

  return (
    <div className="booking-page container">
      <header className="booking-hero">
        <h1 className="booking-title">Programează o intervenție</h1>
        <p className="booking-lead">
          Completează datele. Firma te contactează pentru confirmare, de obicei în 24h
          (mai repede în orele de program).
        </p>
      </header>

      {sp.firma && !firm && (
        <div className="booking-warning">
          Firma solicitată nu mai e disponibilă. Poți continua fără firmă preselectată{" "}
          sau <Link href="/servicii-gaze">alege alta din listă</Link>.
        </div>
      )}

      <ProgramareClient
        firm={firm}
        categories={categories}
        judete={judete}
        defaultCategorySlug={sp.serviciu ?? firm ? undefined : "verificare-instalatie"}
        defaultJudetSlug={sp.judet ?? null}
        defaultLocalitateSlug={sp.localitate ?? null}
      />
    </div>
  )
}
