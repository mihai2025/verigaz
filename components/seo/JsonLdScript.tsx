// components/seo/JsonLdScript.tsx
// Render JSON-LD în pagini server-side via dangerouslySetInnerHTML.
// Folosire:
//   <JsonLdScript data={organizationJsonLd()} />
//   <JsonLdScript data={[breadcrumbJsonLd(...), serviceJsonLd(...)]} />
import type { JsonLd } from "@/lib/seo/jsonld"

export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  const arr = Array.isArray(data) ? data : [data]
  return (
    <>
      {arr.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  )
}
