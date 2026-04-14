// app/despre/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export const metadata: Metadata = {
  title: `Despre ${DOMAIN.brandName}`,
  description:
    "Verigaz — platformă națională pentru verificări și revizii instalații gaze. Conectăm familiile și asociațiile de proprietari cu firme autorizate ANRE.",
  alternates: { canonical: "/despre" },
}

export default function Page() {
  return (
    <main className="static-page container">
      <h1>Despre verigaz</h1>

      <p>
        <strong>Verigaz</strong> e o platformă națională care conectează proprietarii și
        asociațiile din România cu firmele autorizate ANRE pentru{" "}
        <strong>verificarea</strong> și <strong>revizia</strong> instalațiilor de gaze
        naturale.
      </p>

      <h2>De ce am construit platforma</h2>
      <p>
        Conform <strong>ANRE Ord. 179/2015</strong>, fiecare instalație de gaze naturale
        trebuie verificată la maxim 2 ani și revizuită la maxim 10 ani. În realitate,
        majoritatea proprietarilor pierd scadența și riscă suspendarea furnizării — sau,
        mai grav, accidente evitabile.
      </p>
      <p>
        Problema nu e reaua-voință — e lipsa de infrastructură digitală:
      </p>
      <ul>
        <li>Nu există un registru public al firmelor autorizate pe județe și localități.</li>
        <li>Firmele mici nu au prezență online; lumea le găsește „din gură".</li>
        <li>Documentele de conformitate circulă în fotografii WhatsApp.</li>
        <li>Nimeni nu te avertizează când expiră verificarea.</li>
      </ul>

      <h2>Ce oferim</h2>
      <ul>
        <li><strong>Director național</strong> — firmele autorizate sunt filtrabile pe județ/localitate/serviciu.</li>
        <li><strong>Validare autorizație</strong> — fiecare firmă e confirmată de echipa noastră (ANRE + ISCIR).</li>
        <li><strong>Programare online</strong> — alegi ziua, firma te contactează pentru confirmare.</li>
        <li><strong>Documente digitale</strong> — certificate PDF cu hash SHA-256 și QR de verificare publică.</li>
        <li><strong>Reminder automat</strong> — SMS + email cu 30 zile înainte să expire scadența.</li>
        <li><strong>Magazin</strong> — detectoare certificate EN50194, senzori CO, electrovalve.</li>
      </ul>

      <h2>Cum ne susținem</h2>
      <p>
        Căutarea și programarea sunt <strong>gratuite</strong> pentru clienți. Ne susținem din:
      </p>
      <ul>
        <li>Abonamente de vizibilitate plătite de firme (<Link href="/abonamente">vezi planurile</Link>).</li>
        <li>Comisioane pe tranzacțiile din <Link href="/magazin">magazin</Link>.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Email: <a href={`mailto:${DOMAIN.contactEmail}`}>{DOMAIN.contactEmail}</a><br />
        Platformă: <Link href="/">verificari-gaze.ro</Link>
      </p>
    </main>
  )
}
