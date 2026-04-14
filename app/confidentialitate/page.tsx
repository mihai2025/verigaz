// app/confidentialitate/page.tsx
import type { Metadata } from "next"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: "Politica de confidențialitate — verigaz",
  description: "Cum prelucrăm datele tale pe verificari-gaze.ro. Conformitate GDPR.",
  alternates: { canonical: "/confidentialitate" },
}

const UPDATED = "14 aprilie 2026"

export default function Page() {
  return (
    <main className="static-page container">
      <h1>Politica de confidențialitate</h1>
      <p className="dash-subtle">Ultima actualizare: {UPDATED}</p>

      <h2>1. Cine suntem</h2>
      <p>
        Operator: <strong>[Denumire SRL, CUI, adresă]</strong>. Contact:{" "}
        <a href={`mailto:${DOMAIN.contactEmail}`}>{DOMAIN.contactEmail}</a>.
      </p>

      <h2>2. Ce date prelucrăm</h2>
      <ul>
        <li>
          <strong>Clienți (persoane fizice):</strong> nume, telefon, email, adresa
          instalației, datele programărilor și documentelor asociate.
        </li>
        <li>
          <strong>Firme:</strong> denumire, CUI, autorizație ANRE/ISCIR, date de contact,
          persoană responsabilă.
        </li>
        <li>
          <strong>Toți vizitatorii:</strong> geo aproximativ din IP (cookie „geo",
          expiră în 1h), preferințe cookies, istoricul căutărilor efectuate.
        </li>
      </ul>

      <h2>3. De ce prelucrăm</h2>
      <ul>
        <li>Execuția contractului (programări, documente, plăți).</li>
        <li>Interes legitim pentru securitate, prevenție fraudă, audit.</li>
        <li>Consimțământ explicit pentru marketing (reminderele nu sunt marketing — sunt obligații tehnice).</li>
        <li>Obligații legale (facturare, conformitate ANRE).</li>
      </ul>

      <h2>4. Cât timp stocăm</h2>
      <ul>
        <li>Date cont: până la ștergerea contului + 3 ani (termen legal).</li>
        <li>Documente de conformitate: minim 10 ani (ANRE Ord. 179/2015).</li>
        <li>Logs audit: 3 ani.</li>
        <li>Cookie „geo": 1h.</li>
      </ul>

      <h2>5. Cu cine partajăm</h2>
      <ul>
        <li>Firme autorizate — doar datele strict necesare pentru execuție.</li>
        <li>Stripe — pentru procesare plăți.</li>
        <li>smsadvert — pentru trimitere SMS.</li>
        <li>Resend — pentru trimitere email.</li>
        <li>Cloudflare R2 — pentru stocare documente și imagini.</li>
        <li>Supabase (găzduit UE) — pentru baza de date.</li>
      </ul>
      <p>
        Nu vindem datele. Nu le partajăm în scop publicitar cu terți.
      </p>

      <h2>6. Drepturile tale GDPR</h2>
      <ul>
        <li>Acces, rectificare, ștergere („dreptul de a fi uitat").</li>
        <li>Portabilitate — export date în format structurat.</li>
        <li>Restricționarea prelucrării.</li>
        <li>Opoziție la prelucrare.</li>
        <li>Retragerea consimțământului oricând (nu afectează prelucrările anterioare).</li>
        <li>Plângere la ANSPDCP.</li>
      </ul>
      <p>
        Pentru exercitarea drepturilor, scrie la{" "}
        <a href={`mailto:${DOMAIN.contactEmail}`}>{DOMAIN.contactEmail}</a>. Răspundem în 30 zile.
      </p>

      <h2>7. Securitate</h2>
      <p>
        Datele sunt criptate în tranzit (TLS) și la rest (Supabase + R2). Accesul la
        datele sensibile e limitat rol-based (profiles.role). Parolele sunt hashuite de
        Supabase Auth. Documentele au hash SHA-256 pentru detectare tampering.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Folosim cookies strict necesare (autentificare, geo, cart). Nu folosim cookie-uri
        de tracking third-party. Detalii în banner-ul de cookies.
      </p>

      <h2>9. Minori</h2>
      <p>Platforma e destinată persoanelor 18+. Nu colectăm conștient date de la minori.</p>
    </main>
  )
}
