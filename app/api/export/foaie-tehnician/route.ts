// app/api/export/foaie-tehnician/route.ts
import { NextResponse } from "next/server"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { fetchBookingsForTechnician } from "@/lib/reports/tehnicieni"
import { renderFoaieTehnician } from "@/lib/pdf/templates/foaieTehnician"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = new URL(request.url)
  const technicianIdParam = url.searchParams.get("tech")
  const technicianId =
    technicianIdParam === "unassigned" ? null
    : technicianIdParam || undefined
  const dateFrom = url.searchParams.get("from") ?? undefined
  const dateTo = url.searchParams.get("to") ?? undefined

  const admin = getServiceRoleSupabase()

  const [firmRes, techRes] = await Promise.all([
    admin
      .from("gas_firms")
      .select("brand_name, legal_name, anre_authorization_no, phone, email, sediu_adresa, logo_url")
      .eq("id", firmId)
      .maybeSingle(),
    technicianId
      ? admin
          .from("firm_employees")
          .select("full_name")
          .eq("id", technicianId)
          .eq("firm_id", firmId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!firmRes.data) return NextResponse.json({ error: "firm_not_found" }, { status: 404 })

  const technicianName =
    technicianId === undefined ? "Toți tehnicienii"
    : technicianId === null ? "Programări neasignate"
    : (techRes.data?.full_name as string | undefined) ?? "Tehnician necunoscut"

  const bookings = await fetchBookingsForTechnician(firmId, {
    technicianId,
    dateFrom,
    dateTo,
  })

  const pdfBytes = await renderFoaieTehnician({
    firm: firmRes.data as Parameters<typeof renderFoaieTehnician>[0]["firm"],
    technicianName,
    periodFrom: dateFrom ?? null,
    periodTo: dateTo ?? null,
    bookings,
  })

  const slugTech = technicianName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const filename = `foaie-${slugTech}-${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
