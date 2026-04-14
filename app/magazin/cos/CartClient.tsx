"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { cartSubtotal, readCart, removeFromCart, updateQty, type CartItem } from "@/lib/shop/cart"

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setItems(readCart())
    setLoaded(true)
    const onChange = () => setItems(readCart())
    window.addEventListener("verigaz:cart:changed", onChange)
    return () => window.removeEventListener("verigaz:cart:changed", onChange)
  }, [])

  if (!loaded) return null

  if (items.length === 0) {
    return (
      <div className="shop-empty">
        <p>Coșul e gol. <Link href="/magazin">Vezi produsele →</Link></p>
      </div>
    )
  }

  const subtotal = cartSubtotal(items)

  return (
    <>
      <ul className="cart-list">
        {items.map((i) => (
          <li key={i.productId} className="cart-item">
            <img
              src={i.imageUrl || "/imagini/noimage.webp"}
              alt={i.nume}
              width={80}
              height={80}
              loading="lazy"
            />
            <div className="cart-item__body">
              <Link href={`/magazin/${i.slug}`} className="cart-item__name">{i.nume}</Link>
              {i.sku && <div className="dash-subtle">SKU: {i.sku}</div>}
              <div className="cart-item__price">{i.price} lei × {i.qty} = <strong>{(i.price * i.qty).toFixed(2)} lei</strong></div>
            </div>
            <div className="cart-item__qty">
              <button type="button" onClick={() => setItems(updateQty(i.productId, i.qty - 1))}>−</button>
              <input
                type="number"
                min={0}
                max={99}
                value={i.qty}
                onChange={(e) => setItems(updateQty(i.productId, Math.max(0, Math.min(99, Number(e.target.value) || 0))))}
              />
              <button type="button" onClick={() => setItems(updateQty(i.productId, i.qty + 1))}>+</button>
              <button
                type="button"
                className="shop-btn shop-btn--ghost"
                onClick={() => setItems(removeFromCart(i.productId))}
              >
                Șterge
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-summary">
        <div>Subtotal: <strong>{subtotal.toFixed(2)} lei</strong></div>
        <Link href="/magazin/checkout" className="shop-btn shop-btn--primary">
          Finalizează comanda →
        </Link>
      </div>
    </>
  )
}
