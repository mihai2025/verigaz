// app/magazin/cos/page.tsx
import type { Metadata } from "next"
import CartClient from "./CartClient"

export const metadata: Metadata = {
  title: "Coș magazin — verigaz",
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <div className="cart-page container">
      <h1 className="shop-title">Coșul tău</h1>
      <CartClient />
    </div>
  )
}
