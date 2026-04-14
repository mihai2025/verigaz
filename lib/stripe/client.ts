// lib/stripe/client.ts
// Server-side Stripe singleton.
import Stripe from "stripe"

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY")
  client = new Stripe(key, { apiVersion: "2024-12-18.acacia" })
  return client
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://verificari-gaze.ro"
}
