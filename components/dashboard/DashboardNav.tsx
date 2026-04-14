// components/dashboard/DashboardNav.tsx
// Navigare dashboard — vizibilitate pe rol (firm_owner / admin / user).
import Link from "next/link"

type Props = {
  role: "admin" | "firm_owner" | "user"
  firmId: string | null
  pendingClaims?: number
  pendingOrders?: number
}

function Badge({ count }: { count: number }) {
  if (!count) return null
  return <span className="dash-badge">{count}</span>
}

export function DashboardNav({ role, firmId, pendingClaims = 0, pendingOrders = 0 }: Props) {
  const isAdmin = role === "admin"
  const isFirm = role === "firm_owner"

  return (
    <nav className="dash-nav" aria-label="Dashboard">
      <div className="dash-nav__brand">
        <Link href="/dashboard">verificari-gaze.ro · dashboard</Link>
      </div>

      <ul className="dash-nav__list">
        <li><Link href="/dashboard">Acasă</Link></li>
        <li><Link href="/dashboard/cont">Contul meu</Link></li>

        {!isFirm && !isAdmin && (
          <li><Link href="/dashboard/adauga-firma">Adaugă firmă</Link></li>
        )}

        {isFirm && firmId && (
          <>
            <li className="dash-nav__sep">Firma mea</li>
            <li><Link href="/dashboard/firma-mea">Profil firmă</Link></li>
            <li><Link href="/dashboard/salariati">Salariați</Link></li>
            <li><Link href="/dashboard/echipamente">Echipamente (catalog)</Link></li>
            <li><Link href="/dashboard/clienti">Clienți & adrese</Link></li>
            <li><Link href="/dashboard/programari">Programări</Link></li>
            <li><Link href="/dashboard/notificari">Notificări</Link></li>
            <li><Link href="/dashboard/documente">Documente emise</Link></li>
            <li className="dash-nav__sep">Rapoarte</li>
            <li><Link href="/dashboard/rapoarte/revizii">Revizii (10 ani)</Link></li>
            <li><Link href="/dashboard/rapoarte/verificari">Verificări</Link></li>
            <li><Link href="/dashboard/rapoarte/tehnicieni">Tehnicieni</Link></li>
            <li><Link href="/dashboard/magazin-produse">Produse magazin</Link></li>
            <li><Link href="/dashboard/magazin-comenzi">Comenzi <Badge count={pendingOrders} /></Link></li>
            <li><Link href="/dashboard/abonament">Abonament</Link></li>
          </>
        )}

        {isAdmin && (
          <>
            <li className="dash-nav__sep">Admin</li>
            <li><Link href="/dashboard/firme">Firme <Badge count={pendingClaims} /></Link></li>
            <li><Link href="/dashboard/utilizatori">Utilizatori</Link></li>
            <li><Link href="/dashboard/leads-admin">Lead-uri</Link></li>
            <li><Link href="/dashboard/reviews-admin">Review-uri</Link></li>
            <li><Link href="/dashboard/audit">Audit</Link></li>
            <li><Link href="/dashboard/sms-templates">SMS templates</Link></li>
            <li><Link href="/dashboard/sms-log">SMS log</Link></li>
            <li><Link href="/dashboard/planuri">Planuri & tarife</Link></li>
            <li><Link href="/dashboard/magazin-comenzi">Toate comenzile <Badge count={pendingOrders} /></Link></li>
            <li className="dash-nav__sep">Rapoarte admin</li>
            <li><Link href="/dashboard/rapoarte/facturare-sms">Facturare SMS</Link></li>
          </>
        )}
      </ul>

      <form action="/logout" method="post" className="dash-nav__logout">
        <button type="submit" className="dash-btn dash-btn--ghost">Ieșire</button>
      </form>
    </nav>
  )
}
