// app/servicii/[cat]/[judet]/[localitate]/page.tsx
// Listing pentru orice categorie de serviciu gaze + geo la nivel de localitate.
export const revalidate = 3600

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  fetchFirmsByGeo,
  resolveCategory,
  resolveJudetLocalitate,
} from "@/lib/firms/fetchByGeo"
import { AnreInfoBlock, IscirCentralaInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import {
  buildPageUrl,
  paginate,
  parsePageParam,
} from "@/lib/pagination/firmList"
import { Paginator } from "@/components/ui/Paginator"

type Params = { cat: string; judet: string; localitate: string }
type SearchParams = { page?: string | string[] }

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { cat, judet, localitate } = await params
  const { page: pageRaw } = await searchParams
  const page = parsePageParam(pageRaw)
  const [category, geo] = await Promise.all([
    resolveCategory(cat),
    resolveJudetLocalitate(judet, localitate),
  ])
  if (!category || !geo) return { title: "Pagină negăsită", robots: { index: false } }

  const basePath = `/servicii/${cat}/${judet}/${localitate}`
  const baseTitle = `${category.nume} în ${geo.localitate.nume}, ${geo.judet.nume}`
  const description =
    category.descriere ??
    `Firme autorizate pentru ${category.nume.toLowerCase()} în ${geo.localitate.nume} (${geo.judet.nume}).`

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
  const { cat, judet, localitate } = await params
  const { page: pageRaw } = await searchParams
  const [category, geo] = await Promise.all([
    resolveCategory(cat),
    resolveJudetLocalitate(judet, localitate),
  ])
  if (!category || !geo) notFound()

  const allFirms = await fetchFirmsByGeo(
    { judetId: geo.judet.id, localitateId: geo.localitate.id },
    { categorySlug: category.slug },
  )
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/servicii/${cat}/${judet}/${localitate}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă găsită" : "firme găsite"}.`
      : " Nicio firmă înregistrată încă."

  const isIscir = category.slug === "verificare-centrala" || category.slug === "revizie-centrala"
  const infoSlot = isIscir ? (
    <IscirCentralaInfoBlock kind={category.slug === "verificare-centrala" ? "verificare" : "revizie"} />
  ) : (
    <AnreInfoBlock />
  )

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: "Servicii", href: "/servicii" },
        { label: category.nume, href: `/servicii/${cat}` },
        { label: geo.judet.nume, href: `/servicii/${cat}/${judet}` },
        { label: geo.localitate.nume },
      ]}
      title={<>{category.nume} în {geo.localitate.nume}, {geo.judet.nume}</>}
      lead={
        <>
          {category.descriere ??
            `Firme autorizate pentru ${category.nume.toLowerCase()}.`}{countLabel}
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
      infoSlot={infoSlot}
    />
  )
}
