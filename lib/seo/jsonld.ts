// lib/seo/jsonld.ts
// Generatoare schema.org pentru rich snippets în Google SERP.
// Pentru integrare: include rezultatul ca <script type="application/ld+json">.
import { DOMAIN } from "@/lib/config/domain"

const BASE = DOMAIN.baseUrl.replace(/\/+$/, "")

export type JsonLd = Record<string, unknown>

/**
 * Organization + WebSite cu SearchAction — punere pe home pentru:
 *  - Brand sitelinks
 *  - Search box în SERP (Google "Sitelinks Search Box")
 */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE}/#organization`,
    name: DOMAIN.brandName,
    url: BASE,
    logo: `${BASE}/imagini/logo.png`,
    description: DOMAIN.metaDescription,
    sameAs: [
      DOMAIN.facebookUrl,
    ].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      email: DOMAIN.contactEmail,
      contactType: "customer service",
      areaServed: "RO",
      availableLanguage: ["Romanian"],
    },
  }
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE}/#website`,
    name: DOMAIN.brandName,
    url: BASE,
    inLanguage: "ro-RO",
    publisher: { "@id": `${BASE}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE}/cauta?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }
}

export function breadcrumbJsonLd(items: { label: string; href?: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      ...(item.href ? { item: item.href.startsWith("http") ? item.href : `${BASE}${item.href}` } : {}),
    })),
  }
}

export type LocalBusinessFirm = {
  slug: string
  brandName: string | null
  legalName: string
  description: string | null
  shortDescription: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  coverUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  ratingAvg: number | null
  ratingCount: number | null
  judet: string | null
  localitate: string | null
  sediuAdresa: string | null
  anreAuthorizationNo: string | null
}

export function localBusinessJsonLd(firm: LocalBusinessFirm): JsonLd {
  const url = `${BASE}/firme/${firm.slug}`
  const sameAs = [firm.website, firm.facebookUrl, firm.instagramUrl].filter(Boolean) as string[]
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#firm`,
    name: firm.brandName || firm.legalName,
    legalName: firm.legalName,
    url,
    description: firm.description ?? firm.shortDescription ?? undefined,
    image: firm.coverUrl ?? firm.logoUrl ?? undefined,
    logo: firm.logoUrl ?? undefined,
    telephone: firm.phone ?? undefined,
    email: firm.email ?? undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    address: firm.sediuAdresa || firm.localitate || firm.judet
      ? {
          "@type": "PostalAddress",
          streetAddress: firm.sediuAdresa ?? undefined,
          addressLocality: firm.localitate ?? undefined,
          addressRegion: firm.judet ?? undefined,
          addressCountry: "RO",
        }
      : undefined,
    areaServed: firm.judet ? { "@type": "State", name: firm.judet } : undefined,
    identifier: firm.anreAuthorizationNo
      ? [{ "@type": "PropertyValue", propertyID: "ANRE", value: firm.anreAuthorizationNo }]
      : undefined,
  }
  if (firm.ratingAvg && firm.ratingCount && firm.ratingCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: firm.ratingAvg,
      reviewCount: firm.ratingCount,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return prune(data)
}

export type ServiceJsonLdInput = {
  serviceName: string
  description: string
  provider?: { name: string; slug: string } | null
  areaServed?: { judet?: string; localitate?: string }
  url: string
  priceRange?: string  // ex: "80-250 RON"
}

export function serviceJsonLd(input: ServiceJsonLdInput): JsonLd {
  return prune({
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.serviceName,
    description: input.description,
    serviceType: "Verificare instalație gaze",
    url: input.url,
    areaServed: input.areaServed?.localitate
      ? { "@type": "City", name: input.areaServed.localitate }
      : input.areaServed?.judet
        ? { "@type": "State", name: input.areaServed.judet }
        : { "@type": "Country", name: "Romania" },
    provider: input.provider
      ? {
          "@type": "Organization",
          name: input.provider.name,
          url: `${BASE}/firme/${input.provider.slug}`,
        }
      : { "@type": "Organization", name: DOMAIN.brandName, url: BASE },
    ...(input.priceRange ? { offers: { "@type": "AggregateOffer", priceCurrency: "RON", priceSpecification: { "@type": "PriceSpecification", price: input.priceRange } } } : {}),
  })
}

export type ProductJsonLdInput = {
  name: string
  description: string
  image: string | null
  sku: string | null
  brand: string | null
  url: string
  price: number
  currency: string
  inStock: boolean
}

export function productJsonLd(input: ProductJsonLdInput): JsonLd {
  return prune({
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image ?? undefined,
    sku: input.sku ?? undefined,
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    url: input.url,
    offers: {
      "@type": "Offer",
      priceCurrency: input.currency,
      price: input.price,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: input.url,
    },
  })
}

export type ArticleJsonLdInput = {
  headline: string
  description: string
  url: string
  publishedAt: string
  image?: string
  authorName?: string
}

export function articleJsonLd(input: ArticleJsonLdInput): JsonLd {
  return prune({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    image: input.image,
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    author: { "@type": "Organization", name: input.authorName ?? DOMAIN.brandName },
    publisher: {
      "@type": "Organization",
      name: DOMAIN.brandName,
      logo: { "@type": "ImageObject", url: `${BASE}/imagini/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  })
}

export type FaqItem = { question: string; answer: string }

export function faqJsonLd(items: FaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  }
}

/** Strip undefined recursively (schema.org validatorul detestă null/undefined) */
function prune<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(prune).filter((v) => v !== undefined) as unknown as T
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue
      const pv = prune(v)
      if (pv !== undefined) out[k] = pv
    }
    return out as T
  }
  return obj
}

/**
 * Component pentru injectare JSON-LD în pagini Next.js.
 * Folosire: <JsonLdScript data={[organizationJsonLd(), websiteJsonLd()]} />
 */
export function jsonLdScriptHtml(data: JsonLd | JsonLd[]): string {
  const arr = Array.isArray(data) ? data : [data]
  return arr.map((d) => JSON.stringify(d, null, 0)).join("</script><script type=\"application/ld+json\">")
}
