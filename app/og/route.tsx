// app/og/route.tsx
// Universal OG image generator pentru toate paginile.
// Suportă query params:
//   ?title=...           — titlu mare (max ~60 chars)
//   ?subtitle=...        — sub-titlu (max ~80 chars)
//   ?badge=...           — badge mic deasupra (ex: "FIRMĂ ANRE", "SERVICIU", "ARTICOL")
//   ?type=firma|judet|articol|serviciu|magazin  — variantă culoare
//
// Folosit din generateMetadata:
//   openGraph: { images: [`/og?title=...&subtitle=...&type=firma`] }
import { ImageResponse } from "next/og"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const PALETTES = {
  default: { bg: "#fbfbf9", accent: "#2b6b63", text: "#0c1424", subtle: "#6b7688" },
  firma:   { bg: "#0c1424", accent: "#fbbf24", text: "#fbfbf9", subtle: "#94a3b8" },
  judet:   { bg: "#fbfbf9", accent: "#2b6b63", text: "#0c1424", subtle: "#6b7688" },
  articol: { bg: "#fbfbf9", accent: "#b07a2a", text: "#0c1424", subtle: "#6b7688" },
  serviciu:{ bg: "#2b6b63", accent: "#fbbf24", text: "#fbfbf9", subtle: "#cbd5e1" },
  magazin: { bg: "#fbfbf9", accent: "#16a34a", text: "#0c1424", subtle: "#6b7688" },
} as const

function clip(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + "…"
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const title = clip(url.searchParams.get("title") ?? "Verificări gaze în România", 80)
  const subtitle = clip(url.searchParams.get("subtitle") ?? "verificari-gaze.ro", 100)
  const badge = url.searchParams.get("badge") ?? null
  const typeKey = (url.searchParams.get("type") ?? "default") as keyof typeof PALETTES
  const palette = PALETTES[typeKey] ?? PALETTES.default

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: palette.bg,
          display: "flex",
          flexDirection: "column",
          padding: "60px 70px",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          position: "relative",
        }}
      >
        {/* Bar decorativ sus */}
        <div style={{ width: "100%", height: 8, background: palette.accent, marginBottom: 40 }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 60 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: palette.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.bg,
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: palette.text }}>
            verificari-gaze.ro
          </div>
        </div>

        {/* Badge mic */}
        {badge && (
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: palette.accent,
              color: palette.bg,
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 8,
              alignSelf: "flex-start",
              marginBottom: 30,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {badge}
          </div>
        )}

        {/* Titlu mare */}
        <div
          style={{
            fontSize: title.length > 50 ? 56 : 72,
            fontWeight: 800,
            color: palette.text,
            lineHeight: 1.1,
            marginBottom: 24,
            display: "flex",
          }}
        >
          {title}
        </div>

        {/* Subtitlu */}
        {subtitle && (
          <div
            style={{
              fontSize: 28,
              color: palette.subtle,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Footer info */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 70,
            right: 70,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: palette.subtle,
            fontSize: 18,
          }}
        >
          <div>Firme autorizate ANRE • Verificări la 2 ani • Revizii la 10 ani</div>
          <div style={{ fontWeight: 700, color: palette.accent }}>verificari-gaze.ro</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
