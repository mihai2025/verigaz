// app/api/export/verificari/route.ts
import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { fetchVerificariForFirm, type VerificariFilters } from "@/lib/reports/verificari"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function fmt(iso: string | null): string {
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
  if (role !== "firm_owner" || !firmId) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = new URL(request.url)
  const filters: VerificariFilters = {
    search: url.searchParams.get("q") ?? undefined,
    dateFrom: url.searchParams.get("from") ?? undefined,
    dateTo: url.searchParams.get("to") ?? undefined,
    dateMode: url.searchParams.get("mode") === "expires" ? "expires" : "issued",
    activeOnly: url.searchParams.get("active") === "1",
    docType: (["all", "gaz", "centrala"].includes(url.searchParams.get("type") ?? "") ? url.searchParams.get("type") : "all") as "all" | "gaz" | "centrala",
  }

  const rows = await fetchVerificariForFirm(firmId, filters)

  const wb = new ExcelJS.Workbook()
  wb.creator = "verigaz"
  wb.created = new Date()
  const ws = wb.addWorksheet("Verificări", { views: [{ state: "frozen", ySplit: 1 }] })

  ws.columns = [
    { header: "Nr. document", key: "doc", width: 18 },
    { header: "Tip document", key: "type", width: 22 },
    { header: "Tip echipament", key: "eqType", width: 22 },
    { header: "Marcă / Model", key: "eqBrand", width: 25 },
    { header: "Serie", key: "eqSerial", width: 20 },
    { header: "Data verificare", key: "issued", width: 13 },
    { header: "Data achiziție/instalare", key: "eqInstall", width: 18 },
    { header: "Valabilitate (expiră)", key: "valid", width: 15 },
    { header: "Adresă", key: "address", width: 50 },
    { header: "Client", key: "customer", width: 28 },
    { header: "Telefon", key: "phone", width: 15 },
    { header: "Tehnician", key: "tech", width: 25 },
    { header: "Observații", key: "obs", width: 40 },
    { header: "Status", key: "status", width: 12 },
  ]

  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B6B63" } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  ws.getRow(1).height = 24

  const typeLabel: Record<string, string> = {
    certificat_verificare: "Certificat verificare",
    proces_verbal_revizie: "Proces verbal revizie",
    fisa_tehnica_centrala: "VTP centrală",
    certificat_conformitate: "Certificat conformitate",
  }

  rows.forEach((r, idx) => {
    const row = ws.addRow({
      doc: r.documentNumber,
      type: typeLabel[r.documentType] ?? r.documentType,
      eqType: r.equipmentTypeName ?? "",
      eqBrand: [r.equipmentBrand, r.equipmentModel].filter(Boolean).join(" "),
      eqSerial: r.equipmentSerial ?? "",
      issued: fmt(r.issuedAt),
      eqInstall: fmt(r.equipmentInstallDate ?? r.equipmentManufactureDate),
      valid: fmt(r.validUntil),
      address: addressLine(r),
      customer: r.customerFullName,
      phone: r.customerPhone,
      tech: r.technician ?? "",
      obs: r.observations ?? r.equipmentObservations ?? "",
      status: r.revokedAt ? "REVOCAT" : "activ",
    })

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F8F6" } }
      })
    }
    row.alignment = { vertical: "middle", wrapText: true }
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "hair", color: { argb: "FFE5E7EB" } } }
    })

    if (r.revokedAt) {
      row.eachCell((cell) => {
        cell.font = { color: { argb: "FF991B1B" }, strike: true }
      })
    } else if (r.validUntil) {
      const days = (new Date(r.validUntil).getTime() - Date.now()) / 86400000
      if (days < 0) row.getCell("valid").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } }
      else if (days < 90) row.getCell("valid").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
    }
  })

  ws.addRow([
    `Total verificări: ${rows.length}`,
    "", "", "", "", "", "", "", "", "", "", "", "",
    `Export: ${new Date().toLocaleString("ro-RO")}`,
  ]).font = { italic: true, color: { argb: "FF6B7280" } }

  const buffer = await wb.xlsx.writeBuffer()
  const filename = `verificari-verigaz-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
