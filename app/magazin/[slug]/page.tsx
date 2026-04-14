// app/magazin/[slug]/page.tsx
// Detaliu produs premium (layout 2-col cu media stânga + detalii dreapta).
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import AddToCartButton from "./AddToCartButton"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

export const dynamic = "force-dynamic"

type Params = { slug: string }

async function fetchProduct(slug: string) {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase
    .from("shop_products")
    .select(
      "id, slug, nume, descriere, descriere_scurta, price, price_old, currency, vat_included, " +
      "stock, manage_stock, image_url, images, specs, certifications, brand, model, sku, " +
      "installation_available, installation_price, is_active, " +
      "shop_categories(slug, nume), " +
      "gas_firms:seller_firm_id(slug, brand_name, legal_name, logo_url)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const p = await fetchProduct(slug)
  if (!p) return { title: "Produs negăsit", robots: { index: false } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyP = p as any
  return {
    title: `${anyP.nume} — magazin verificari-gaze.ro`,
    description: (anyP.descriere_scurta as string | null) ?? `Comandă ${anyP.nume} online de la firme autorizate ANRE.`,
    alternates: { canonical: `/magazin/${slug}` },
    openGraph: anyP.image_url ? { images: [{ url: anyP.image_url as string }] } : undefined,
  }
}

function formatLei(v: number | null | undefined): string {
  if (v == null) return "—"
  const n = Number(v)
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)} lei`
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const p = await fetchProduct(slug)
  if (!p) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyP = p as any
  const cat = Array.isArray(anyP.shop_categories) ? anyP.shop_categories[0] : anyP.shop_categories
  const seller = Array.isArray(anyP.gas_firms) ? anyP.gas_firms[0] : anyP.gas_firms
  const outOfStock = !!anyP.manage_stock && (Number(anyP.stock) || 0) <= 0

  const certifications = Array.isArray(anyP.certifications) ? (anyP.certifications as string[]) : []
  const specs = typeof anyP.specs === "object" && anyP.specs && !Array.isArray(anyP.specs)
    ? Object.entries(anyP.specs as Record<string, unknown>)
    : []

  const breadcrumbs = [
    { label: "Acasă", href: "/" },
    { label: "Magazin", href: "/magazin" },
    ...(cat ? [{ label: cat.nume, href: `/magazin?cat=${cat.slug}` }] : []),
    { label: anyP.nume },
  ]

  const stockLabel = outOfStock
    ? "Stoc epuizat"
    : anyP.manage_stock && (anyP.stock as number) > 0
    ? `În stoc (${anyP.stock})`
    : "În stoc"
  const stockStatus = outOfStock ? "out_of_stock" : "in_stock"

  return (
    <>
      <JsonLdScript data={[
        productJsonLd({
          name: anyP.nume,
          description: (anyP.descriere as string | null) ?? anyP.descriere_scurta,
          imageUrl: anyP.image_url,
          price: Number(anyP.price),
          currency: (anyP.currency as string | null) ?? "RON",
          sku: anyP.sku,
          brand: anyP.brand,
          url: `${DOMAIN.baseUrl}/magazin/${slug}`,
          availability: outOfStock ? "OutOfStock" : "InStock",
          sellerName: seller ? (seller.brand_name || seller.legal_name) : null,
          sellerUrl: seller ? `${DOMAIN.baseUrl}/firme/${seller.slug}` : null,
        }),
        breadcrumbJsonLd(breadcrumbs),
      ]} />

      <div className="shop-container">
        <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
              {i < breadcrumbs.length - 1 && <span className="shop-breadcrumbs__sep">/</span>}
            </span>
          ))}
        </nav>

        <div className="shop-product">
          {/* Stânga: imagine + descriere lungă */}
          <div className="shop-product__media">
            <div className="shop-product__img-wrap">
              {anyP.image_url ? (
                <img
                  src={anyP.image_url as string}
                  alt={anyP.nume as string}
                  className="shop-product__img"
                  loading="eager"
                />
              ) : (
                <div className="shop-card__no-img" style={{ width: "100%", aspectRatio: "1/1" }}>📦</div>
              )}
            </div>

            {anyP.descriere && (
              <div className="shop-product__desc">{anyP.descriere as string}</div>
            )}

            {specs.length > 0 && (
              <div className="shop-product__desc">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 10 }}>Specificații</h3>
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", margin: 0 }}>
                  {specs.map(([k, v]) => (
                    <div key={k} style={{ display: "contents" }}>
                      <dt style={{ fontWeight: 600, color: "var(--text-700)" }}>{k}</dt>
                      <dd style={{ margin: 0, color: "var(--text-600)" }}>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {certifications.length > 0 && (
              <div className="shop-product__desc">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 10 }}>Certificări</h3>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {certifications.map((c) => <li key={c} style={{ marginBottom: 4 }}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Dreapta: detalii + order */}
          <div className="shop-product__details">
            {cat && (
              <Link href={`/magazin?cat=${cat.slug}`} className="shop-product__cat">
                {cat.nume}
              </Link>
            )}

            <h1 className="shop-product__name">{anyP.nume as string}</h1>

            {anyP.brand && (
              <div className="shop-card__cat" style={{ marginBottom: 4 }}>{anyP.brand as string}</div>
            )}
            {anyP.model && (
              <div style={{ fontSize: 13, color: "var(--text-500)", marginBottom: 2 }}>Model: <strong>{anyP.model as string}</strong></div>
            )}
            {anyP.sku && (
              <div style={{ fontSize: 13, color: "var(--text-500)", marginBottom: 10 }}>SKU: <code>{anyP.sku as string}</code></div>
            )}

            <div className="shop-product__price">
              {anyP.price_old && (anyP.price_old as number) > (anyP.price as number) && (
                <span style={{ fontSize: 16, color: "var(--text-500)", textDecoration: "line-through", fontWeight: 500, marginRight: 10 }}>
                  {formatLei(anyP.price_old)}
                </span>
              )}
              {formatLei(anyP.price)}
            </div>
            {anyP.vat_included && (
              <div style={{ fontSize: 12, color: "var(--text-500)", marginTop: -6, marginBottom: 10 }}>TVA inclus</div>
            )}

            <div className="shop-product__stock" data-status={stockStatus}>
              {stockLabel}
            </div>

            {seller && (
              <div className="shop-sold-by">
                {seller.logo_url ? (
                  <img src={seller.logo_url as string} alt="" className="shop-sold-by__logo" />
                ) : null}
                <div className="shop-sold-by__info">
                  <span className="shop-sold-by__label">Vândut de</span>
                  <span className="shop-sold-by__name">
                    <Link href={`/firme/${seller.slug}`} className="shop-sold-by__firm-link">
                      {seller.brand_name || seller.legal_name}
                    </Link>
                  </span>
                </div>
              </div>
            )}

            {!outOfStock ? (
              <AddToCartButton
                product={{
                  productId: anyP.id as string,
                  slug: anyP.slug as string,
                  nume: anyP.nume as string,
                  price: anyP.price as number,
                  imageUrl: (anyP.image_url as string) ?? null,
                  sku: (anyP.sku as string) ?? null,
                }}
              />
            ) : (
              <div className="shop-order-form shop-order-form--disabled">
                <p>Acest produs nu este disponibil momentan.</p>
              </div>
            )}

            {anyP.installation_available && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "var(--accent-50)", border: "1px solid var(--accent-200)", fontSize: 14 }}>
                <strong>🔧 Instalare disponibilă:</strong>{" "}
                {anyP.installation_price ? `+${formatLei(anyP.installation_price)}` : "preț la cerere"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
