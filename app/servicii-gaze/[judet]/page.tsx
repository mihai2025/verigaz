// app/servicii-gaze/[judet]/page.tsx
// Listing la nivel de județ — toate firmele autorizate ANRE din județ.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudet } from "@/lib/firms/fetchByGeo"
import { AnreInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import {
  buildPageUrl,
  paginate,
  parsePageParam,
} from "@/lib/pagination/firmList"
import { Paginator } from "@/components/ui/Paginator"

// ISR: pagini regenerate la 1h; pre-renderate la build pentru toate 42 de județe.
export const revalidate = 3600

export async function generateStaticParams() {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase.from("judete").select("nume")
  return (data ?? []).map((j) => ({ judet: slugifyRO(j.nume as string) }))
}

type Params = { judet: string }
type SearchParams = { page?: string | string[] }

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { judet } = await params
  const { page: pageRaw } = await searchParams
  const page = parsePageParam(pageRaw)
  const j = await resolveJudet(judet)
  if (!j) return { title: "Pagină negăsită", robots: { index: false } }

  const basePath = `/servicii-gaze/${judet}`
  const baseTitle = `Verificări și revizii gaze în județul ${j.nume} – firme autorizate ANRE`
  const description = `Toate firmele autorizate ANRE din județul ${j.nume} pentru verificarea la 2 ani, revizia la 10 ani și montaj detectoare.`

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
  const { judet } = await params
  const { page: pageRaw } = await searchParams
  const j = await resolveJudet(judet)
  if (!j) notFound()

  const allFirms = await fetchFirmsByGeo({ judetId: j.id })
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/servicii-gaze/${judet}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă" : "firme"} în județ.`
      : " Nicio firmă înregistrată încă."

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: "Servicii gaze", href: "/servicii-gaze" },
        { label: j.nume },
      ]}
      title={<>Servicii gaze în județul {j.nume}</>}
      lead={
        <>
          Firme autorizate <strong>ANRE</strong> din județul {j.nume} pentru verificări,
          revizii, montaj detectoare și reparații.{countLabel}
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
