// app/firme/[slug]/page.tsx
// Profil public firmă — layout ghidulfunerar-style: aside desktop, stack mobile,
// sticky bottom CTA pe mobil (Sună + WhatsApp + social), sticky header top mobil.
export const revalidate = 3600

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import { cleanFirmName } from "@/lib/utils/firmInitials"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"
import FirmaClient, { type FirmaClientData } from "./FirmaClient"

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = firm as any
  const name = (f.brand_name as string) || (f.legal_name as string)
  const displayName = cleanFirmName(name) || name
  const j = (Array.isArray(f.judete) ? f.judete[0] : f.judete) as { nume: string } | null
  const l = (Array.isArray(f.localitati) ? f.localitati[0] : f.localitati) as { nume: string } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firmServices = (Array.isArray(f.firm_services) ? f.firm_services : []) as any[]
  const services = firmServices
    .map((s) => {
      const sc = Array.isArray(s.service_categories) ? s.service_categories[0] : s.service_categories
      if (!sc) return null
      return {
        nume: sc.nume as string,
        descriere: (sc.descriere as string | null) ?? null,
        price_from: s.price_from != null ? Number(s.price_from) : null,
        price_to: s.price_to != null ? Number(s.price_to) : null,
        price_note: (s.price_note as string | null) ?? null,
      }
    })
    .filter(Boolean) as FirmaClientData["services"]

  const data: FirmaClientData = {
    firm: {
      id: f.id as string,
      slug: f.slug as string,
      name: displayName,
      legal_name: f.legal_name as string,
      cui: (f.cui as string | null) ?? null,
      logo_url: (f.logo_url as string | null) ?? null,
      cover_url: (f.cover_url as string | null) ?? null,
      description: (f.description as string | null) ?? null,
      short_description: (f.short_description as string | null) ?? null,
      phone: (f.phone as string | null) ?? null,
      whatsapp: (f.whatsapp as string | null) ?? null,
      email: (f.email as string | null) ?? null,
      website: (f.website as string | null) ?? null,
      facebook_url: (f.facebook_url as string | null) ?? null,
      instagram_url: (f.instagram_url as string | null) ?? null,
      sediu_adresa: (f.sediu_adresa as string | null) ?? null,
      sediu_localitate_nume: l?.nume ?? null,
      sediu_judet_nume: j?.nume ?? null,
      sediu_judet_slug: j?.nume ? slugifyRO(j.nume) : null,
      anre_authorization_no: (f.anre_authorization_no as string | null) ?? null,
      anre_category: (f.anre_category as string | null) ?? null,
      anre_valid_until: (f.anre_valid_until as string | null) ?? null,
      rating_avg: typeof f.rating_avg === "number" ? f.rating_avg : null,
      rating_count: typeof f.rating_count === "number" ? f.rating_count : null,
      plan: (f.plan as string | null) ?? "free",
    },
    services,
  }

  const breadcrumbs = [
    { label: "Acasă", href: "/" },
    { label: "Firme", href: "/servicii-gaze" },
    { label: displayName },
  ]

  const localBusinessSchema = localBusinessJsonLd({
    slug: f.slug as string,
    brandName: (f.brand_name as string) ?? null,
    legalName: f.legal_name as string,
    description: (f.description as string) ?? null,
    shortDescription: (f.short_description as string) ?? null,
    phone: (f.phone as string) ?? null,
    email: (f.email as string) ?? null,
    website: (f.website as string) ?? null,
    logoUrl: (f.logo_url as string) ?? null,
    coverUrl: (f.cover_url as string) ?? null,
    facebookUrl: (f.facebook_url as string) ?? null,
    instagramUrl: (f.instagram_url as string) ?? null,
    ratingAvg: typeof f.rating_avg === "number" ? f.rating_avg : null,
    ratingCount: typeof f.rating_count === "number" ? f.rating_count : null,
    judet: j?.nume ?? null,
    localitate: l?.nume ?? null,
    sediuAdresa: (f.sediu_adresa as string) ?? null,
    anreAuthorizationNo: (f.anre_authorization_no as string) ?? null,
  })

  return (
    <>
      <JsonLdScript data={[localBusinessSchema, breadcrumbJsonLd(breadcrumbs)]} />
      <FirmaClient data={data} />
    </>
  )
}
