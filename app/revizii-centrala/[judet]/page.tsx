// app/revizii-centrala/[judet]/page.tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudet } from "@/lib/firms/fetchByGeo"
import { IscirCentralaInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"
import {
  buildPageUrl,
  paginate,
  parsePageParam,
} from "@/lib/pagination/firmList"
import { Paginator } from "@/components/ui/Paginator"

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

  const basePath = `/revizii-centrala/${judet}`
  const baseTitle = `Revizie centrală termică în județul ${j.nume}`
  const description = `Firme autorizate din județul ${j.nume} pentru revizia completă a centralei termice.`

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

  const allFirms = await fetchFirmsByGeo(
    { judetId: j.id },
    { categorySlug: "revizie-centrala" },
  )
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/revizii-centrala/${judet}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă" : "firme"} în județ.`
      : " Nicio firmă înregistrată încă."

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: "Revizie centrală termică", href: "/revizii-centrala" },
        { label: j.nume },
      ]}
      title={<>Revizie centrală termică în județul {j.nume}</>}
      lead={
        <>
          Firme autorizate din județul {j.nume} pentru revizia completă a centralei termice.
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
      infoSlot={<IscirCentralaInfoBlock kind="revizie" />}
    />
  )
}
