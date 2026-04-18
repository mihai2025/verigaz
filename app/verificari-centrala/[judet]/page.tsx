// app/verificari-centrala/[judet]/page.tsx
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

  const basePath = `/verificari-centrala/${judet}`
  const baseTitle = `Verificare centrală termică (VTP) în județul ${j.nume}`
  const description = `Firme autorizate ISCIR din județul ${j.nume} pentru verificarea tehnică periodică a centralei termice.`

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
    { categorySlug: "verificare-centrala" },
  )
  const { items: firms, totalPages, currentPage } = paginate(
    allFirms,
    parsePageParam(pageRaw),
  )

  const basePath = `/verificari-centrala/${judet}`
  const countLabel =
    allFirms.length > 0
      ? ` ${allFirms.length} ${allFirms.length === 1 ? "firmă" : "firme"} în județ.`
      : " Nicio firmă înregistrată încă."

  return (
    <ListingShell
      breadcrumbs={[
        { label: "Acasă", href: "/" },
        { label: "Verificare centrală termică", href: "/verificari-centrala" },
        { label: j.nume },
      ]}
      title={<>Verificare centrală termică în județul {j.nume}</>}
      lead={
        <>
          Firme autorizate <strong>ISCIR</strong> din județul {j.nume} pentru VTP centrală
          termică.{countLabel}
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
