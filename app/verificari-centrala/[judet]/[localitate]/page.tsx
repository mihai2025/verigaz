// app/verificari-centrala/[judet]/[localitate]/page.tsx
// Listing VTP centrală termică la nivel de localitate.
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
    title: `Verificare centrală termică (VTP) în ${geo.localitate.nume}, ${geo.judet.nume}`,
    description: `Firme autorizate ISCIR din ${geo.localitate.nume} (${geo.judet.nume}) pentru verificarea tehnică periodică a centralei termice. Programare rapidă online.`,
    alternates: { canonical: `/verificari-centrala/${judet}/${localitate}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { judet, localitate } = await params
  const geo = await resolveJudetLocalitate(judet, localitate)
  if (!geo) notFound()

  const firms = await fetchFirmsByGeo(
    { judetId: geo.judet.id, localitateId: geo.localitate.id },
    { categorySlug: "verificare-centrala" },
  )
  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă găsită" : "firme găsite"}.`
      : " Nicio firmă înregistrată încă."

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: "Verificare centrală termică", href: "/verificari-centrala" },
        { label: geo.judet.nume, href: `/servicii-gaze/${judet}` },
        { label: geo.localitate.nume },
      ]}
      title={<>Verificare centrală termică în {geo.localitate.nume}, {geo.judet.nume}</>}
      lead={
        <>
          Firme autorizate <strong>ISCIR</strong> pentru verificarea tehnică periodică
          (VTP) a centralei termice.{countLabel}
        </>
      }
      firms={firms}
      infoSlot={<IscirCentralaInfoBlock kind="verificare" />}
    />
  )
}
