"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { cartSubtotal, clearCart, readCart, type CartItem } from "@/lib/shop/cart"

const DELIVERY_OPTIONS = [
  { key: "pickup",  label: "Ridicare din magazin",       price: 0 },
  { key: "locker",  label: "Easybox / Locker (24-48h)",  price: 15 },
  { key: "courier", label: "Curier la domiciliu",         price: 22 },
] as const

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [delivery, setDelivery] = useState<string>("courier")
  const [invoiceBusiness, setInvoiceBusiness] = useState(false)

  useEffect(() => {
    setItems(readCart())
    setLoaded(true)
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
  const deliveryOption = DELIVERY_OPTIONS.find((d) => d.key === delivery) ?? DELIVERY_OPTIONS[2]
  const total = subtotal + deliveryOption.price

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const payload = {
      items,
      buyer: {
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
      },
      billingAddress: {
        street: String(fd.get("street") ?? ""),
        city: String(fd.get("city") ?? ""),
        county: String(fd.get("county") ?? ""),
        zip: String(fd.get("zip") ?? ""),
      },
      business: invoiceBusiness
        ? {
            cui: String(fd.get("cui") ?? ""),
            companyName: String(fd.get("company_name") ?? ""),
          }
        : null,
      delivery: { key: deliveryOption.key, label: deliveryOption.label, price: deliveryOption.price },
      notes: String(fd.get("notes") ?? "") || null,
    }

    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) {
        setError(data?.error ?? `Eroare ${res.status}`)
        return
      }
      clearCart()
      window.location.href = data.url
    })
  }

  return (
    <form onSubmit={onSubmit} className="checkout-form">
      {error && <div className="auth-error" role="alert">{error}</div>}

      <section className="checkout-section">
        <h2>Date client</h2>
        <div className="booking-row">
          <label className="booking-field">
            <span>Nume complet *</span>
            <input name="name" required autoComplete="name" maxLength={120} />
          </label>
          <label className="booking-field">
            <span>Telefon *</span>
            <input name="phone" required type="tel" autoComplete="tel" maxLength={30} />
          </label>
        </div>
        <label className="booking-field">
          <span>Email *</span>
          <input name="email" required type="email" autoComplete="email" maxLength={120} />
        </label>
      </section>

      <section className="checkout-section">
        <h2>Adresă livrare / facturare</h2>
        <label className="booking-field">
          <span>Stradă, număr *</span>
          <input name="street" required maxLength={200} />
        </label>
        <div className="booking-row">
          <label className="booking-field">
            <span>Oraș *</span>
            <input name="city" required maxLength={100} />
          </label>
          <label className="booking-field">
            <span>Județ *</span>
            <input name="county" required maxLength={60} />
          </label>
          <label className="booking-field">
            <span>Cod poștal</span>
            <input name="zip" maxLength={20} />
          </label>
        </div>
        <label className="booking-checkbox">
          <input type="checkbox" checked={invoiceBusiness} onChange={(e) => setInvoiceBusiness(e.target.checked)} />
          <span>Factură pe firmă</span>
        </label>
        {invoiceBusiness && (
          <div className="booking-row">
            <label className="booking-field">
              <span>CUI</span>
              <input name="cui" maxLength={30} />
            </label>
            <label className="booking-field">
              <span>Denumire firmă</span>
              <input name="company_name" maxLength={200} />
            </label>
          </div>
        )}
      </section>

      <section className="checkout-section">
        <h2>Metodă livrare</h2>
        <ul className="checkout-delivery">
          {DELIVERY_OPTIONS.map((d) => (
            <li key={d.key}>
              <label>
                <input
                  type="radio"
                  name="delivery"
                  value={d.key}
                  checked={delivery === d.key}
                  onChange={() => setDelivery(d.key)}
                />
                <span>{d.label}</span>
                <strong>{d.price === 0 ? "gratuit" : `${d.price} lei`}</strong>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="checkout-section">
        <h2>Rezumat</h2>
        <ul className="checkout-summary">
          {items.map((i) => (
            <li key={i.productId}>
              {i.nume} × {i.qty} — <strong>{(i.price * i.qty).toFixed(2)} lei</strong>
            </li>
          ))}
        </ul>
        <div className="checkout-totals">
          <div>Subtotal: {subtotal.toFixed(2)} lei</div>
          <div>Livrare: {deliveryOption.price.toFixed(2)} lei</div>
          <div><strong>Total: {total.toFixed(2)} lei</strong></div>
        </div>
        <label className="booking-field">
          <span>Observații</span>
          <textarea name="notes" rows={2} maxLength={500} />
        </label>
      </section>

      <button type="submit" disabled={pending} className="shop-btn shop-btn--primary">
        {pending ? "Se creează plata…" : "Plătește cu Stripe →"}
      </button>
    </form>
  )
}
