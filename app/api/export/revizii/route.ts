// app/api/export/revizii/route.ts
//
// Export Excel (.xlsx) pentru raportul de revizii al firmei curente.
// Autentificare: sesiunea Supabase (firm_owner sau admin).
import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { fetchReviziiForFirm, type ReviziiFilters } from "@/lib/reports/revizii"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("ro-RO")
}

function addressLine(r: {
  address: string; blockName: string | null; stair: string | null
  floor: string | null; apartment: string | null
  localitate: string | null; judet: string | null
}): string {
  const parts = [
    r.address,
    r.blockName && `bl. ${r.blockName}`,
    r.stair && `sc. ${r.stair}`,
    r.floor && `et. ${r.floor}`,
    r.apartment && `ap. ${r.apartment}`,
  ].filter(Boolean).join(", ")
  const geo = [r.localitate, r.judet].filter(Boolean).join(", ")
  return [parts, geo].filter(Boolean).join(" · ")
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const filters: ReviziiFilters = {
    search: url.searchParams.get("q") ?? undefined,
    dateFrom: url.searchParams.get("from") ?? undefined,
    dateTo: url.searchParams.get("to") ?? undefined,
    dateMode: (url.searchParams.get("mode") === "expires" ? "expires" : "issued") as "issued" | "expires",
    activeOnly: url.searchParams.get("active") === "1",
  }

  const rows = await fetchReviziiForFirm(firmId, filters)

  // Build workbook
  const wb = new ExcelJS.Workbook()
  wb.creator = "verigaz"
  wb.created = new Date()

  const ws = wb.addWorksheet("Revizii", {
    views: [{ state: "frozen", ySplit: 1 }],
  })

  ws.columns = [
    { header: "Nr. document", key: "doc", width: 18 },
    { header: "Data revizie", key: "issued", width: 13 },
    { header: "Valabilitate (expiră)", key: "valid", width: 15 },
    { header: "Data instalare rețea", key: "retea", width: 18 },
    { header: "Adresă", key: "address", width: 50 },
    { header: "Client", key: "customer", width: 28 },
    { header: "Telefon", key: "phone", width: 15 },
    { header: "Email", key: "email", width: 25 },
    { header: "Tehnician", key: "tech", width: 25 },
    { header: "Observații", key: "obs", width: 40 },
    { header: "Ref. programare", key: "bookingRef", width: 18 },
    { header: "Status", key: "status", width: 12 },
  ]

  // Header style
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B6B63" } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = { bottom: { style: "thin", color: { argb: "FF2B6B63" } } }
  })
  ws.getRow(1).height = 24

  rows.forEach((r, idx) => {
    const row = ws.addRow({
      doc: r.documentNumber,
      issued: formatDate(r.issuedAt),
      valid: formatDate(r.validUntil),
      retea: formatDate(r.retea_installation_date),
      address: addressLine(r),
      customer: r.customerFullName,
      phone: r.customerPhone,
      email: r.customerEmail ?? "",
      tech: r.technician ?? "",
      obs: r.observations ?? "",
      bookingRef: r.bookingRef ?? "",
      status: r.revokedAt ? "REVOCAT" : "activ",
    })

    // Zebra striping
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F8F6" } }
      })
    }

    row.alignment = { vertical: "middle", wrapText: true }
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
      }
    })

    // Mark revoked rows
    if (r.revokedAt) {
      row.eachCell((cell) => {
        cell.font = { color: { argb: "FF991B1B" }, strike: true }
      })
    }

    // Mark expiring soon (< 90 zile) în portocaliu
    if (r.validUntil && !r.revokedAt) {
      const days = (new Date(r.validUntil).getTime() - Date.now()) / 86400000
      if (days < 90 && days > 0) {
        row.getCell("valid").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
      } else if (days <= 0) {
        row.getCell("valid").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } }
      }
    }
  })

  // Footer row
  const footerRow = ws.addRow([
    `Total revizii: ${rows.length}`,
    "", "", "", "", "", "", "", "", "", "",
    `Export: ${new Date().toLocaleString("ro-RO")}`,
  ])
  footerRow.font = { italic: true, color: { argb: "FF6B7280" } }

  const buffer = await wb.xlsx.writeBuffer()
  const filename = `revizii-verigaz-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
