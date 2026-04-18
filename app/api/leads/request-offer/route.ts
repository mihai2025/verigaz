// app/api/leads/request-offer/route.ts
// Primește request de ofertă rapidă — creează lead + trimite SMS la firma țintă.
import { NextResponse } from "next/server"
import { getServiceRoleSupabase } from "@/lib/supabase/server"
import { selectTargetFirm } from "@/lib/leads/selectTargetFirm"
import { normalizePhoneSms, sendSms } from "@/lib/sms/smsadvert"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  customerName?: string
  customerPhone?: string
  serviceCategorySlug?: string   // ex: verificare-instalatie
  judetId?: number
  localitateId?: number | null
  firmSlug?: string | null       // dacă lead vine din profilul unei firme
  source?: string                 // ex: 'home_modal' | 'firma_auto' | 'header'
}

export async function POST(req: Request) {
  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: "Payload invalid." }, { status: 400 }) }

  const name = (body.customerName ?? "").trim()
  const phoneRaw = (body.customerPhone ?? "").trim()
  const serviceSlug = (body.serviceCategorySlug ?? "").trim()
  const judetId = Number(body.judetId)
  const localitateId = body.localitateId != null ? Number(body.localitateId) : null
  const firmSlug = body.firmSlug || null
  const source = (body.source ?? "unknown").slice(0, 60)

  if (!name || name.length < 3) return NextResponse.json({ ok: false, error: "Numele e obligatoriu." }, { status: 400 })
  if (!phoneRaw) return NextResponse.json({ ok: false, error: "Telefonul e obligatoriu." }, { status: 400 })
  if (!serviceSlug) return NextResponse.json({ ok: false, error: "Alege serviciul dorit." }, { status: 400 })
  if (!judetId || !Number.isFinite(judetId)) return NextResponse.json({ ok: false, error: "Județul e obligatoriu." }, { status: 400 })
  if (!localitateId || !Number.isFinite(localitateId)) return NextResponse.json({ ok: false, error: "Localitatea e obligatorie." }, { status: 400 })

  const normalizedPhone = normalizePhoneSms(phoneRaw)
  if (!normalizedPhone) return NextResponse.json({ ok: false, error: "Telefon invalid. Folosește format 07XX XXX XXX." }, { status: 400 })

  const admin = getServiceRoleSupabase()

  // Categorie serviciu
  const { data: cat } = await admin
    .from("service_categories")
    .select("id, slug, nume")
    .eq("slug", serviceSlug)
    .maybeSingle()
  if (!cat) return NextResponse.json({ ok: false, error: "Serviciu necunoscut." }, { status: 400 })

  // Firma țintă
  const target = await selectTargetFirm({ judetId, localitateId, firmSlug })
  if (!target) return NextResponse.json({ ok: false, error: "Nu am găsit o firmă disponibilă în zona ta. Te contactăm noi în 24h." }, { status: 200 })

  // Lookup localitate + județ nume (pentru SMS)
  const [judetRes, locRes] = await Promise.all([
    admin.from("judete").select("nume").eq("id", judetId).maybeSingle(),
    admin.from("localitati").select("nume").eq("id", localitateId).maybeSingle(),
  ])
  const judetNume = (judetRes.data as { nume?: string } | null)?.nume ?? ""
  const locNume = (locRes.data as { nume?: string } | null)?.nume ?? ""

  // Insert lead
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .insert({
      full_name: name,
      phone: normalizedPhone,
      judet_id: judetId,
      localitate_id: localitateId,
      service_category_id: cat.id,
      message: `Cerere rapidă ofertă din ${source}`,
      preferred_firm_id: firmSlug ? target.id : null,
      assigned_firm_id: target.id,
      status: "assigned",
      source,
      assigned_at: new Date().toISOString(),
    })
    .select("id")
    .single()
  if (leadErr || !lead) return NextResponse.json({ ok: false, error: "Eroare salvare lead." }, { status: 500 })

  // SMS către firma
  const firmName = target.brand_name || target.legal_name
  const body_sms = [
    `Verigaz: cerere noua pt ${cat.nume}`,
    `Client ${name} tel ${normalizedPhone}`,
    `Zona ${locNume}, ${judetNume}`,
    `Raspunde in 24h`,
  ].join(". ").slice(0, 160)

  const res = await sendSms(target.phone!, body_sms)

  // Log SMS
  await admin.from("sms_logs").insert({
    phone: target.phone,
    body: body_sms,
    template_key: "lead_offer_request",
    status: res.ok ? "sent" : "failed",
    error_message: res.ok ? null : res.error,
    lead_id: lead.id,
    firm_id: target.id,
    direction: "outbound",
  })

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    firmName,
    message: res.ok
      ? `Am trimis cererea la ${firmName}. Te contactează în 24h.`
      : `Cererea ta e înregistrată. Firma va fi notificată imediat ce revine serviciul SMS.`,
  })
}
