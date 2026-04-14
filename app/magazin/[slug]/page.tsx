// app/magazin/[slug]/page.tsx
// Detaliu produs + add to cart.
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import AddToCartButton from "./AddToCartButton"

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
      "gas_firms:seller_firm_id(slug, brand_name, legal_name)",
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
  return {
    title: `${p.nume as string} — magazin verigaz`,
    description: (p.descriere_scurta as string | null) ?? `Comandă ${p.nume as string} online.`,
    alternates: { canonical: `/magazin/${slug}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const p = await fetchProduct(slug)
  if (!p) notFound()

  const cat = Array.isArray(p.shop_categories) ? p.shop_categories[0] : p.shop_categories
  const seller = Array.isArray(p.gas_firms) ? p.gas_firms[0] : p.gas_firms
  const outOfStock = (p.manage_stock as boolean) && (p.stock as number) <= 0

  const certifications = Array.isArray(p.certifications) ? (p.certifications as string[]) : []
  const specs = typeof p.specs === "object" && p.specs && !Array.isArray(p.specs)
    ? Object.entries(p.specs as Record<string, unknown>)
    : []

  return (
    <div className="shop-detail container">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        <Link href="/">Acasă</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/magazin">Magazin</Link>
        {cat && (
          <>
            <span aria-hidden="true"> / </span>
            <Link href={`/magazin?cat=${cat.slug}`}>{cat.nume}</Link>
          </>
        )}
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{p.nume as string}</span>
      </nav>

      <div className="shop-detail__grid">
        <div className="shop-detail__media">
          <img
            src={(p.image_url as string) || "/imagini/noimage.webp"}
            alt={p.nume as string}
            width={720}
            height={720}
            loading="eager"
          />
        </div>

        <div className="shop-detail__main">
          {p.brand && <div className="shop-card__brand">{p.brand as string}</div>}
          <h1 className="shop-detail__title">{p.nume as string}</h1>
          {p.model && <p className="dash-subtle">Model: {p.model as string}</p>}
          {p.sku && <p className="dash-subtle">SKU: <code>{p.sku as string}</code></p>}

          <div className="shop-detail__prices">
            {p.price_old && (p.price_old as number) > (p.price as number) && (
              <span className="shop-card__price-old">{p.price_old as number} lei</span>
            )}
            <span className="shop-detail__price">{p.price as number} {p.currency as string}</span>
            {p.vat_included && <span className="dash-subtle">TVA inclus</span>}
          </div>

          {outOfStock ? (
            <p className="shop-empty">Stoc epuizat</p>
          ) : (
            <AddToCartButton
              product={{
                productId: p.id as string,
                slug: p.slug as string,
                nume: p.nume as string,
                price: p.price as number,
                imageUrl: (p.image_url as string) ?? null,
                sku: (p.sku as string) ?? null,
              }}
            />
          )}

          {certifications.length > 0 && (
            <div className="shop-detail__cert">
              <h3>Certificări</h3>
              <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}

          {p.installation_available && (
            <div className="shop-detail__install">
              <strong>Instalare disponibilă:</strong>{" "}
              {p.installation_price ? `+${p.installation_price as number} lei` : "preț la cerere"}
            </div>
          )}

          {seller && (
            <div className="shop-detail__seller">
              Vândut de: <Link href={`/firme/${seller.slug}`}>{seller.brand_name || seller.legal_name}</Link>
            </div>
          )}
        </div>
      </div>

      {p.descriere && (
        <section className="shop-detail__desc">
          <h2>Descriere</h2>
          <p>{p.descriere as string}</p>
        </section>
      )}

      {specs.length > 0 && (
        <section className="shop-detail__specs">
          <h2>Specificații</h2>
          <dl>
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}
