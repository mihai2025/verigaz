import Link from "next/link"

export type ShopProduct = {
  id: string
  slug: string
  nume: string
  descriere_scurta?: string | null
  price: number
  price_old?: number | null
  currency?: string | null
  image_url?: string | null
  stock?: number | null
  manage_stock?: boolean | null
  is_featured?: boolean | null
  brand?: string | null
  category_id?: number | null
  category_nume?: string | null
  firm_name?: string | null
  firm_slug?: string | null
  firm_logo_url?: string | null
}

function formatLei(v: number) {
  return `${Number(v).toFixed(0)} lei`
}

export function ShopProductCard({ product }: { product: ShopProduct }) {
  const outOfStock = !!product.manage_stock && (product.stock ?? 0) <= 0
  const href = `/magazin/${product.slug}`
  const showOld = product.price_old && product.price_old > product.price

  return (
    <Link href={href} className="shop-card">
      <div className="shop-card__img-wrap">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nume}
            className="shop-card__img"
            loading="lazy"
          />
        ) : (
          <div className="shop-card__no-img">📦</div>
        )}
        {product.is_featured && (
          <span className="shop-badge shop-badge--featured">Recomandat</span>
        )}
        {outOfStock && (
          <span className="shop-badge shop-badge--oos shop-card__stock--out">Stoc epuizat</span>
        )}
      </div>

      <div className="shop-card__body">
        {product.brand && <div className="shop-card__cat">{product.brand}</div>}
        <h3 className="shop-card__name">{product.nume}</h3>
        <div className="shop-card__price">
          {showOld && (
            <span style={{ textDecoration: "line-through", color: "var(--text-500)", fontWeight: 500, marginRight: 6 }}>
              {formatLei(product.price_old!)}
            </span>
          )}
          {formatLei(product.price)}
        </div>
        {product.firm_name && (
          <div className="shop-card__firm">
            {product.firm_logo_url ? (
              <img src={product.firm_logo_url} alt="" className="shop-card__firm-logo" />
            ) : null}
            <span>{product.firm_name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
