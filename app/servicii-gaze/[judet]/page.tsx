// app/servicii-gaze/[judet]/page.tsx
// Listing la nivel de județ — toate firmele autorizate ANRE din județ.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudet } from "@/lib/firms/fetchByGeo"
import { AnreInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"

// ISR: pagini regenerate la 1h; pre-renderate la build pentru toate 42 de județe.
export const revalidate = 3600

export async function generateStaticParams() {
  const supabase = getPublicServerSupabase()
  const { data } = await supabase.from("judete").select("nume")
  return (data ?? []).map((j) => ({ judet: slugifyRO(j.nume as string) }))
}

type Params = { judet: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { judet } = await params
  const j = await resolveJudet(judet)
  if (!j) return { title: "Pagină negăsită", robots: { index: false } }
  return {
    title: `Verificări și revizii gaze în județul ${j.nume} – firme autorizate ANRE`,
    description: `Toate firmele autorizate ANRE din județul ${j.nume} pentru verificarea la 2 ani, revizia la 10 ani și montaj detectoare.`,
    alternates: { canonical: `/servicii-gaze/${judet}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { judet } = await params
  const j = await resolveJudet(judet)
  if (!j) notFound()

  const firms = await fetchFirmsByGeo({ judetId: j.id })
  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă" : "firme"} în județ.`
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
      infoSlot={<AnreInfoBlock />}
    />
  )
}
