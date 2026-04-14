// lib/geo/county-centroids.ts

type CountyCentroid = { name: string; lat: number; lng: number }

/** Approximate geographic centers for all 42 Romanian counties (41 + Bucharest) */
export const COUNTY_CENTROIDS: CountyCentroid[] = [
  { name: "Alba", lat: 46.07, lng: 23.58 },
  { name: "Arad", lat: 46.18, lng: 21.32 },
  { name: "Argeș", lat: 44.86, lng: 24.87 },
  { name: "Bacău", lat: 46.57, lng: 26.91 },
  { name: "Bihor", lat: 47.05, lng: 22.07 },
  { name: "Bistrița-Năsăud", lat: 47.13, lng: 24.50 },
  { name: "Botoșani", lat: 47.75, lng: 26.67 },
  { name: "Brăila", lat: 45.27, lng: 27.97 },
  { name: "Brașov", lat: 45.66, lng: 25.61 },
  { name: "București", lat: 44.43, lng: 26.10 },
  { name: "Buzău", lat: 45.15, lng: 26.83 },
  { name: "Călărași", lat: 44.21, lng: 26.99 },
  { name: "Caraș-Severin", lat: 45.08, lng: 21.88 },
  { name: "Cluj", lat: 46.77, lng: 23.60 },
  { name: "Constanța", lat: 44.18, lng: 28.64 },
  { name: "Covasna", lat: 45.84, lng: 26.18 },
  { name: "Dâmbovița", lat: 44.93, lng: 25.45 },
  { name: "Dolj", lat: 44.32, lng: 23.80 },
  { name: "Galați", lat: 45.73, lng: 27.93 },
  { name: "Giurgiu", lat: 44.03, lng: 25.97 },
  { name: "Gorj", lat: 45.05, lng: 23.28 },
  { name: "Harghita", lat: 46.36, lng: 25.80 },
  { name: "Hunedoara", lat: 45.75, lng: 22.90 },
  { name: "Ialomița", lat: 44.57, lng: 26.93 },
  { name: "Iași", lat: 47.16, lng: 27.59 },
  { name: "Ilfov", lat: 44.50, lng: 26.08 },
  { name: "Maramureș", lat: 47.66, lng: 24.08 },
  { name: "Mehedinți", lat: 44.63, lng: 22.90 },
  { name: "Mureș", lat: 46.54, lng: 24.56 },
  { name: "Neamț", lat: 46.93, lng: 26.37 },
  { name: "Olt", lat: 44.44, lng: 24.36 },
  { name: "Prahova", lat: 45.09, lng: 25.94 },
  { name: "Satu Mare", lat: 47.79, lng: 22.89 },
  { name: "Sălaj", lat: 47.21, lng: 23.06 },
  { name: "Sibiu", lat: 45.80, lng: 24.15 },
  { name: "Suceava", lat: 47.64, lng: 25.59 },
  { name: "Teleorman", lat: 44.00, lng: 25.24 },
  { name: "Timiș", lat: 45.76, lng: 21.23 },
  { name: "Tulcea", lat: 45.18, lng: 28.80 },
  { name: "Vaslui", lat: 46.64, lng: 27.73 },
  { name: "Vâlcea", lat: 45.10, lng: 24.37 },
  { name: "Vrancea", lat: 45.70, lng: 27.00 },
]

/** Haversine distance in km between two lat/lng points */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Find the nearest Romanian county name from lat/lng */
export function getNearestCountyName(lat: number, lng: number): string | null {
  let best: CountyCentroid | null = null
  let bestDist = Infinity

  for (const c of COUNTY_CENTROIDS) {
    const d = haversineKm(lat, lng, c.lat, c.lng)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }

  return best?.name ?? null
}
