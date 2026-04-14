// app/termeni/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Termeni și condiții — verigaz",
  description: "Termenii de utilizare a platformei verificari-gaze.ro pentru clienți și firme autorizate ANRE.",
  alternates: { canonical: "/termeni" },
}

const UPDATED = "14 aprilie 2026"

export default function Page() {
  return (
    <main className="static-page container">
      <h1>Termeni și condiții</h1>
      <p className="dash-subtle">Ultima actualizare: {UPDATED}</p>

      <h2>1. Ce e verigaz</h2>
      <p>
        <strong>{DOMAIN.brandName}</strong> e o platformă online care conectează proprietari
        și asociații din România cu firme autorizate ANRE/ISCIR pentru servicii de gaze
        naturale și centrale termice. Operator: <em>[Denumire SRL, CUI, J…]</em>.
      </p>

      <h2>2. Ce nu e verigaz</h2>
      <p>
        Verigaz <strong>nu prestează servicii tehnice</strong>. Nu suntem executant, nu
        avem autorizație ANRE. Toate intervențiile sunt efectuate de firmele listate,
        sub propria responsabilitate legală și tehnică.
      </p>

      <h2>3. Conturi</h2>
      <p>
        Poți folosi platforma fără cont pentru căutare. Pentru programări și contact cu
        firmele îți poate fi cerut un cont. Firmele trebuie cont dedicat + validare
        autorizație ANRE/ISCIR.
      </p>

      <h2>4. Programări</h2>
      <p>
        O programare e o cerere — confirmarea se face de către firmă. Verigaz transmite
        cererea, dar <strong>nu garantează execuția</strong>. Prețurile, condițiile și
        calendarul sunt negociate direct între client și firmă.
      </p>

      <h2>5. Documente digitale</h2>
      <p>
        Certificatele emise prin platformă sunt documente oficiale generate de firma
        executantă. Verigaz stochează fișierul, hash-ul SHA-256 și permite verificarea
        publică a autenticității. Conținutul tehnic aparține firmei emitente.
      </p>

      <h2>6. Magazin</h2>
      <p>
        Produsele sunt vândute fie de verigaz, fie de firme partenere. Vezi fiecare fișă
        produs pentru vânzător. Tranzacțiile sunt procesate de Stripe. Returul e de 14
        zile conform legii protecției consumatorului.
      </p>

      <h2>7. Abonamente firme</h2>
      <p>
        Detaliile planurilor sunt pe <Link href="/abonamente">/abonamente</Link>.
        Abonamentul se reînnoiește automat anual. Anularea oprește reînnoirea — beneficiile
        rămân până la sfârșitul perioadei curente.
      </p>

      <h2>8. Utilizare interzisă</h2>
      <ul>
        <li>Înregistrare cu date false sau autorizație invalidă.</li>
        <li>Spam, hărțuire sau contact în afara platformei pentru comenzi preluate prin verigaz.</li>
        <li>Scraping automat fără acord scris.</li>
        <li>Tentative de bypass al validării ANRE/ISCIR.</li>
      </ul>

      <h2>9. Răspundere</h2>
      <p>
        Verigaz e operator de platformă. Responsabilitatea pentru intervenția tehnică,
        conformitatea instalației și orice incident aparține integral firmei executante.
        Limitarea răspunderii verigaz la valoarea abonamentului plătit în ultimele 12 luni.
      </p>

      <h2>10. Modificări</h2>
      <p>
        Putem actualiza acești termeni. Modificările substanțiale sunt comunicate prin email.
        Continuarea utilizării înseamnă acceptare.
      </p>

      <h2>11. Drept aplicabil</h2>
      <p>Drept român. Instanțe competente: București.</p>

      <h2>12. Contact</h2>
      <p>
        <a href={`mailto:${DOMAIN.contactEmail}`}>{DOMAIN.contactEmail}</a>
      </p>
    </main>
  )
}
