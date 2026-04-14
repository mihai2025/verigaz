// lib/analytics/useAnalytics.ts
//
// Stub pentru analytics pipeline — MVP verigaz nu are tracking implementat.
// Păstrează API-ul compatibil cu ghidulfunerar pentru ca CautaTracker și alte
// hook-uri să poată importa fără modificări. Implementare reală: event queue
// + POST /api/analytics/search-impressions (backlog).

export function trackSearchImpressions(_firmIds: string[]): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics stub] search impressions:", _firmIds.length)
  }
}

export function trackFirmClick(_firmId: string, _source: string): void {
  // no-op
}

export function trackFirmCall(_firmId: string): void {
  // no-op
}

export function trackFirmWhatsApp(_firmId: string): void {
  // no-op
}
