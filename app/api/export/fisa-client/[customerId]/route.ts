// app/api/export/fisa-client/[customerId]/route.ts
// Export PDF profesional pentru fișa unui client — cu antet firmă.
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { loadFisaClient } from "@/lib/clienti/fisa"
import { renderFisaClient } from "@/lib/pdf/templates/fisaClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const fisa = await loadFisaClient(firmId, customerId)
  if (!fisa) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const pdfBytes = await renderFisaClient(fisa)

  const custSlug = (fisa.customer.customer_type === "individual"
    ? [fisa.customer.first_name, fisa.customer.last_name].filter(Boolean).join("-")
    : fisa.customer.company_name)?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    ?? "client"

  const filename = `fisa-client-${custSlug}-${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
