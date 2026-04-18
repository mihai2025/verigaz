// components/firms/ListingShell.tsx
// Wrapper pentru paginile de listing: hero + breadcrumb + grid de firme + info ANRE.
import Link from "next/link"
import type { ReactNode } from "react"
import type { FirmListRow } from "@/lib/firms/fetchByGeo"
import { FirmListItem } from "./FirmListItem"

type Crumb = { label: string; href?: string }

export function ListingShell({
  breadcrumbs,
  title,
  lead,
  firms,
  emptyHref = "/inregistrare",
  emptyLabel = "Înregistrează-te gratuit",
  infoSlot,
  footerSlot,
}: {
  breadcrumbs: Crumb[]
  title: ReactNode
  lead: ReactNode
  firms: FirmListRow[]
  emptyHref?: string
  emptyLabel?: string
  infoSlot?: ReactNode
  /** Slot afișat între listă și infoSlot — ex. Paginator. */
  footerSlot?: ReactNode
}) {
  return (
    <div className="sv-page container">
      <nav className="sv-breadcrumb" aria-label="Navigare">
        {breadcrumbs.map((c, i) => (
          <span key={i}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            {i < breadcrumbs.length - 1 && <span aria-hidden="true"> / </span>}
          </span>
        ))}
      </nav>

      <header className="sv-hero">
        <h1 className="sv-title">{title}</h1>
        <p className="sv-lead">{lead}</p>
      </header>

      {firms.length === 0 ? (
        <div className="sv-empty">
          <p>
            Nu avem încă firme verificate pentru această căutare. Firmă autorizată ANRE?{" "}
            <Link href={emptyHref}>{emptyLabel}</Link> și apari aici.
          </p>
        </div>
      ) : (
        <ul className="sv-firms">
          {firms.map((f, i) => (
            <li key={f.id}>
              <FirmListItem f={f} index={i} />
            </li>
          ))}
        </ul>
      )}

      {footerSlot}

      {infoSlot && <aside className="sv-info">{infoSlot}</aside>}
    </div>
  )
}

export function AnreInfoBlock() {
  return (
    <>
      <h2>Ce intră într-o verificare ANRE?</h2>
      <ul>
        <li>Verificarea etanșeității instalației interioare de gaze.</li>
        <li>Verificarea funcționării aparatelor consumatoare.</li>
        <li>Emiterea procesului-verbal și a declarației de conformitate.</li>
      </ul>
      <p className="sv-small">
        Conform <strong>ANRE Ord. 179/2015</strong>, verificarea tehnică e obligatorie la{" "}
        <strong>maxim 2 ani</strong>, iar revizia la <strong>maxim 10 ani</strong>.
      </p>
    </>
  )
}

export function IscirCentralaInfoBlock({ kind }: { kind: "verificare" | "revizie" }) {
  return (
    <>
      <h2>{kind === "verificare" ? "Ce e VTP centrală termică?" : "Ce presupune revizia centralei?"}</h2>
      {kind === "verificare" ? (
        <ul>
          <li>Verificarea tehnică periodică (VTP) a centralei termice ISCIR.</li>
          <li>Verificarea arzătorului, senzorilor, presiunii și tirajului.</li>
          <li>Emiterea raportului tehnic.</li>
        </ul>
      ) : (
        <ul>
          <li>Curățarea arzătorului și schimbătorului de căldură.</li>
          <li>Verificarea anozilor, vasului de expansiune și pompelor.</li>
          <li>Calibrarea presiunii și reglarea parametrilor de funcționare.</li>
        </ul>
      )}
      <p className="sv-small">
        Recomandare producători: <strong>verificare/revizie anuală</strong>. Fără ea se poate
        pierde garanția echipamentului.
      </p>
    </>
  )
}
