"use server"

import { revalidatePath } from "next/cache"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { scheduleReminderForBooking } from "@/lib/reminders/schedule"

type Result = { ok: true } | { ok: false; error: string }

async function requireFirm(bookingId: string) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false as const, error: "Nu ești autentificat." }
  const { role, firmId } = await getUserRole(data.user.id)
  if (role !== "firm_owner" || !firmId) return { ok: false as const, error: "Acces refuzat." }

  const admin = getServiceRoleSupabase()
  const { data: b } = await admin
    .from("bookings")
    .select("firm_id")
    .eq("id", bookingId)
    .maybeSingle()
  if (!b || b.firm_id !== firmId) return { ok: false as const, error: "Programarea nu-ți aparține." }
  return { ok: true as const, admin, firmId, userId: data.user.id }
}

export async function confirmBooking(bookingId: string, when?: string): Promise<Result> {
  const ctx = await requireFirm(bookingId)
  if (!ctx.ok) return ctx

  const patch: Record<string, unknown> = {
    status: when ? "scheduled" : "confirmed",
    confirmed_at: new Date().toISOString(),
  }
  if (when) patch.scheduled_start = new Date(when).toISOString()

  const { error } = await ctx.admin.from("bookings").update(patch).eq("id", bookingId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/programari")
  revalidatePath(`/dashboard/programari/${bookingId}`)
  return { ok: true }
}

export async function rejectBooking(bookingId: string, reason?: string): Promise<Result> {
  const ctx = await requireFirm(bookingId)
  if (!ctx.ok) return ctx

  const { error } = await ctx.admin
    .from("bookings")
    .update({
      status: "rejected",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason?.trim() || null,
    })
    .eq("id", bookingId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/programari")
  revalidatePath(`/dashboard/programari/${bookingId}`)
  return { ok: true }
}

export async function completeBooking(bookingId: string, priceFinal?: number): Promise<Result> {
  const ctx = await requireFirm(bookingId)
  if (!ctx.ok) return ctx

  const patch: Record<string, unknown> = {
    status: "completed",
    completed_at: new Date().toISOString(),
  }
  if (priceFinal != null && !Number.isNaN(priceFinal)) patch.price_final = priceFinal

  const { error } = await ctx.admin.from("bookings").update(patch).eq("id", bookingId)
  if (error) return { ok: false, error: error.message }

  // Scheduler reminder pe baza serviciului finalizat (non-blocking)
  const reminder = await scheduleReminderForBooking(bookingId)
  if (!reminder.ok) console.error("[completeBooking] schedule reminder:", reminder.error)

  revalidatePath("/dashboard/programari")
  revalidatePath(`/dashboard/programari/${bookingId}`)
  return { ok: true }
}

export async function assignTechnician(
  bookingId: string,
  employeeId: string | null,
): Promise<Result> {
  const ctx = await requireFirm(bookingId)
  if (!ctx.ok) return ctx

  if (employeeId) {
    // Verifică că angajatul aparține firmei
    const { data: emp } = await ctx.admin
      .from("firm_employees")
      .select("firm_id")
      .eq("id", employeeId)
      .maybeSingle()
    if (!emp || emp.firm_id !== ctx.firmId) {
      return { ok: false, error: "Angajat invalid." }
    }
  }

  const { error } = await ctx.admin
    .from("bookings")
    .update({ assigned_team_member_id: employeeId })
    .eq("id", bookingId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/programari")
  revalidatePath(`/dashboard/programari/${bookingId}`)
  return { ok: true }
}

export async function saveInternalNote(bookingId: string, note: string): Promise<Result> {
  const ctx = await requireFirm(bookingId)
  if (!ctx.ok) return ctx
  const { error } = await ctx.admin
    .from("bookings")
    .update({ notes_internal: note.trim() || null })
    .eq("id", bookingId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/programari/${bookingId}`)
  return { ok: true }
}
