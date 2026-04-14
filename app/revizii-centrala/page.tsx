// app/revizii-centrala/page.tsx
// Hub național — revizie centrală termică.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"

export const metadata: Metadata = {
  title: "Revizie centrală termică — firme autorizate în România",
  description:
    "Revizie completă a centralei termice: curățare, calibrare, verificare senzori și presiune. Firme autorizate în toată țara.",
  alternates: { canonical: "/revizii-centrala" },
}

export default async function Page() {
  const supabase = getPublicServerSupabase()
  const { data: judete } = await supabase
    .from("judete")
    .select("id, nume, slug")
    .order("nume")

  const list = (judete ?? []) as unknown as { id: number; nume: string; slug: string }[]

  return (
    <div className="sv-page container">
      <header className="sv-hero">
        <h1 className="sv-title">Revizie centrală termică în România</h1>
        <p className="sv-lead">
          Revizia anuală e recomandată de toți producătorii — fără ea se poate pierde garanția.
          Alege județul pentru a găsi o firmă în zonă.
        </p>
      </header>

      <section className="sv-section">
        <h2>Alege județul</h2>
        <ul className="sv-judete-grid">
          {list.map((j) => (
            <li key={j.id}>
              <Link href={`/revizii-centrala/${slugifyRO(j.nume)}`} className="sv-judet">
                <span className="sv-judet__name">{j.nume}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
