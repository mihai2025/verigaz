// app/pentru-firme/page.tsx
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Pentru firme autorizate ANRE — listează-te pe verigaz",
  description:
    "Listare gratuită, dashboard programări, documente digitale, reminder-e automate la clienți. Primești cereri din județul tău fără să cumperi Google Ads.",
  alternates: { canonical: "/pentru-firme" },
}

export default function Page() {
  return (
    <main className="static-page container">
      <header className="home-hero">
        <h1>Pentru firme autorizate ANRE</h1>
        <p className="home-hero__sub">
          Listare gratuită, programări direct în dashboard, certificate PDF generate automat,
          reminder-e care îți aduc clienții înapoi la 2 ani.
        </p>
      </header>

      <section className="home-values" style={{ marginTop: "1.5rem" }}>
        <div className="home-value">
          <h3>Fără investiție în marketing</h3>
          <p>
            Apari în rezultatele de căutare Google pe <code>verificări gaze {"{"}oraș{"}"}</code>.
            Nu cumperi ads — SEO-ul programatic lucrează pentru tine.
          </p>
        </div>
        <div className="home-value">
          <h3>Clienți cu intenție clară</h3>
          <p>
            Cererile vin de la oameni care știu exact ce vor: verificare, revizie,
            detector, centrală. Nu lead-uri reci.
          </p>
        </div>
        <div className="home-value">
          <h3>Dashboard operațional</h3>
          <p>
            Vezi programările, confirmi/respingi, emiti PDF-ul certificatului direct din
            platformă — hash + QR incluse.
          </p>
        </div>
        <div className="home-value">
          <h3>Retenție automată</h3>
          <p>
            La 23 de luni după intervenție, clientul primește SMS cu link către{" "}
            <strong>firma ta</strong> pentru următoarea verificare.
          </p>
        </div>
      </section>

      <section className="home-cats" style={{ marginTop: "2rem" }}>
        <h2>Cum te înscrii</h2>
        <ol className="how-list">
          <li><strong>Creezi cont</strong> — <Link href="/inregistrare?firm=1">Înregistrare firmă</Link> (gratuit, 2 minute).</li>
          <li><strong>Completezi profilul</strong> — denumire, CUI, autorizație ANRE, servicii oferite, zone de operare.</li>
          <li><strong>Validăm autorizația</strong> — echipa noastră verifică în 1-2 zile lucrătoare.</li>
          <li><strong>Primești programări</strong> — apari în listing-urile din localitățile tale.</li>
        </ol>
      </section>

      <section className="home-b2b">
        <h2>Planuri de vizibilitate</h2>
        <p>
          Planul <strong>Free</strong> te listează cu profil de bază. Planurile plătite
          adaugă magazin, featured placement, exclusivitate locală și dashboard analytics.
        </p>
        <p><Link href="/abonamente" className="home-link">Vezi detalii și prețuri →</Link></p>
      </section>

      <section className="home-cats">
        <h2>Întrebări frecvente</h2>
        <dl className="pricing-dl">
          <dt>Cât costă să apar pe verigaz?</dt>
          <dd>Listarea e gratuită pe planul Free. Planurile plătite încep de la 490 lei/an.</dd>
          <dt>Cine validează autorizația ANRE?</dt>
          <dd>
            Echipa noastră verifică manual fiecare autorizație în <code>ANRE Registru</code>{" "}
            înainte de aprobare. Durează 1-2 zile lucrătoare.
          </dd>
          <dt>Cum primesc banii de la clienți?</dt>
          <dd>
            Pentru servicii, încasarea e între tine și client — verigaz e doar platforma de
            descoperire și programare. Pentru produse din magazin, Stripe face settlement-ul
            în contul tău.
          </dd>
          <dt>Pot personaliza template-urile SMS?</dt>
          <dd>
            Da, pe planul <strong>Start</strong> și superior. Template-uri pentru confirmare
            programare, reminder 30 zile, certificat emis.
          </dd>
          <dt>Ce se întâmplă dacă îmi pierd autorizația?</dt>
          <dd>
            Dacă autorizația ANRE expiră sau e revocată, firma e suspendată până la reînnoire.
            Clienții sunt protejați.
          </dd>
        </dl>
      </section>

      <div className="booking-actions" style={{ marginTop: "2rem" }}>
        <Link href="/inregistrare?firm=1" className="shop-btn shop-btn--primary">
          Înscrie firma gratuit
        </Link>
        <Link href="/abonamente" className="shop-btn shop-btn--ghost">
          Vezi abonamentele
        </Link>
      </div>
    </main>
  )
}
