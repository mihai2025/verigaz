import type { MetadataRoute } from "next"
import { DOMAIN } from "@/lib/config/domain"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/login",
          "/inregistrare",
          "/auth/",
          "/logout",
          "/magazin/cos",
          "/magazin/checkout",
          "/magazin/comanda/",
          "/programare/",
          "/verifica-document/",
        ],
      },
    ],
    sitemap: `${DOMAIN.baseUrl}/sitemap.xml`,
    host: DOMAIN.baseUrl,
  }
}
