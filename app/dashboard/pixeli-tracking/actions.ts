"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/getUserRole"
import { setTrackingSettings, type TrackingSettings } from "@/lib/settings/appSettings"

type Result = { ok: true } | { ok: false; error: string }

export async function saveTrackingSettings(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, error: "Neautentificat." }
  const { role } = await getUserRole(data.user.id)
  if (role !== "admin") return { ok: false, error: "Doar adminii pot modifica setările." }

  const s = (k: string) => String(formData.get(k) ?? "").trim()
  const settings: TrackingSettings = {
    gaId: s("gaId"),
    fbPixelId: s("fbPixelId"),
    googleAdsId: s("googleAdsId"),
    googleAdsLabel: s("googleAdsLabel"),
    snapchatPixelId: s("snapchatPixelId"),
    pinterestTagId: s("pinterestTagId"),
  }

  // Validări simple
  if (settings.gaId && !/^G-[A-Z0-9]{6,}$/.test(settings.gaId)) {
    return { ok: false, error: "Google Analytics ID invalid. Format: G-XXXXXXXXXX" }
  }
  if (settings.googleAdsId && !/^AW-\d{6,}$/.test(settings.googleAdsId)) {
    return { ok: false, error: "Google Ads Conversion ID invalid. Format: AW-123456789" }
  }
  if (settings.fbPixelId && !/^[A-Za-z0-9]{8,}$/.test(settings.fbPixelId)) {
    return { ok: false, error: "Facebook Pixel ID invalid (8+ caractere alfanumerice)." }
  }

  await setTrackingSettings(settings, data.user.id)
  revalidatePath("/", "layout")
  revalidatePath("/dashboard/pixeli-tracking")
  return { ok: true }
}
