// app/revizii-centrala/[judet]/[localitate]/page.tsx
// Listing revizie centrală termică la nivel de localitate.
export const revalidate = 3600

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudetLocalitate } from "@/lib/firms/fetchByGeo"
import { IscirCentralaInfoBlock, ListingShell } from "@/components/firms/ListingShell"

type Params = { judet: string; localitate: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { judet, localitate } = await params
  const geo = await resolveJudetLocalitate(judet, localitate)
  if (!geo) return { title: "Pagină negăsită", robots: { index: false } }
  return {
    title: `Revizie centrală termică în ${geo.localitate.nume}, ${geo.judet.nume}`,
    description: `Firme autorizate din ${geo.localitate.nume} (${geo.judet.nume}) pentru revizia completă a centralei termice. Programare rapidă online.`,
    alternates: { canonical: `/revizii-centrala/${judet}/${localitate}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { judet, localitate } = await params
  const geo = await resolveJudetLocalitate(judet, localitate)
  if (!geo) notFound()

  const firms = await fetchFirmsByGeo(
    { judetId: geo.judet.id, localitateId: geo.localitate.id },
    { categorySlug: "revizie-centrala" },
  )
  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă găsită" : "firme găsite"}.`
      : " Nicio firmă înregistrată încă."

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: "Revizie centrală termică", href: "/revizii-centrala" },
        { label: geo.judet.nume, href: `/servicii-gaze/${judet}` },
        { label: geo.localitate.nume },
      ]}
      title={<>Revizie centrală termică în {geo.localitate.nume}, {geo.judet.nume}</>}
      lead={
        <>
          Firme autorizate pentru <strong>revizia completă</strong> a centralei termice —
          curățare, calibrare și verificare tehnică.{countLabel}
        </>
      }
      firms={firms}
      infoSlot={<IscirCentralaInfoBlock kind="revizie" />}
    />
  )
}
