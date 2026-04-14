// app/servicii-gaze/page.tsx
// Hub național — linkuri către categorii + top județe.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { CATEGORY_PAGES } from "@/lib/servicii-gaze/links"
import { slugifyRO } from "@/lib/utils/slugify"

export const metadata: Metadata = {
  title: "Servicii gaze în România — firme autorizate ANRE",
  description:
    "Platformă națională pentru verificări, revizii, detectoare și reparații instalații gaze. Firme autorizate ANRE din toată țara.",
  alternates: { canonical: "/servicii-gaze" },
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
        <h1 className="sv-title">Servicii pentru instalații de gaze în România</h1>
        <p className="sv-lead">
          Firme autorizate <strong>ANRE</strong> pentru verificarea obligatorie la 2 ani, revizia la 10 ani,
          montaj detectoare și reparații — la nivel național.
        </p>
      </header>

      <section className="sv-section">
        <h2>Categorii de servicii</h2>
        <ul className="sv-cat-grid">
          {CATEGORY_PAGES.map((c) => (
            <li key={c.slug}>
              <Link href={c.href} className="sv-cat">
                <span className="sv-cat__name">{c.label}</span>
                {c.description && <span className="sv-cat__desc">{c.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="sv-section">
        <h2>Județe</h2>
        <ul className="sv-judete-grid">
          {list.map((j) => (
            <li key={j.id}>
              <Link href={`/servicii-gaze/${slugifyRO(j.nume)}`} className="sv-judet">
                <span className="sv-judet__name">{j.nume}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
