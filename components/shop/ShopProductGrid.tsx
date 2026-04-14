import { ShopProductCard, type ShopProduct } from "./ShopProductCard"

export function ShopProductGrid({ products }: { products: ShopProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="shop-empty">
        <span className="shop-empty__icon">🛒</span>
        <p>Nu există produse pentru filtrul curent.</p>
      </div>
    )
  }

  return (
    <div className="shop-grid">
      {products.map((p) => (
        <ShopProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
