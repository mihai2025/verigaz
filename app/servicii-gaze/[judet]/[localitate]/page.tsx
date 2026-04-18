// app/servicii-gaze/[judet]/[localitate]/page.tsx
// Pagina canonical de listing: toate firmele autorizate ANRE în localitate.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudetLocalitate } from "@/lib/firms/fetchByGeo"
import { AnreInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import {
  buildPageUrl,
  paginate,
  parsePageParam,
} from "@/lib/pagination/firmList"
import { Paginator } from "@/components/ui/Paginator"

// ISR: ~7k combinații (judet × localitate cu semnal) — nu pre-rendering,
// doar cache pe primul hit + revalidat la 1h.
export const revalidate = 3600

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

  const basePath = `/servicii-gaze/${judet}/${localitate}`
  const baseTitle = `Verificări și revizii gaze în ${geo.localitate.nume}, ${geo.judet.nume} – firme autorizate ANRE`
  const description = `Firme autorizate ANRE din ${geo.localitate.nume} (${geo.judet.nume}) pentru verificarea la 2 ani, revizia la 10 ani, montaj detectoare și reparații instalații gaze.`

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

  const allFirms = await fetchFirmsByGeo({
    judetId: geo.judet.id,
    localitateId: geo.localitate.id,
  })
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/servicii-gaze/${judet}/${localitate}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă găsită" : "firme găsite"}.`
      : " Nicio firmă înregistrată încă."

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: geo.judet.nume, href: `/servicii-gaze/${judet}` },
        { label: geo.localitate.nume },
      ]}
      title={
        <>Servicii gaze în {geo.localitate.nume}, județul {geo.judet.nume}</>
      }
      lead={
        <>
          Firme autorizate <strong>ANRE</strong> pentru <strong>verificare la 2 ani</strong>,{" "}
          <strong>revizie la 10 ani</strong>, montaj detectoare și reparații.
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
      infoSlot={<AnreInfoBlock />}
    />
  )
}
