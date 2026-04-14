// app/firme/[slug]/page.tsx
// Profil public firmă gaze — versiune minimală MVP.
// Extensii ulterioare: galerie, reviews, contact form, booking inline.
export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

type Params = { slug: string }

async function fetchFirm(slug: string) {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("gas_firms")
    .select(
      "id, slug, brand_name, legal_name, cui, registration_no, plan, description, short_description, " +
      "logo_url, cover_url, phone, phone_secondary, email, website, whatsapp, facebook_url, instagram_url, " +
      "anre_authorization_no, anre_category, anre_valid_until, iscir_authorization_no, iscir_valid_until, " +
      "sediu_adresa, sediu_judet_id, sediu_localitate_id, rating_avg, rating_count, " +
      "judete:sediu_judet_id(nume), localitati:sediu_localitate_id(nume), " +
      "firm_services(service_categories(slug, nume, descriere), price_from, price_to, price_note)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("verification_status", "approved")
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const firm = await fetchFirm(slug)
  if (!firm) return { title: "Firmă negăsită", robots: { index: false } }
  const name = (firm.brand_name as string) || (firm.legal_name as string)
  const j = (Array.isArray(firm.judete) ? firm.judete[0] : firm.judete) as { nume: string } | null
  const subtitle = j?.nume ? `Firmă ANRE — ${j.nume}` : "Firmă autorizată ANRE"
  const description =
    (firm.short_description as string | null) ??
    `${name}: verificări, revizii, montaj detector. Firmă autorizată ANRE${j?.nume ? ` în ${j.nume}` : ""}. Programare online rapidă.`
  const ogUrl = `/og?title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(subtitle)}&badge=${encodeURIComponent("FIRMĂ ANRE")}&type=firma`
  return {
    title: `${name} — firmă autorizată ANRE${j?.nume ? ` în ${j.nume}` : ""}`,
    description,
    alternates: { canonical: `/firme/${slug}` },
    openGraph: {
      title: name,
      description,
      url: `${DOMAIN.baseUrl}/firme/${slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [ogUrl],
    },
  }
}

export default async function FirmProfilePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const firm = await fetchFirm(slug)
  if (!firm) notFound()

  const name = (firm.brand_name as string) || (firm.legal_name as string)
  const j = (Array.isArray(firm.judete) ? firm.judete[0] : firm.judete) as { nume: string } | null
  const l = (Array.isArray(firm.localitati) ? firm.localitati[0] : firm.localitati) as { nume: string } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services = (Array.isArray(firm.firm_services) ? firm.firm_services : []) as any[]

  const breadcrumbs = [
    { label: "Acasă", href: "/" },
    { label: "Firme", href: "/servicii-gaze" },
    { label: name },
  ]

  const localBusinessSchema = localBusinessJsonLd({
    slug: firm.slug as string,
    brandName: (firm.brand_name as string) ?? null,
    legalName: firm.legal_name as string,
    description: (firm.description as string) ?? null,
    shortDescription: (firm.short_description as string) ?? null,
    phone: (firm.phone as string) ?? null,
    email: (firm.email as string) ?? null,
    website: (firm.website as string) ?? null,
    logoUrl: (firm.logo_url as string) ?? null,
    coverUrl: (firm.cover_url as string) ?? null,
    facebookUrl: (firm.facebook_url as string) ?? null,
    instagramUrl: (firm.instagram_url as string) ?? null,
    ratingAvg: typeof firm.rating_avg === "number" ? firm.rating_avg : null,
    ratingCount: typeof firm.rating_count === "number" ? firm.rating_count : null,
    judet: j?.nume ?? null,
    localitate: l?.nume ?? null,
    sediuAdresa: (firm.sediu_adresa as string) ?? null,
    anreAuthorizationNo: (firm.anre_authorization_no as string) ?? null,
  })

  return (
    <div className="firm-page container">
      <JsonLdScript data={[localBusinessSchema, breadcrumbJsonLd(breadcrumbs)]} />
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/">Acasă</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/servicii-gaze">Firme</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{name}</span>
      </nav>

      <header className="firm-hero">
        {firm.cover_url && (
          <img
            className="firm-hero__cover"
            src={firm.cover_url as string}
            alt={`Cover ${name}`}
            width={1200}
            height={400}
          />
        )}
        <div className="firm-hero__main">
          {firm.logo_url && (
            <img
              className="firm-hero__logo"
              src={firm.logo_url as string}
              alt={`Logo ${name}`}
              width={96}
              height={96}
            />
          )}
          <div>
            <h1 className="firm-hero__name">{name}</h1>
            <div className="firm-hero__meta">
              {firm.legal_name && firm.legal_name !== name && (
                <div>{firm.legal_name as string}</div>
              )}
              {j && (
                <div>
                  {l && <>{l.nume}, </>}
                  <Link href={`/servicii-gaze/${slugifyRO(j.nume)}`}>județul {j.nume}</Link>
                </div>
              )}
              {firm.anre_authorization_no && (
                <div className="firm-anre">
                  Autorizație ANRE: <code>{firm.anre_authorization_no as string}</code>
                  {firm.anre_category && <> · categoria {firm.anre_category as string}</>}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="firm-grid">
        <div className="firm-main">
          {firm.description && (
            <section className="firm-section">
              <h2>Despre firmă</h2>
              <p>{firm.description as string}</p>
            </section>
          )}

          {services.length > 0 && (
            <section className="firm-section">
              <h2>Servicii oferite</h2>
              <ul className="firm-services">
                {services.map((s, i) => {
                  const sc = Array.isArray(s.service_categories)
                    ? s.service_categories[0]
                    : s.service_categories
                  if (!sc) return null
                  const priceRange =
                    s.price_from && s.price_to
                      ? `${s.price_from} – ${s.price_to} lei`
                      : s.price_from
                        ? `de la ${s.price_from} lei`
                        : null
                  return (
                    <li key={i} className="firm-service">
                      <div className="firm-service__name">{sc.nume}</div>
                      {sc.descriere && <div className="firm-service__desc">{sc.descriere}</div>}
                      {priceRange && <div className="firm-service__price">{priceRange}</div>}
                      {s.price_note && <div className="firm-service__note">{s.price_note}</div>}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="firm-side">
          <div className="firm-contact">
            <h3>Contact</h3>
            {firm.phone && (
              <a href={`tel:${firm.phone}`} className="firm-chip firm-chip--call">
                Sună: {firm.phone as string}
              </a>
            )}
            {firm.whatsapp && (
              <a
                href={`https://wa.me/${(firm.whatsapp as string).replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="firm-chip firm-chip--wa"
              >
                WhatsApp
              </a>
            )}
            {firm.email && (
              <a href={`mailto:${firm.email}`} className="firm-chip firm-chip--email">
                Email
              </a>
            )}
            {firm.website && (
              <a
                href={firm.website as string}
                target="_blank"
                rel="noreferrer"
                className="firm-chip firm-chip--site"
              >
                Site
              </a>
            )}
            {firm.sediu_adresa && (
              <p className="firm-address">Sediu: {firm.sediu_adresa as string}</p>
            )}
          </div>

          <div className="firm-cta">
            <Link href={`/programare?firma=${encodeURIComponent(slug)}`} className="firm-chip firm-chip--cta">
              Programează online
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
