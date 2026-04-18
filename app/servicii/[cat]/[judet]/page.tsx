// app/servicii/[cat]/[judet]/page.tsx
// Listing pentru o categorie de serviciu la nivel de județ.
export const revalidate = 3600

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  fetchFirmsByGeo,
  resolveCategory,
  resolveJudet,
} from "@/lib/firms/fetchByGeo"
import { AnreInfoBlock, IscirCentralaInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import {
  buildPageUrl,
  paginate,
  parsePageParam,
} from "@/lib/pagination/firmList"
import { Paginator } from "@/components/ui/Paginator"

type Params = { cat: string; judet: string }
type SearchParams = { page?: string | string[] }

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { cat, judet } = await params
  const { page: pageRaw } = await searchParams
  const page = parsePageParam(pageRaw)
  const [category, j] = await Promise.all([resolveCategory(cat), resolveJudet(judet)])
  if (!category || !j) return { title: "Pagină negăsită", robots: { index: false } }

  const basePath = `/servicii/${cat}/${judet}`
  const baseTitle = `${category.nume} în județul ${j.nume}`
  const description =
    category.descriere ??
    `Firme autorizate pentru ${category.nume.toLowerCase()} în județul ${j.nume}.`

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
  const { cat, judet } = await params
  const { page: pageRaw } = await searchParams
  const [category, j] = await Promise.all([resolveCategory(cat), resolveJudet(judet)])
  if (!category || !j) notFound()

  const allFirms = await fetchFirmsByGeo({ judetId: j.id }, { categorySlug: category.slug })
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/servicii/${cat}/${judet}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă" : "firme"} în județ.`
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
        { label: j.nume },
      ]}
      title={<>{category.nume} în județul {j.nume}</>}
      lead={
        <>
          {category.descriere ?? `Firme autorizate pentru ${category.nume.toLowerCase()}.`}
          {countLabel}
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
