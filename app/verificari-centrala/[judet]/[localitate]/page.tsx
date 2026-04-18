// app/verificari-centrala/[judet]/[localitate]/page.tsx
// Listing VTP centrală termică la nivel de localitate.
export const revalidate = 3600

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudetLocalitate } from "@/lib/firms/fetchByGeo"
import { IscirCentralaInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import {
  buildPageUrl,
  paginate,
  parsePageParam,
} from "@/lib/pagination/firmList"
import { Paginator } from "@/components/ui/Paginator"

type Params = { judet: string; localitate: string }
type SearchParams = { page?: string | string[] }

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { judet, localitate } = await params
  const { page: pageRaw } = await searchParams
  const page = parsePageParam(pageRaw)
  const geo = await resolveJudetLocalitate(judet, localitate)
  if (!geo) return { title: "Pagină negăsită", robots: { index: false } }

  const basePath = `/verificari-centrala/${judet}/${localitate}`
  const baseTitle = `Verificare centrală termică (VTP) în ${geo.localitate.nume}, ${geo.judet.nume}`
  const description = `Firme autorizate ISCIR din ${geo.localitate.nume} (${geo.judet.nume}) pentru verificarea tehnică periodică a centralei termice. Programare rapidă online.`

  return {
    title: page > 1 ? `${baseTitle} — pagina ${page}` : baseTitle,
    description,
    alternates: { canonical: buildPageUrl(basePath, page) },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { judet, localitate } = await params
  const { page: pageRaw } = await searchParams
  const geo = await resolveJudetLocalitate(judet, localitate)
  if (!geo) notFound()

  const allFirms = await fetchFirmsByGeo(
    { judetId: geo.judet.id, localitateId: geo.localitate.id },
    { categorySlug: "verificare-centrala" },
  )
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/verificari-centrala/${judet}/${localitate}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă găsită" : "firme găsite"}.`
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
      footerSlot={
        <Paginator
          basePath={basePath}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      }
      infoSlot={<IscirCentralaInfoBlock kind="verificare" />}
    />
  )
}
