// app/verificari-centrala/page.tsx
// Hub național — VTP centrală termică ISCIR.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"

export const metadata: Metadata = {
  title: "Verificare centrală termică (VTP) — firme autorizate în România",
  description:
    "Firme autorizate ISCIR pentru verificarea tehnică periodică a centralei termice. Programare rapidă online, în toată țara.",
  alternates: { canonical: "/verificari-centrala" },
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
        <h1 className="sv-title">Verificare centrală termică (VTP) în România</h1>
        <p className="sv-lead">
          Verificarea tehnică periodică ISCIR a centralei termice — recomandat anual pentru
          siguranță și menținerea garanției producătorului.
        </p>
      </header>

      <section className="sv-section">
        <h2>Alege județul</h2>
        <ul className="sv-judete-grid">
          {list.map((j) => (
            <li key={j.id}>
              <Link href={`/verificari-centrala/${slugifyRO(j.nume)}`} className="sv-judet">
                <span className="sv-judet__name">{j.nume}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
