import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-card">
          <div className="footer-grid footer-grid--5col">
            {/* BRAND */}
            <div className="footer-brand">
              <div className="footer-logo">{DOMAIN.domain}</div>
              <p className="footer-desc">{DOMAIN.footerDescription}</p>
              <div className="footer-meta">
                © {new Date().getFullYear()} • Toate drepturile rezervate
              </div>
              <div className="footer-anpc">
                <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">
                  <img src="/imagini/anpc-sal.webp" alt="ANPC – SAL" className="footer-anpc__img" />
                </a>
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                  <img src="/imagini/anpc-sol.webp" alt="SOL – Soluționarea online a litigiilor" className="footer-anpc__img" />
                </a>
              </div>
            </div>

            {/* SERVICII FUNERARE */}
            <div className="footer-col">
              <div className="footer-title">Servicii funerare</div>
              <div className="footer-links">
                <Link href="/servicii">Director servicii</Link>
                <Link href="/comemorari">Comemorări și anunțuri</Link>
                <Link href="/servicii-funerare/ghid-complet-dupa-deces">Ghid complet după deces</Link>
                <Link href="/servicii-funerare/acte-necesare-dupa-deces">Acte necesare după deces</Link>
                <Link href="/servicii-funerare/cost-inmormantare">Cost înmormântare</Link>
                <Link href="/servicii-funerare/ajutor-de-inmormantare">Ajutor de înmormântare</Link>
                <Link href="/servicii-funerare/ce-trebuie-facut-dupa-deces-ghid-pdf">Ghid PDF — primele 72 ore</Link>
                <Link href="/servicii-funerare/calculator-cost-inmormantare">Calculator cost înmormântare</Link>
              </div>
            </div>

            {/* PARASTASE ȘI TRADIȚII */}
            <div className="footer-col">
              <div className="footer-title">Parastase și tradiții</div>
              <div className="footer-links">
                <Link href="/calendar-ortodox">Calendar Ortodox 2026</Link>
                <Link href="/mesaje-condoleante">Mesaje de condoleanțe</Link>
                <Link href="/servicii-funerare/calendar-parastase">Calendar parastase</Link>
                <Link href="/servicii-funerare/calculator-parastase">Calculator date parastas</Link>
                <Link href="/servicii-funerare/reminder-parastase">Reminder parastas SMS</Link>
                <Link href="/servicii-funerare/ghid/ghid-complet-parastas">Ghid complet parastas</Link>
                <Link href="/servicii-funerare/ghid/ce-se-da-la-40-zile">Ce se dă la 40 de zile</Link>
                <Link href="/servicii-funerare/ghid/ce-se-imparte-la-parastas">Ce se împarte la parastas</Link>
                <Link href="/servicii-funerare/ghid/model-pomelnic-40-zile-sarindar">Model pomelnic 40 zile</Link>
                <Link href="/servicii-funerare/ghid/ghid-complet-traditii">Ghid complet tradiții</Link>
              </div>
            </div>

            {/* GHIDURI ȘI RESURSE */}
            <div className="footer-col">
              <div className="footer-title">Ghiduri și resurse</div>
              <div className="footer-links">
                <Link href="/articole">Articole și ghiduri</Link>
                <Link href="/servicii-funerare/ghid/model-anunt-deces">Model anunț deces</Link>
                <Link href="/servicii-funerare/ghid/model-mesaje-condoleante">Modele mesaje condoleanțe</Link>
                <Link href="/servicii-funerare/ghid/ghid-complet-doliu">Ghid complet doliu</Link>
                <Link href="/servicii-funerare/ghid/reguli-doliu">Reguli de doliu</Link>
                <Link href="/servicii-funerare/ghid/organizare-inmormantare-checklist">Checklist înmormântare</Link>
                <Link href="/servicii-funerare/organizare-inmormantare-timeline">Timeline organizare</Link>
                <Link href="/psihologi">Psihologi doliu</Link>
                <Link href="/servicii-funerare/life-plan">Pagina digitală QR</Link>
                <Link href="/magazin">Magazin online</Link>
              </div>
            </div>

            {/* B2B + LEGAL */}
            <div className="footer-col">
              <div className="footer-title">Pentru firme</div>
              <div className="footer-links">
                <Link href="/adauga-firma">Adaugă firmă</Link>
                <Link href="/abonamente">Planuri și prețuri</Link>
                <Link href="/prezentare-b2b">Prezentare B2B</Link>
                <Link href="/remindere-parastase">Remindere parastase B2B</Link>
                <Link href="/servicii-funerare/life-plan-b2b">Parteneriate Life Plan QR</Link>
              </div>

              <div className="footer-title" style={{ marginTop: 20 }}>Legal</div>
              <div className="footer-links">
                <Link href="/termeni-si-conditii">Termeni și condiții</Link>
                <Link href="/politica-de-confidentialitate">Politica de confidențialitate</Link>
                <Link href="/politica-de-cookies">Politica cookies</Link>
                <Link href="/verificare-firme">Verificare firme</Link>
                <Link href="/despre">Despre noi</Link>
                <Link href="/contact">Contact</Link>
              </div>

              <div className="footer-note">
                Recenziile pot fi moderate. Platforma oferă listare și informare, nu intermediază servicii.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
