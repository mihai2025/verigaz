// lib/equipment/catalog.ts
//
// Utilitar pentru a obține catalogul efectiv de echipamente al unei firme:
// defaults de platformă îmbinate cu override-urile/custom-urile firmei.
//
// Reguli de merge:
//   - Un rând din firm_equipment_types cu equipment_type_id != null → OVERRIDE pe default
//   - Un rând cu equipment_type_id = null → tip custom (doar la firma asta)
//   - Dacă firma n-a setat override, se folosește defaultul ca fallback
//   - Default-urile active dar fără override rămân în catalogul efectiv
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type EquipmentType = {
  id: string            // uuid firm_equipment sau "default-<serial>" pt defaults nesuprascrise
  source: "default" | "override" | "custom"
  firmEquipmentId: string | null    // uuid dacă source = override/custom
  defaultEquipmentId: number | null // serial dacă source = default/override
  slug: string | null               // slug-ul defaultului; null dacă e custom
  nume: string
  descriere: string | null
  verificare_months: number | null
  revizie_months: number | null
  service_category_slug: string | null
  is_active: boolean
}

/**
 * Returnează catalogul efectiv pentru o firmă: defaults active + override-uri + custom.
 */
export async function getFirmEquipmentCatalog(firmId: string): Promise<EquipmentType[]> {
  const admin = getServiceRoleSupabase()

  const [defRes, firmRes] = await Promise.all([
    admin
      .from("equipment_types")
      .select("id, slug, nume, descriere, verificare_months, revizie_months, service_category_slug, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order"),
    admin
      .from("firm_equipment_types")
      .select("id, equipment_type_id, nume, descriere, verificare_months, revizie_months, service_category_slug, is_active")
      .eq("firm_id", firmId),
  ])

  const defaults = (defRes.data ?? []) as Array<{
    id: number; slug: string; nume: string; descriere: string | null
    verificare_months: number | null; revizie_months: number | null
    service_category_slug: string | null; sort_order: number; is_active: boolean
  }>
  const overrides = (firmRes.data ?? []) as Array<{
    id: string; equipment_type_id: number | null; nume: string; descriere: string | null
    verificare_months: number | null; revizie_months: number | null
    service_category_slug: string | null; is_active: boolean
  }>

  const overrideByDefaultId = new Map<number, typeof overrides[number]>()
  const customs: typeof overrides = []
  for (const o of overrides) {
    if (o.equipment_type_id != null) overrideByDefaultId.set(o.equipment_type_id, o)
    else customs.push(o)
  }

  const out: EquipmentType[] = []

  // Pentru fiecare default, emite override dacă există, altfel defaultul
  for (const d of defaults) {
    const ov = overrideByDefaultId.get(d.id)
    if (ov) {
      out.push({
        id: ov.id,
        source: "override",
        firmEquipmentId: ov.id,
        defaultEquipmentId: d.id,
        slug: d.slug,
        nume: ov.nume || d.nume,
        descriere: ov.descriere ?? d.descriere,
        verificare_months: ov.verificare_months ?? d.verificare_months,
        revizie_months: ov.revizie_months ?? d.revizie_months,
        service_category_slug: ov.service_category_slug ?? d.service_category_slug,
        is_active: ov.is_active,
      })
    } else {
      out.push({
        id: `default-${d.id}`,
        source: "default",
        firmEquipmentId: null,
        defaultEquipmentId: d.id,
        slug: d.slug,
        nume: d.nume,
        descriere: d.descriere,
        verificare_months: d.verificare_months,
        revizie_months: d.revizie_months,
        service_category_slug: d.service_category_slug,
        is_active: d.is_active,
      })
    }
  }

  // Append custom (tipuri create de firmă fără default corespunzător)
  for (const c of customs) {
    out.push({
      id: c.id,
      source: "custom",
      firmEquipmentId: c.id,
      defaultEquipmentId: null,
      slug: null,
      nume: c.nume,
      descriere: c.descriere,
      verificare_months: c.verificare_months,
      revizie_months: c.revizie_months,
      service_category_slug: c.service_category_slug,
      is_active: c.is_active,
    })
  }

  return out
}

/**
 * Returnează catalogul default complet (admin platform view).
 */
export async function getDefaultEquipmentCatalog() {
  const admin = getServiceRoleSupabase()
  const { data } = await admin
    .from("equipment_types")
    .select("id, slug, nume, descriere, verificare_months, revizie_months, service_category_slug, sort_order, is_active")
    .order("sort_order")
  return (data ?? []) as Array<{
    id: number; slug: string; nume: string; descriere: string | null
    verificare_months: number | null; revizie_months: number | null
    service_category_slug: string | null; sort_order: number; is_active: boolean
  }>
}
