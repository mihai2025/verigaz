"use client"

import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="vg-footer">
      <div className="vg-footer__inner">
        <div className="vg-footer__grid">
          <div className="vg-footer__brand">
            <div className="vg-footer__logo">verificari-gaze.ro</div>
            <p className="vg-footer__desc">{DOMAIN.footerDescription}</p>
            <p style={{ fontSize: 12, color: "#64748b", margin: "12px 0 0" }}>
              © {year} · {DOMAIN.brandName}
            </p>
            <div className="vg-footer__anpc">
              <a
                href="https://anpc.ro/ce-este-sal/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ANPC — SAL"
                title="ANPC — Soluționarea Alternativă a Litigiilor"
              >
                <img src="/imagini/anpc-sal.webp" alt="ANPC – SAL" loading="lazy" />
              </a>
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SOL — Soluționarea online a litigiilor"
                title="SOL — Soluționarea Online a Litigiilor"
              >
                <img src="/imagini/anpc-sol.webp" alt="SOL – Soluționarea online a litigiilor" loading="lazy" />
              </a>
            </div>
          </div>

          <div>
            <div className="vg-footer__title">Servicii gaze</div>
            <nav className="vg-footer__links">
              <Link href="/servicii-gaze">Firme autorizate ANRE</Link>
              <Link href="/servicii/verificare-instalatie">Verificare la 2 ani</Link>
              <Link href="/servicii/revizie-instalatie">Revizie la 10 ani</Link>
              <Link href="/servicii/montaj-detector">Montaj detector</Link>
              <Link href="/servicii/reparatii-instalatie">Reparații</Link>
              <Link href="/programare">Cere ofertă</Link>
            </nav>
          </div>

          <div>
            <div className="vg-footer__title">Centrale termice</div>
            <nav className="vg-footer__links">
              <Link href="/verificari-centrala">Verificare VTP ISCIR</Link>
              <Link href="/revizii-centrala">Revizie anuală</Link>
              <Link href="/servicii/service-detector">Service detector</Link>
              <Link href="/magazin">Piese & detectoare</Link>
            </nav>
          </div>

          <div>
            <div className="vg-footer__title">Informații utile</div>
            <nav className="vg-footer__links">
              <Link href="/utile">Toate ghidurile</Link>
              <Link href="/utile/anre-ord-179-2015-explicat-pe-intelesul-tuturor">ANRE Ord. 179/2015</Link>
              <Link href="/utile/amenzi-verificare-gaze-neefectuata">Amenzi verificare</Link>
              <Link href="/utile/preturi-orientative-servicii-gaze-2026">Prețuri 2026</Link>
              <Link href="/utile/siguranta-instalatie-gaze-acasa-ghid-complet">Siguranță gaze</Link>
              <Link href="/cum-functioneaza">Cum funcționează</Link>
            </nav>
          </div>

          <div>
            <div className="vg-footer__title">Pentru firme</div>
            <nav className="vg-footer__links">
              <Link href="/pentru-firme">Listează-te gratuit</Link>
              <Link href="/abonamente">Planuri și prețuri</Link>
              <Link href="/inregistrare?firm=1">Înregistrare firmă</Link>
              <Link href="/login">Dashboard firmă</Link>
            </nav>

            <div className="vg-footer__title" style={{ marginTop: 20 }}>Legal</div>
            <nav className="vg-footer__links">
              <Link href="/despre">Despre</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/termeni">Termeni</Link>
              <Link href="/confidentialitate">Confidențialitate</Link>
              <Link href="/cookies">Cookies</Link>
            </nav>
          </div>
        </div>

        <div className="vg-footer__bottom">
          <div>Platformă de informare — nu intermediem servicii tehnice.</div>
          <div>
            Urgențe gaz: <strong>Distrigaz 0 800 877 778</strong> · <strong>Delgaz 0 800 800 928</strong>
          </div>
        </div>
      </div>
    </footer>
  )
}
