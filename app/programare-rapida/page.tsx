// app/programare-rapida/page.tsx
// Formular rapid de programare — varianta scurtă folosită de linkurile din SMS.
// Doar 5 câmpuri: nume, telefon, data, ora, observații. Firma + serviciul vin
// din query string. Pentru PJ / date complexe, folosește /programare.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import ProgramareRapidaClient from "./ProgramareRapidaClient"

export const metadata: Metadata = {
  title: "Programează rapid — verificări și revizii gaze",
  description: "Completează cele 5 câmpuri și firma te contactează pentru confirmare.",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ firma?: string; serviciu?: string }>
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = getPublicServerSupabase()

  const [firmRes, catRes] = await Promise.all([
    sp.firma
      ? supabase
          .from("gas_firms")
          .select("id, slug, brand_name, legal_name, short_description, phone")
          .eq("slug", sp.firma)
          .eq("is_active", true)
          .eq("verification_status", "approved")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    sp.serviciu
      ? supabase
          .from("service_categories")
          .select("slug, nume")
          .eq("slug", sp.serviciu)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const firm = firmRes.data as
    | { id: string; slug: string; brand_name: string | null; legal_name: string; short_description: string | null; phone: string | null }
    | null
  const category = catRes.data as { slug: string; nume: string } | null

  if (!firm) {
    return (
      <div className="booking-page container">
        <header className="booking-hero">
          <h1 className="booking-title">Programează rapid</h1>
          <p className="booking-lead">
            Acest link are nevoie de o firmă preselectată. {" "}
            <Link href="/servicii-gaze">Alege o firmă din listă</Link> și continuă cu
            formularul complet.
          </p>
        </header>
      </div>
    )
  }

  return (
    <div className="booking-page container">
      <header className="booking-hero">
        <h1 className="booking-title">Programare pentru {firm.brand_name || firm.legal_name}</h1>
        <p className="booking-lead">
          Completează cele 5 câmpuri — firma te contactează pentru confirmare.
        </p>
      </header>
      <ProgramareRapidaClient firm={firm} category={category} />
    </div>
  )
}
