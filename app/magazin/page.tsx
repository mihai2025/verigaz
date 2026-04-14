// app/magazin/page.tsx
// Catalog public — produse grupate pe categorie cu linkuri la detaliu.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Magazin verigaz — detectoare gaze, senzori CO, piese centrală",
  description:
    "Detectoare gaze certificate EN50194, senzori CO, electrovalve, piese centrală termică. Livrare rapidă în toată țara.",
  alternates: { canonical: "/magazin" },
}

type Props = { searchParams: Promise<{ cat?: string; q?: string }> }

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = getPublicServerSupabase()

  const [catsRes, productsRes] = await Promise.all([
    supabase
      .from("shop_categories")
      .select("id, slug, nume, descriere")
      .eq("is_active", true)
      .order("sort_order"),
    (async () => {
      let q = supabase
        .from("shop_products")
        .select("id, slug, nume, descriere_scurta, price, price_old, image_url, stock, manage_stock, is_featured, category_id, brand")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(120)
      if (sp.cat) {
        const { data: c } = await supabase
          .from("shop_categories")
          .select("id")
          .eq("slug", sp.cat)
          .maybeSingle()
        if (c) q = q.eq("category_id", c.id)
      }
      if (sp.q) q = q.ilike("nume", `%${sp.q}%`)
      return q
    })(),
  ])

  const categories = (catsRes.data ?? []) as { id: number; slug: string; nume: string; descriere: string | null }[]
  const products = (productsRes.data ?? []) as Array<{
    id: string; slug: string; nume: string; descriere_scurta: string | null
    price: number; price_old: number | null; image_url: string | null
    stock: number; manage_stock: boolean; is_featured: boolean
    category_id: number | null; brand: string | null
  }>

  const activeCat = sp.cat ? categories.find((c) => c.slug === sp.cat) : null

  return (
    <div className="shop-page container">
      <header className="shop-hero">
        <h1 className="shop-title">{activeCat?.nume ?? "Magazin verigaz"}</h1>
        <p className="shop-lead">
          {activeCat?.descriere ??
            "Detectoare gaze certificate, senzori CO, piese centrală — produse selectate pentru siguranța instalației tale."}
        </p>
        <form method="get" action="/magazin" className="shop-search">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Caută produs…" />
          {sp.cat && <input type="hidden" name="cat" value={sp.cat} />}
          <button type="submit">Caută</button>
        </form>
      </header>

      <nav className="shop-cats">
        <Link href="/magazin" className={`shop-cat ${!sp.cat ? "shop-cat--active" : ""}`}>Toate</Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/magazin?cat=${c.slug}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
            className={`shop-cat ${sp.cat === c.slug ? "shop-cat--active" : ""}`}
          >
            {c.nume}
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="shop-empty">Nu găsim produse pentru filtrul curent.</p>
      ) : (
        <ul className="shop-grid">
          {products.map((p) => {
            const outOfStock = p.manage_stock && p.stock <= 0
            return (
              <li key={p.id} className={`shop-card ${outOfStock ? "shop-card--oos" : ""}`}>
                <Link href={`/magazin/${p.slug}`} className="shop-card__link">
                  <div className="shop-card__img">
                    <img
                      src={p.image_url || "/imagini/noimage.webp"}
                      alt={p.nume}
                      width={360}
                      height={360}
                      loading="lazy"
                    />
                    {p.is_featured && <span className="shop-badge shop-badge--featured">Recomandat</span>}
                    {outOfStock && <span className="shop-badge shop-badge--oos">Stoc epuizat</span>}
                  </div>
                  <div className="shop-card__body">
                    {p.brand && <div className="shop-card__brand">{p.brand}</div>}
                    <h3 className="shop-card__name">{p.nume}</h3>
                    {p.descriere_scurta && <p className="shop-card__desc">{p.descriere_scurta}</p>}
                    <div className="shop-card__prices">
                      {p.price_old && p.price_old > p.price && (
                        <span className="shop-card__price-old">{p.price_old} lei</span>
                      )}
                      <span className="shop-card__price">{p.price} lei</span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
