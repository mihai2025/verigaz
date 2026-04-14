// app/contact/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Contact — verigaz",
  description: "Scrie-ne pentru suport, parteneriate sau înregistrare firmă autorizată ANRE.",
  alternates: { canonical: "/contact" },
}

export default function Page() {
  return (
    <main className="static-page container">
      <h1>Contact</h1>

      <p>
        Suntem o echipă mică și răspundem la fiecare mesaj. Pentru programări sau probleme
        cu o firmă, deschide întâi tichet din dashboard — ajungem mai repede la context.
      </p>

      <section>
        <h2>Email</h2>
        <p>
          <a href={`mailto:${DOMAIN.contactEmail}`}>{DOMAIN.contactEmail}</a>
        </p>
      </section>

      <section>
        <h2>Probleme frecvente</h2>
        <ul>
          <li><Link href="/cum-functioneaza">Cum funcționează platforma</Link></li>
          <li><Link href="/pentru-firme">Cum îmi înscriu firma</Link></li>
          <li><Link href="/abonamente">Ce include fiecare plan</Link></li>
          <li><Link href="/confidentialitate">Cum sunt protejate datele mele</Link></li>
        </ul>
      </section>

      <section>
        <h2>Suport tehnic urgent (scurgere gaz)</h2>
        <p>
          Dacă suspectezi o scurgere de gaz, <strong>NU</strong> folosi verigaz.
          Închide robinetul general, aerisește spațiul și sună:
        </p>
        <p>
          <strong>Distrigaz Sud: 0 800 877 778</strong> (gratuit, 24/7)<br />
          <strong>Delgaz Grid: 0 800 877 778</strong> (gratuit, 24/7)
        </p>
      </section>
    </main>
  )
}
