// app/magazin/checkout/page.tsx
import type { Metadata } from "next"
import CheckoutClient from "./CheckoutClient"

export const metadata: Metadata = {
  title: "Finalizare comandă — verigaz",
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <div className="checkout-page container">
      <h1 className="shop-title">Finalizare comandă</h1>
      <CheckoutClient />
    </div>
  )
}
