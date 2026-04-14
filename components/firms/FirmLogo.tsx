// components/firms/FirmLogo.tsx
//
// Afișează logo-ul firmei dacă există (img), altfel SVG cu inițialele firmei
// (după strip SRL/SA/SC etc). Culoarea e derivată deterministic din nume pt
// varietate vizuală în listing.
import { firmColorIndex, firmInitials } from "@/lib/utils/firmInitials"

const PALETTE = [
  { bg: "#2b6b63", fg: "#ffffff" },  // teal
  { bg: "#b07a2a", fg: "#ffffff" },  // gold
  { bg: "#0c4a6e", fg: "#ffffff" },  // navy
  { bg: "#7c2d12", fg: "#ffffff" },  // burgundy
  { bg: "#1e293b", fg: "#fbbf24" },  // dark + gold
  { bg: "#064e3b", fg: "#ffffff" },  // emerald
  { bg: "#4338ca", fg: "#ffffff" },  // indigo
  { bg: "#be185d", fg: "#ffffff" },  // rose
]

export type FirmLogoProps = {
  logoUrl?: string | null
  firmName: string
  size?: number
  className?: string
  alt?: string
  rounded?: boolean
}

export function FirmLogo({
  logoUrl,
  firmName,
  size = 96,
  className,
  alt,
  rounded = false,
}: FirmLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={alt ?? `Logo ${firmName}`}
        width={size}
        height={size}
        className={className}
        loading="lazy"
        decoding="async"
        style={{
          objectFit: "cover",
          borderRadius: rounded ? "50%" : 12,
        }}
      />
    )
  }

  const initials = firmInitials(firmName, 2)
  const color = PALETTE[firmColorIndex(firmName, PALETTE.length)]
  const fontSize = Math.round(size * (initials.length === 1 ? 0.5 : 0.4))

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={alt ?? `Inițiale ${firmName}`}
      style={{ borderRadius: rounded ? "50%" : 12, display: "block" }}
    >
      <rect width="100" height="100" rx={rounded ? 50 : 12} fill={color.bg} />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color.fg}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontWeight="800"
        fontSize={fontSize}
        letterSpacing="-0.02em"
      >
        {initials}
      </text>
    </svg>
  )
}
