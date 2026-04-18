import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { DOMAIN } from "@/lib/config/domain"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
})
import { CookieBanner } from "@/components/site/CookieBanner"
import { SiteShell } from "@/components/site/SiteShell"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { TrackingScripts } from "@/components/seo/TrackingScripts"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld"
import { createClient, getServiceRoleSupabase } from "@/lib/supabase/server"
import { getTrackingSettings } from "@/lib/settings/appSettings"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN.baseUrl),
  title: {
    default: `${DOMAIN.brandName} – ${DOMAIN.metaTitleDefault}`,
    template: DOMAIN.metaTitleTemplate,
  },
  description: DOMAIN.metaDescription,
  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: `${DOMAIN.baseUrl}/`,
    siteName: DOMAIN.brandName,
    title: `${DOMAIN.brandName} – ${DOMAIN.metaTitleDefault}`,
    description: DOMAIN.metaOgDescription,
    images: [{ url: `/og?title=${encodeURIComponent(DOMAIN.metaTitleDefault)}&subtitle=${encodeURIComponent("Firme autorizate ANRE")}&type=default`, width: 1200, height: 630 }],
  },

  twitter: {
    card: "summary_large_image",
    title: `${DOMAIN.brandName} – ${DOMAIN.metaTitleDefault}`,
    description: DOMAIN.metaTwitterDescription,
    images: [`/og?title=${encodeURIComponent(DOMAIN.metaTitleDefault)}&subtitle=${encodeURIComponent("Firme autorizate ANRE")}&type=default`],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

async function getHeaderUser() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null
    let firstName: string | null = null
    try {
      const admin = getServiceRoleSupabase()
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name")
        .eq("user_id", data.user.id)
        .maybeSingle()
      firstName = (prof as { full_name: string | null } | null)?.full_name ?? null
    } catch {
      firstName = null
    }
    return { firstName, email: data.user.email ?? null }
  } catch {
    return null
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headerUser, tracking] = await Promise.all([
    getHeaderUser(),
    getTrackingSettings().catch(() => null),
  ])
  return (
    <html lang="ro-RO" className={inter.variable}>
      <head>
        <link rel="preconnect" href={`https://${DOMAIN.cdnDomain}`} />
        <link rel="dns-prefetch" href={`https://${DOMAIN.cdnDomain}`} />
      </head>
      <body>
        <JsonLdScript data={[organizationJsonLd(), websiteJsonLd()]} />
        {tracking && <TrackingScripts settings={tracking} />}
        <SiteShell headerUser={headerUser}>{children}</SiteShell>
        <CookieBanner />
      </body>
    </html>
  )
}
