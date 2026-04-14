// app/magazin/page.tsx
// Catalog public — hero + card-uri categorii + grid produse (stil ghidulfunerar).
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { ShopCategoryCards, type ShopCategory } from "@/components/shop/ShopCategoryCards"
import { ShopProductGrid } from "@/components/shop/ShopProductGrid"
import type { ShopProduct } from "@/components/shop/ShopProductCard"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ cat?: string; q?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  if (sp.cat) {
    return {
      title: `Magazin — ${sp.cat}`,
      description: `Produse pentru instalații gaze și centrale termice — ${sp.cat}.`,
      alternates: { canonical: `/magazin?cat=${sp.cat}` },
    }
  }
  return {
    title: "Magazin online — detectoare gaze, senzori CO, piese centrală",
    description:
      "Cumpără online detectoare gaze certificate EN50194, senzori CO, electrovalve, piese centrală termică. Firme autorizate ANRE, livrare rapidă.",
    alternates: { canonical: "/magazin" },
    openGraph: {
      title: "Magazin online — verificari-gaze.ro",
      description: "Produse pentru instalații gaze de la firme autorizate ANRE.",
      url: `${DOMAIN.baseUrl}/magazin`,
    },
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = getPublicServerSupabase()

  const [catsRes, productsRes] = await Promise.all([
    supabase
      .from("shop_categories")
      .select("id, slug, nume, icon")
      .eq("is_active", true)
      .order("sort_order"),
    (async () => {
      let q = supabase
        .from("shop_products")
        .select(
          "id, slug, nume, descriere_scurta, price, price_old, image_url, stock, manage_stock, is_featured, brand, category_id, " +
          "shop_categories(nume), gas_firms:seller_firm_id(slug, brand_name, legal_name, logo_url)",
        )
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(48)
      if (sp.cat) {
        const { data: c } = await supabase
          .from("shop_categories")
          .select("id")
          .eq("slug", sp.cat)
          .maybeSingle()
        if (c) q = q.eq("category_id", (c as { id: number }).id)
      }
      if (sp.q) q = q.ilike("nume", `%${sp.q}%`)
      return q
    })(),
  ])

  const categories = ((catsRes.data ?? []) as Array<{
    id: number
    slug: string
    nume: string
    icon: string | null
  }>) as ShopCategory[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: ShopProduct[] = ((productsRes.data ?? []) as any[]).map((p) => {
    const firm = Array.isArray(p.gas_firms) ? p.gas_firms[0] : p.gas_firms
    const cat = Array.isArray(p.shop_categories) ? p.shop_categories[0] : p.shop_categories
    return {
      id: p.id,
      slug: p.slug,
      nume: p.nume,
      descriere_scurta: p.descriere_scurta,
      price: Number(p.price),
      price_old: p.price_old != null ? Number(p.price_old) : null,
      image_url: p.image_url,
      stock: p.stock,
      manage_stock: p.manage_stock,
      is_featured: p.is_featured,
      brand: p.brand,
      category_id: p.category_id,
      category_nume: cat?.nume ?? null,
      firm_name: firm ? (firm.brand_name || firm.legal_name) : null,
      firm_slug: firm?.slug ?? null,
      firm_logo_url: firm?.logo_url ?? null,
    }
  })

  const activeCat = sp.cat ? categories.find((c) => c.slug === sp.cat) : null

  const breadcrumbs = activeCat
    ? [
        { label: "Acasă", href: "/" },
        { label: "Magazin", href: "/magazin" },
        { label: activeCat.nume },
      ]
    : [
        { label: "Acasă", href: "/" },
        { label: "Magazin" },
      ]

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd(breadcrumbs)]} />

      <section className="shop-hero">
        <h1 className="shop-hero__title">{activeCat?.nume ?? "Magazin online"}</h1>
        <p className="shop-hero__sub">
          {activeCat
            ? `Produse ${activeCat.nume.toLowerCase()} de la firme autorizate ANRE.`
            : "Detectoare gaze certificate, senzori CO, piese centrală — de la firme autorizate ANRE, cu livrare rapidă în toată România."}
        </p>
        <form method="get" action="/magazin" className="shop-search" style={{ maxWidth: 480, margin: "20px auto 0", display: "flex", gap: 8 }}>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Caută produs (ex: detector, senzor CO, electrovalva)…"
            className="shop-form-input"
            style={{ flex: 1, height: 46, padding: "0 16px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 15 }}
          />
          {sp.cat && <input type="hidden" name="cat" value={sp.cat} />}
          <button type="submit" className="vg-btn vg-btn--primary" style={{ height: 46, padding: "0 20px" }}>
            Caută
          </button>
        </form>
      </section>

      <div className="shop-container">
        <ShopCategoryCards categories={categories} activeSlug={sp.cat ?? null} />

        <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
              {i < breadcrumbs.length - 1 && <span className="shop-breadcrumbs__sep">/</span>}
            </span>
          ))}
        </nav>

        <ShopProductGrid products={products} />
      </div>
    </>
  )
}
