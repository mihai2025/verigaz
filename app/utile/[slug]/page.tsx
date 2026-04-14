// app/utile/[slug]/page.tsx
// Renderer pentru cele 20 articole SEO + JSON-LD Article + OG dinamic.
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ARTICLES, getArticle, getRelated } from "@/lib/utile/articles"
import { DOMAIN } from "@/lib/config/domain"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld"

type Params = { slug: string }

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return { title: "Articol negăsit", robots: { index: false } }

  const ogUrl = `/og?title=${encodeURIComponent(article.title)}&subtitle=${encodeURIComponent("ghid practic verificari-gaze.ro")}&badge=${encodeURIComponent("GHID")}&type=articol`

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: { canonical: `/utile/${slug}` },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url: `${DOMAIN.baseUrl}/utile/${slug}`,
      type: "article",
      publishedTime: article.publishedAt,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
      images: [ogUrl],
    },
  }
}

function renderParagraph(p: string | { type: string; items?: string[]; text?: string }, idx: number) {
  if (typeof p === "string") {
    return <p key={idx} dangerouslySetInnerHTML={{ __html: p }} />
  }
  if (p.type === "list" && p.items) {
    return (
      <ul key={idx} className="utile-list">
        {p.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    )
  }
  if (p.type === "quote" && p.text) {
    return <blockquote key={idx} className="utile-quote">{p.text}</blockquote>
  }
  return null
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const related = getRelated(article.relatedSlugs)

  const breadcrumbs = [
    { label: "Acasă", href: "/" },
    { label: "Ghiduri utile", href: "/utile" },
    { label: article.title },
  ]

  const ogUrl = `${DOMAIN.baseUrl}/og?title=${encodeURIComponent(article.title)}&badge=${encodeURIComponent("GHID")}&type=articol`

  // Detectează FAQ pe baza secțiunilor cu titlu "Întrebări frecvente" sau marker
  const faqSection = article.sections.find((s) => /^[ÎI]ntreb[aă]ri/i.test(s.heading ?? ""))
  const faqItems = faqSection
    ? extractFaqFromSection(faqSection)
    : []

  const jsonLd = [
    articleJsonLd({
      headline: article.title,
      description: article.metaDescription,
      url: `${DOMAIN.baseUrl}/utile/${slug}`,
      publishedAt: article.publishedAt,
      image: ogUrl,
    }),
    breadcrumbJsonLd(breadcrumbs),
  ]
  if (faqItems.length > 0) jsonLd.push(faqJsonLd(faqItems))

  return (
    <article className="utile-article container container--narrow">
      <JsonLdScript data={jsonLd} />

      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/">Acasă</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/utile">Ghiduri utile</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{article.title}</span>
      </nav>

      <header className="utile-article__header">
        <h1>{article.title}</h1>
        <p className="utile-article__date">
          Actualizat: {new Date(article.publishedAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      <p className="utile-article__intro">{article.intro}</p>

      {article.sections.map((section, i) => (
        <section key={i} className="utile-section">
          {section.heading && <h2>{section.heading}</h2>}
          {section.paragraphs.map((p, j) => renderParagraph(p, j))}
        </section>
      ))}

      {/* CTA-uri inline */}
      <div className="utile-ctas">
        {article.ctas.map((c, i) => (
          <Link key={i} href={c.href} className={`shop-btn shop-btn--${c.variant}`}>
            {c.label}
          </Link>
        ))}
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="utile-related">
          <h2>Articole conexe</h2>
          <ul className="utile-grid">
            {related.map((r) => (
              <li key={r.slug} className="utile-card">
                <Link href={`/utile/${r.slug}`} className="utile-card__link">
                  <h3 className="utile-card__title">{r.title}</h3>
                  <p className="utile-card__excerpt">{r.intro.slice(0, 140)}…</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Final CTA toate paginile */}
      <section className="utile-final-cta">
        <h2>Programează direct cu o firmă autorizată ANRE</h2>
        <p>
          Toate firmele de pe verificari-gaze.ro au autorizația validată de echipa noastră.
          Răspund în 24h, cele mai multe în câteva ore.
        </p>
        <div className="dash-actions-row">
          <Link href="/programare" className="shop-btn shop-btn--primary">
            Programează verificarea
          </Link>
          <Link href="/servicii-gaze" className="shop-btn shop-btn--ghost">
            Vezi firmele din zona ta
          </Link>
        </div>
      </section>
    </article>
  )
}

/** Extrage perechi întrebare/răspuns dintr-o secțiune cu titlu FAQ */
function extractFaqFromSection(
  section: { paragraphs: (string | { type: string; items?: string[]; text?: string })[] },
): { question: string; answer: string }[] {
  // Heuristică simplă: alternate paragrafe sunt Q și A. Sau parsare după ":".
  const out: { question: string; answer: string }[] = []
  for (const p of section.paragraphs) {
    if (typeof p === "string") {
      // Caută pattern "Întrebare? Răspuns."
      const m = p.match(/^(.*\?)\s*(.+)$/s)
      if (m) out.push({ question: m[1].trim(), answer: m[2].trim() })
    }
  }
  return out
}
