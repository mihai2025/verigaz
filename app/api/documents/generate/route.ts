// app/api/documents/generate/route.ts
// Endpoint autentificat pentru generare document pentru o programare finalizată.
// Accesibil doar owner-ului firmei care deține booking-ul sau admin-ilor.
import { NextResponse } from "next/server"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { buildDocumentForBooking } from "@/lib/pdf/buildDocument"
import { writeAudit } from "@/lib/audit/log"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { role, firmId } = await getUserRole(data.user.id)
  if (role === "user") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  let body: { bookingId?: string; technician?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }
  if (!body.bookingId) {
    return NextResponse.json({ ok: false, error: "missing_booking_id" }, { status: 400 })
  }

  // Verifică că booking-ul aparține firmei (pt firm_owner)
  if (role === "firm_owner") {
    const admin = getServiceRoleSupabase()
    const { data: b } = await admin
      .from("bookings")
      .select("firm_id")
      .eq("id", body.bookingId)
      .maybeSingle()
    if (!b || b.firm_id !== firmId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }
  }

  const result = await buildDocumentForBooking(body.bookingId, {
    technician: body.technician,
  })
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }

  await writeAudit({
    actorUserId: data.user.id,
    actorRole: role,
    action: "document.generate",
    entityType: "documents",
    entityId: result.documentId,
    summary: `Generat pentru booking ${body.bookingId}`,
    metadata: { bookingId: body.bookingId, publicRef: result.publicRef, sha256: result.sha256 },
  })

  return NextResponse.json(result)
}
