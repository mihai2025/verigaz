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
import { FirmLogo } from "@/components/firms/FirmLogo"
import { cleanFirmName } from "@/lib/utils/firmInitials"

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

  const displayName = cleanFirmName(name) || name
  const rawLegal = firm.legal_name as string

  return (
    <div className="container" style={{ padding: "24px 16px 56px" }}>
      <JsonLdScript data={[localBusinessSchema, breadcrumbJsonLd(breadcrumbs)]} />
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/">Acasă</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/servicii-gaze">Firme</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{displayName}</span>
      </nav>

      <div className="vg-firm-hero">
        {firm.cover_url ? (
          <img
            className="vg-firm-hero__cover"
            src={firm.cover_url as string}
            alt={`Imagine ${displayName}`}
            width={1200}
            height={260}
          />
        ) : (
          <div className="vg-firm-hero__cover" aria-hidden="true" />
        )}
        <div className="vg-firm-hero__body">
          <div className="vg-firm-hero__logo">
            <FirmLogo
              logoUrl={firm.logo_url as string | null}
              firmName={name}
              size={120}
              alt={`Logo ${displayName}`}
            />
          </div>
          <div>
            <h1 className="vg-firm-hero__name">{displayName}</h1>
            <div className="vg-firm-hero__meta">
              {rawLegal && rawLegal !== displayName && <div><strong>{rawLegal}</strong></div>}
              {j && (
                <div style={{ marginTop: 4 }}>
                  📍 {l && <>{l.nume}, </>}
                  <Link href={`/servicii-gaze/${slugifyRO(j.nume)}`} style={{ color: "var(--accent-600)", fontWeight: 600 }}>
                    județul {j.nume}
                  </Link>
                </div>
              )}
              {firm.anre_authorization_no && (
                <div style={{ marginTop: 8 }}>
                  <span className="dash-status dash-status--approved">
                    ✓ Aut. ANRE {firm.anre_authorization_no as string}
                    {firm.anre_category && <> · {firm.anre_category as string}</>}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="vg-firm-hero__actions">
            <Link href={`/programare?firma=${encodeURIComponent(slug)}`} className="vg-btn vg-btn--primary vg-btn--lg">
              Programează online →
            </Link>
            {firm.phone && (
              <a href={`tel:${firm.phone}`} className="vg-btn vg-btn--outline vg-btn--lg">
                📞 {firm.phone as string}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="vg-firm-grid">
        <div>
          <div className="vg-firm-card">
            <h2>Despre firmă</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-700)", margin: 0 }}>
              {(firm.description as string) ||
                `${displayName} este o firmă autorizată ANRE pentru servicii de verificare, revizie și
                 instalație gaze naturale${j?.nume ? ` în ${j.nume}` : ""}. Autorizația e validată manual
                 de echipa verificari-gaze.ro din registrul oficial ANRE.`}
            </p>
          </div>

          {services.length > 0 && (
            <div className="vg-firm-card">
              <h2>Servicii oferite</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {services.map((s, i) => {
                  const sc = Array.isArray(s.service_categories) ? s.service_categories[0] : s.service_categories
                  if (!sc) return null
                  const priceRange = s.price_from && s.price_to
                    ? `${s.price_from}–${s.price_to} lei`
                    : s.price_from ? `de la ${s.price_from} lei` : null
                  return (
                    <li key={i} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-900)", marginBottom: 4 }}>{sc.nume}</div>
                      {sc.descriere && <div style={{ fontSize: 13, color: "var(--text-600)", marginBottom: 4 }}>{sc.descriere}</div>}
                      {priceRange && <div style={{ color: "var(--accent-700)", fontWeight: 600, fontSize: 14 }}>{priceRange}</div>}
                      {s.price_note && <div style={{ fontSize: 12, color: "var(--text-500)" }}>{s.price_note}</div>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="vg-firm-card" style={{ background: "linear-gradient(135deg, var(--accent-700), var(--accent-600))", color: "#fff", textAlign: "center" }}>
            <h2 style={{ color: "#fff", fontSize: 20 }}>Gata să programezi?</h2>
            <p style={{ opacity: .9, margin: "0 0 16px" }}>
              Formular de 2 minute. {displayName} te contactează în 24h pentru confirmare.
            </p>
            <Link href={`/programare?firma=${encodeURIComponent(slug)}`} className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)" }}>
              Programează verificarea →
            </Link>
          </div>
        </div>

        <aside>
          <div className="vg-firm-card">
            <h2>Contact direct</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {firm.phone && (
                <a href={`tel:${firm.phone}`} className="vg-btn vg-btn--primary" style={{ justifyContent: "flex-start" }}>
                  📞 {firm.phone as string}
                </a>
              )}
              {firm.whatsapp && (
                <a
                  href={`https://wa.me/${(firm.whatsapp as string).replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="vg-btn vg-btn--ghost"
                  style={{ justifyContent: "flex-start", background: "#25d366", color: "#fff", borderColor: "#25d366" }}
                >
                  WhatsApp
                </a>
              )}
              {firm.email && (
                <a href={`mailto:${firm.email}`} className="vg-btn vg-btn--ghost" style={{ justifyContent: "flex-start" }}>
                  ✉ Email
                </a>
              )}
              {firm.website && (
                <a href={firm.website as string} target="_blank" rel="noreferrer" className="vg-btn vg-btn--ghost" style={{ justifyContent: "flex-start" }}>
                  🌐 Site
                </a>
              )}
            </div>
            {firm.sediu_adresa && (
              <p style={{ marginTop: 14, fontSize: 13, color: "var(--text-600)", lineHeight: 1.5 }}>
                📍 <strong>Sediu:</strong> {firm.sediu_adresa as string}
              </p>
            )}
          </div>

          <div className="vg-firm-card">
            <h2>De ce verificari-gaze.ro</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, fontSize: 13 }}>
              <li>✓ Autorizație ANRE validată manual</li>
              <li>✓ Certificat digital cu QR public</li>
              <li>✓ Reminder SMS la scadența următoare</li>
              <li>✓ Fără comision pe intervenție</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
