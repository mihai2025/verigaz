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

type Params = { cat: string; judet: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { cat, judet } = await params
  const [category, j] = await Promise.all([resolveCategory(cat), resolveJudet(judet)])
  if (!category || !j) return { title: "Pagină negăsită", robots: { index: false } }
  return {
    title: `${category.nume} în județul ${j.nume}`,
    description:
      category.descriere ??
      `Firme autorizate pentru ${category.nume.toLowerCase()} în județul ${j.nume}.`,
    alternates: { canonical: `/servicii/${cat}/${judet}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { cat, judet } = await params
  const [category, j] = await Promise.all([resolveCategory(cat), resolveJudet(judet)])
  if (!category || !j) notFound()

  const firms = await fetchFirmsByGeo({ judetId: j.id }, { categorySlug: category.slug })
  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă" : "firme"} în județ.`
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
      infoSlot={infoSlot}
    />
  )
}
