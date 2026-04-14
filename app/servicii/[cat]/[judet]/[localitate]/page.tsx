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

type Params = { cat: string; judet: string; localitate: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { cat, judet, localitate } = await params
  const [category, geo] = await Promise.all([
    resolveCategory(cat),
    resolveJudetLocalitate(judet, localitate),
  ])
  if (!category || !geo) return { title: "Pagină negăsită", robots: { index: false } }
  return {
    title: `${category.nume} în ${geo.localitate.nume}, ${geo.judet.nume}`,
    description:
      category.descriere ??
      `Firme autorizate pentru ${category.nume.toLowerCase()} în ${geo.localitate.nume} (${geo.judet.nume}).`,
    alternates: { canonical: `/servicii/${cat}/${judet}/${localitate}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { cat, judet, localitate } = await params
  const [category, geo] = await Promise.all([
    resolveCategory(cat),
    resolveJudetLocalitate(judet, localitate),
  ])
  if (!category || !geo) notFound()

  const firms = await fetchFirmsByGeo(
    { judetId: geo.judet.id, localitateId: geo.localitate.id },
    { categorySlug: category.slug },
  )
  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă găsită" : "firme găsite"}.`
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
      infoSlot={infoSlot}
    />
  )
}
