"use client"

import Link from "next/link"

export type ShopCategory = {
  id: number
  slug: string
  nume: string
  icon?: string | null
}

export function ShopCategoryCards({
  categories,
  activeSlug,
}: {
  categories: ShopCategory[]
  activeSlug?: string | null
}) {
  return (
    <div className="shop-cat-grid">
      <Link
        href="/magazin"
        className={`shop-cat-card ${!activeSlug ? "shop-cat-card--active" : ""}`}
      >
        <div className="shop-cat-card__img-wrap">
          <div className="shop-cat-card__no-img">🛒</div>
        </div>
        <div className="shop-cat-card__name">Toate produsele</div>
      </Link>

      {categories.map((c) => {
        const href = `/magazin?cat=${encodeURIComponent(c.slug)}`
        const isActive = activeSlug === c.slug
        return (
          <Link
            key={c.id}
            href={href}
            className={`shop-cat-card ${isActive ? "shop-cat-card--active" : ""}`}
          >
            <div className="shop-cat-card__img-wrap">
              <div className="shop-cat-card__no-img">{c.icon || "📦"}</div>
            </div>
            <div className="shop-cat-card__name">{c.nume}</div>
          </Link>
        )
      })}
    </div>
  )
}
