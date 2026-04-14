import type { Metadata } from "next"
import { DOMAIN } from "@/lib/config/domain"
import { CookieBanner } from "@/components/site/CookieBanner"
import { Header } from "@/components/site/Header"
import { Footer } from "@/components/site/Footer"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld"
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href={`https://${DOMAIN.cdnDomain}`} />
        <link rel="dns-prefetch" href={`https://${DOMAIN.cdnDomain}`} />
      </head>
      <body>
        <JsonLdScript data={[organizationJsonLd(), websiteJsonLd()]} />
        <Header />
        <main className="vg-main">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  )
}
