"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addToCart, type CartItem } from "@/lib/shop/cart"

export default function AddToCartButton({
  product,
}: {
  product: Omit<CartItem, "qty">
}) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addToCart(product, qty)
    router.push("/magazin/checkout")
  }

  return (
    <div className="shop-cta">
      <div className="shop-qty">
        <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))}>−</button>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
        />
        <button type="button" onClick={() => setQty((v) => Math.min(99, v + 1))}>+</button>
      </div>
      <button type="button" className="shop-btn shop-btn--primary" onClick={handleAdd}>
        {added ? "✓ Adăugat" : "Adaugă în coș"}
      </button>
      <button type="button" className="shop-btn shop-btn--buy" onClick={handleBuyNow}>
        Cumpără acum
      </button>
    </div>
  )
}
