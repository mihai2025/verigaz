// app/servicii/[cat]/page.tsx
// Landing național pentru o categorie de serviciu.
export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { resolveCategory } from "@/lib/firms/fetchByGeo"
import { slugifyRO } from "@/lib/utils/slugify"

type Params = { cat: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { cat } = await params
  const category = await resolveCategory(cat)
  if (!category) return { title: "Pagină negăsită", robots: { index: false } }
  return {
    title: `${category.nume} – firme autorizate în România`,
    description: category.descriere ?? `Firme autorizate pentru ${category.nume.toLowerCase()}.`,
    alternates: { canonical: `/servicii/${cat}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { cat } = await params
  const category = await resolveCategory(cat)
  if (!category) notFound()

  const supabase = getPublicServerSupabase()

  // Top județe cu firme care oferă această categorie
  const { data: firmsGeo } = await supabase
    .from("gas_firms")
    .select("sediu_judet_id, judete:sediu_judet_id(nume), firm_services!inner(service_category_id)")
    .eq("is_active", true)
    .eq("verification_status", "approved")
    .eq("firm_services.service_category_id", category.id)
    .limit(1000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const judetCounts = new Map<number, { nume: string; count: number }>()
  for (const f of (firmsGeo ?? []) as unknown as Array<{
    sediu_judet_id: number | null
    judete: { nume: string } | { nume: string }[] | null
  }>) {
    if (f.sediu_judet_id == null) continue
    const j = Array.isArray(f.judete) ? f.judete[0] : f.judete
    if (!j) continue
    const cur = judetCounts.get(f.sediu_judet_id)
    if (cur) cur.count += 1
    else judetCounts.set(f.sediu_judet_id, { nume: j.nume, count: 1 })
  }
  const topJudete = [...judetCounts.values()].sort((a, b) => b.count - a.count).slice(0, 20)

  return (
    <div className="sv-page container">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/">Acasă</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/servicii">Servicii</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{category.nume}</span>
      </nav>

      <header className="sv-hero">
        <h1 className="sv-title">{category.nume} — firme autorizate în România</h1>
        <p className="sv-lead">
          {category.descriere ?? `Găsește firme autorizate pentru ${category.nume.toLowerCase()}.`}
        </p>
      </header>

      {topJudete.length === 0 ? (
        <div className="sv-empty">
          <p>Nu avem încă firme verificate pentru acest serviciu.</p>
        </div>
      ) : (
        <section className="sv-section">
          <h2>Alege județul</h2>
          <ul className="sv-judete-grid">
            {topJudete.map((j) => (
              <li key={j.nume}>
                <Link href={`/servicii/${cat}/${slugifyRO(j.nume)}`} className="sv-judet">
                  <span className="sv-judet__name">{j.nume}</span>
                  <span className="sv-judet__count">{j.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
