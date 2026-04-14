// app/servicii-gaze/[judet]/[localitate]/page.tsx
// Pagina canonical de listing: toate firmele autorizate ANRE în localitate.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudetLocalitate } from "@/lib/firms/fetchByGeo"
import { AnreInfoBlock, ListingShell } from "@/components/firms/ListingShell"

// ISR: ~7k combinații (judet × localitate cu semnal) — nu pre-rendering,
// doar cache pe primul hit + revalidat la 1h.
export const revalidate = 3600

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
    title: `Verificări și revizii gaze în ${geo.localitate.nume}, ${geo.judet.nume} – firme autorizate ANRE`,
    description: `Firme autorizate ANRE din ${geo.localitate.nume} (${geo.judet.nume}) pentru verificarea la 2 ani, revizia la 10 ani, montaj detectoare și reparații instalații gaze.`,
    alternates: { canonical: `/servicii-gaze/${judet}/${localitate}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { judet, localitate } = await params
  const geo = await resolveJudetLocalitate(judet, localitate)
  if (!geo) notFound()

  const firms = await fetchFirmsByGeo({
    judetId: geo.judet.id,
    localitateId: geo.localitate.id,
  })

  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă găsită" : "firme găsite"}.`
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
      infoSlot={<AnreInfoBlock />}
    />
  )
}
