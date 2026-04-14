// app/cum-functioneaza/page.tsx
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Cum funcționează verigaz — pașii de la căutare la certificat",
  description:
    "3 pași simpli: cauți firma autorizată ANRE, programezi intervenția, primești certificatul digital cu reminder automat la următoarea scadență.",
  alternates: { canonical: "/cum-functioneaza" },
}

export default function Page() {
  return (
    <main className="static-page container">
      <h1>Cum funcționează</h1>

      <p>
        Verigaz e conceput să-ți rezolve problema în <strong>3 pași</strong>, fără drumuri
        și fără apeluri telefonice nesfârșite.
      </p>

      <section className="how-step">
        <h2>1. Găsești firma autorizată</h2>
        <p>
          Alegi <Link href="/servicii-gaze">județul</Link> și localitatea. Vezi doar firmele
          cu <strong>autorizație ANRE validă</strong>, cu profil complet — telefon, adresă
          sediu, categorii de servicii, recenzii.
        </p>
        <p className="dash-subtle">
          Pentru centrala termică folosești <Link href="/verificari-centrala">verificari-centrala</Link>
          sau <Link href="/revizii-centrala">revizii-centrala</Link> — firme autorizate ISCIR.
        </p>
      </section>

      <section className="how-step">
        <h2>2. Programezi online</h2>
        <p>
          Deschizi profilul firmei și apeși <strong>„Programează online"</strong>.
          Completezi adresa, alegi data preferată, trimiți cererea. Primești o referință
          unică (<code>VG-2026-XXXXXX</code>) imediat.
        </p>
        <p>
          Firma te contactează pentru confirmare, de obicei în 24h (mai repede în orele de
          program).
        </p>
      </section>

      <section className="how-step">
        <h2>3. Primești certificat + reminder</h2>
        <p>
          După intervenție, firma generează pe platformă{" "}
          <strong>certificat PDF cu hash SHA-256 și QR</strong>. Oricine poate verifica
          autenticitatea pe <code>verificari-gaze.ro/verifica-document/…</code>.
        </p>
        <p>
          Cu <strong>30 zile</strong> înainte să expire scadența (24 luni pentru verificare,
          120 luni pentru revizie) îți trimitem <strong>SMS + email</strong> automat.
          Nu mai pierzi scadența.
        </p>
      </section>

      <section className="how-faq">
        <h2>Întrebări frecvente</h2>
        <dl className="pricing-dl">
          <dt>Cât costă o verificare?</dt>
          <dd>
            Între 80 și 250 lei, în funcție de dimensiunea instalației și firma aleasă.
            Prețul apare pe cardul firmei înainte de programare.
          </dd>
          <dt>Serviciul verigaz e plătit?</dt>
          <dd>
            Nu. Căutarea, programarea și reminderele sunt gratuite pentru clienți. Firmele
            plătesc abonament dacă vor vizibilitate prioritară.
          </dd>
          <dt>Ce fac dacă firma nu apare în listă?</dt>
          <dd>
            Trimite-ne <Link href="/contact">datele firmei</Link> (nume + CUI) — o contactăm
            să se înregistreze pe platformă.
          </dd>
          <dt>Certificatul e acceptat de Distrigaz / Delgaz?</dt>
          <dd>
            Da. E emis de firma autorizată ANRE în format conform legii. PDF-ul poate fi
            listat sau trimis prin email către operatorul de distribuție.
          </dd>
        </dl>
      </section>

      <div className="booking-actions" style={{ marginTop: "2rem" }}>
        <Link href="/servicii-gaze" className="shop-btn shop-btn--primary">
          Începe acum — găsește firmă
        </Link>
      </div>
    </main>
  )
}
