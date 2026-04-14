// app/cookies/page.tsx
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Politica de cookies — verigaz",
  description: "Ce cookies folosim pe verificari-gaze.ro și cum le poți gestiona.",
  alternates: { canonical: "/cookies" },
}

export default function Page() {
  return (
    <main className="static-page container">
      <h1>Politica de cookies</h1>

      <p>
        Folosim cookies strict necesare pentru funcționalitate. Nu folosim cookies de
        tracking de la terți (ex: Google Analytics, Facebook Pixel).
      </p>

      <h2>Cookies folosite</h2>
      <table className="dash-table">
        <thead>
          <tr>
            <th>Nume</th>
            <th>Scop</th>
            <th>Durată</th>
            <th>Tip</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>Autentificare Supabase (sesiune cont)</td>
            <td>Sesiune</td>
            <td>Necesar</td>
          </tr>
          <tr>
            <td><code>geo</code></td>
            <td>Geo aproximativ din IP (personalizare listing)</td>
            <td>1 oră</td>
            <td>Necesar</td>
          </tr>
          <tr>
            <td><code>verigaz_cart_v1</code> (localStorage)</td>
            <td>Coș magazin</td>
            <td>Persistent până la ștergere</td>
            <td>Necesar</td>
          </tr>
        </tbody>
      </table>

      <h2>Gestionare</h2>
      <p>
        Poți bloca sau șterge cookies din setările browser-ului. Dacă dezactivezi toate
        cookies, autentificarea și coșul magazin nu vor funcționa.
      </p>

      <p>
        Detalii complete: <Link href="/confidentialitate">politica de confidențialitate</Link>.
      </p>
    </main>
  )
}
