// app/revizii-centrala/[judet]/page.tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchFirmsByGeo, resolveJudet } from "@/lib/firms/fetchByGeo"
import { IscirCentralaInfoBlock, ListingShell } from "@/components/firms/ListingShell"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { slugifyRO } from "@/lib/utils/slugify"

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
    title: `Revizie centrală termică în județul ${j.nume}`,
    description: `Firme autorizate din județul ${j.nume} pentru revizia completă a centralei termice.`,
    alternates: { canonical: `/revizii-centrala/${judet}` },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { judet } = await params
  const j = await resolveJudet(judet)
  if (!j) notFound()

  const firms = await fetchFirmsByGeo({ judetId: j.id }, { categorySlug: "revizie-centrala" })
  const countLabel =
    firms.length > 0
      ? ` ${firms.length} ${firms.length === 1 ? "firmă" : "firme"} în județ.`
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
      infoSlot={<IscirCentralaInfoBlock kind="revizie" />}
    />
  )
}
