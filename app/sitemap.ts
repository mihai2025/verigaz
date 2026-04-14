import type { MetadataRoute } from "next"
import { DOMAIN } from "@/lib/config/domain"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sitemap static inițial. La pasul SEO programatic vom genera dinamic
  // paginile de județ/localitate/categorie din DB.
  return [
    {
      url: `${DOMAIN.baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${DOMAIN.baseUrl}/cauta`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${DOMAIN.baseUrl}/despre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]
}
