// lib/shop/cart.ts
// Cart state minimal — persistat în localStorage pe client, citit via hook.
// Consumed de /magazin/cos și /magazin/checkout.

export type CartItem = {
  productId: string
  slug: string
  nume: string
  price: number
  qty: number
  imageUrl: string | null
  sku: string | null
}

const STORAGE_KEY = "verigaz_cart_v1"

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("verigaz:cart:changed"))
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1): CartItem[] {
  const items = readCart()
  const idx = items.findIndex((i) => i.productId === item.productId)
  if (idx >= 0) items[idx].qty += qty
  else items.push({ ...item, qty })
  writeCart(items)
  return items
}

export function updateQty(productId: string, qty: number): CartItem[] {
  const items = readCart()
  const next = qty <= 0 ? items.filter((i) => i.productId !== productId)
                        : items.map((i) => i.productId === productId ? { ...i, qty } : i)
  writeCart(next)
  return next
}

export function removeFromCart(productId: string): CartItem[] {
  return updateQty(productId, 0)
}

export function clearCart(): void {
  writeCart([])
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}
