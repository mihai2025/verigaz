// app/dashboard/rapoarte/scadente/page.tsx
// Raport scadențe per echipament: verificare + revizie în next X zile.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"

type Props = {
  searchParams: Promise<{ window?: string }>
}

function custName(c: Record<string, unknown> | undefined): string {
  if (!c) return "—"
  if (c.customer_type === "individual") {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.full_name as string) || "—"
  }
  return (c.company_name as string) || (c.full_name as string) || "—"
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?redirect=/dashboard/rapoarte/scadente")
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport scadențe</h1>
        <p className="dash-note">
          Doar firmele pot accesa rapoartele.{" "}
          <Link href="/dashboard/adauga-firma">Adaugă firmă →</Link>
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const windowDays = Math.max(7, Math.min(365, Number(sp.window ?? 90) || 90))

  const admin = getServiceRoleSupabase()

  // 1. Echipamentele firmei = cele de pe proprietăți unde firma a avut booking
  const { data: bks } = await admin
    .from("bookings")
    .select("property_id")
    .eq("firm_id", firmId)
  const propertyIds = [...new Set((bks ?? []).map((b) => b.property_id as string))]

  if (propertyIds.length === 0) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Raport scadențe</h1>
        <p className="dash-note">Nu ai încă adrese asociate firmei. Așteaptă prima programare.</p>
      </div>
    )
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + windowDays)
  const maxDateIso = maxDate.toISOString().slice(0, 10)

  const { data: equipsRaw } = await admin
    .from("property_equipments")
    .select("id, property_id, brand, model, serial_number, installation_date, " +
            "last_verificare_at, next_verificare_due, last_revizie_at, next_revizie_due, " +
            "equipment_types:equipment_type_id(nume, slug), " +
            "firm_equipment_types:firm_equipment_type_id(nume)")
    .in("property_id", propertyIds)
    .eq("is_active", true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equips = (equipsRaw ?? []) as any[]

  const { data: propsRaw } = await admin
    .from("properties")
    .select("id, customer_id, address, block_name, apartment, " +
            "judete:judet_id(nume), localitati:localitate_id(nume)")
    .in("id", propertyIds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (propsRaw ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const propById = new Map<string, any>()
  for (const p of props) propById.set(p.id, p)

  const customerIds = [...new Set(props.map((p) => p.customer_id as string))]
  const { data: custsRaw } = customerIds.length
    ? await admin.from("customers")
        .select("id, full_name, first_name, last_name, company_name, customer_type, phone")
        .in("id", customerIds)
    : { data: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const custs = (custsRaw ?? []) as any[]
  const custById = new Map<string, Record<string, unknown>>()
  for (const c of custs) custById.set(c.id, c)

  // Construiește liniile de raport — una per (equipment, tip scadență)
  type Row = {
    equipment: string
    brandModel: string
    serial: string | null
    customer: string
    address: string
    dueDate: string
    daysUntil: number
    kind: "verificare" | "revizie"
    urgency: "overdue" | "7" | "30" | "60" | "later"
  }
  const rows: Row[] = []
  const now = Date.now()

  for (const eq of equips) {
    const prop = propById.get(eq.property_id)
    if (!prop) continue
    const cust = custById.get(prop.customer_id)
    const eqType = Array.isArray(eq.equipment_types) ? eq.equipment_types[0] : eq.equipment_types
    const firmEqType = Array.isArray(eq.firm_equipment_types) ? eq.firm_equipment_types[0] : eq.firm_equipment_types
    const equipment = firmEqType?.nume ?? eqType?.nume ?? "Echipament"
    const brandModel = [eq.brand, eq.model].filter(Boolean).join(" ")
    const address = [
      prop.address,
      prop.block_name && `bl. ${prop.block_name}`,
      prop.apartment && `ap. ${prop.apartment}`,
      prop.localitati?.nume,
      prop.judete?.nume,
    ].filter(Boolean).join(", ")

    const checkDue = (dueDate: string | null, kind: "verificare" | "revizie") => {
      if (!dueDate) return
      if (dueDate > maxDateIso && new Date(dueDate).getTime() > now) return
      const days = Math.round((new Date(dueDate).getTime() - now) / (1000 * 60 * 60 * 24))
      let urgency: Row["urgency"]
      if (days < 0) urgency = "overdue"
      else if (days <= 7) urgency = "7"
      else if (days <= 30) urgency = "30"
      else if (days <= 60) urgency = "60"
      else urgency = "later"
      rows.push({
        equipment,
        brandModel,
        serial: eq.serial_number ?? null,
        customer: custName(cust),
        address,
        dueDate,
        daysUntil: days,
        kind,
        urgency,
      })
    }
    checkDue(eq.next_verificare_due, "verificare")
    checkDue(eq.next_revizie_due, "revizie")
  }

  rows.sort((a, b) => a.daysUntil - b.daysUntil)

  const counts = {
    overdue: rows.filter((r) => r.urgency === "overdue").length,
    next7: rows.filter((r) => r.urgency === "7").length,
    next30: rows.filter((r) => r.urgency === "30").length,
    next60: rows.filter((r) => r.urgency === "60").length,
    total: rows.length,
  }

  const urgencyColor: Record<Row["urgency"], string> = {
    overdue: "#a01818",
    "7": "#c2410c",
    "30": "#a87400",
    "60": "#b45309",
    later: "#1e6b34",
  }

  return (
    <div className="dash-page">
      <h1 className="dash-title">Raport scadențe echipamente</h1>
      <p className="dash-subtle">
        Toate echipamentele firmei cu scadență în următoarele {windowDays} zile.
        Include verificări (24 luni), revizii (120 luni) și service-uri.
      </p>

      <form method="get" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <label>
          Fereastră (zile):
          <select name="window" defaultValue={String(windowDays)} onChange={(e) => e.currentTarget.form?.submit()}>
            <option value="7">7 zile</option>
            <option value="30">30 zile</option>
            <option value="60">60 zile</option>
            <option value="90">90 zile</option>
            <option value="180">180 zile</option>
            <option value="365">1 an</option>
          </select>
        </label>
      </form>

      <div className="dash-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: urgencyColor.overdue }}>{counts.overdue}</div>
          <div style={{ fontSize: 13 }}>Deja expirate</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: urgencyColor["7"] }}>{counts.next7}</div>
          <div style={{ fontSize: 13 }}>Expiră în 7 zile</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: urgencyColor["30"] }}>{counts.next30}</div>
          <div style={{ fontSize: 13 }}>Expiră în 30 zile</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: urgencyColor["60"] }}>{counts.next60}</div>
          <div style={{ fontSize: 13 }}>Expiră în 60 zile</div>
        </div>
        <div className="dash-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#14849b" }}>{counts.total}</div>
          <div style={{ fontSize: 13 }}>Total în fereastră</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="dash-note">Niciun echipament cu scadență în această fereastră.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Scadență</th>
              <th>Zile</th>
              <th>Tip</th>
              <th>Echipament</th>
              <th>Client</th>
              <th>Adresă</th>
              <th>Serie</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.dueDate).toLocaleDateString("ro-RO")}</td>
                <td style={{ color: urgencyColor[r.urgency], fontWeight: 600 }}>
                  {r.daysUntil < 0 ? `${Math.abs(r.daysUntil)} zile în urmă` : `în ${r.daysUntil} zile`}
                </td>
                <td>{r.kind === "verificare" ? "Verificare" : "Revizie"}</td>
                <td>
                  {r.equipment}
                  {r.brandModel && <div style={{ fontSize: 11, color: "#666" }}>{r.brandModel}</div>}
                </td>
                <td>{r.customer}</td>
                <td style={{ fontSize: 12 }}>{r.address}</td>
                <td>{r.serial ? <code style={{ fontSize: 11 }}>{r.serial}</code> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
