// app/servicii/[cat]/page.tsx
// Landing național premium pentru o categorie de serviciu.
export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import { resolveCategory } from "@/lib/firms/fetchByGeo"
import { slugifyRO } from "@/lib/utils/slugify"
import { JsonLdScript } from "@/components/seo/JsonLdScript"
import { breadcrumbJsonLd, serviceJsonLd, faqJsonLd } from "@/lib/seo/jsonld"
import { DOMAIN } from "@/lib/config/domain"

type Params = { cat: string }

const CAT_ICONS: Record<string, string> = {
  "verificare-instalatie": "🔧",
  "revizie-instalatie": "⚙️",
  "montaj-detector": "🚨",
  "service-detector": "📡",
  "reparatii-instalatie": "🛠️",
  "verificare-centrala": "🔥",
  "revizie-centrala": "♻️",
}

const CAT_CTA_TEXT: Record<string, { hero: string; why: string[] }> = {
  "verificare-instalatie": {
    hero: "Verificarea instalației de gaze e obligatorie la **maxim 2 ani** conform ANRE Ord. 179/2015. Firmele din listă sunt autorizate ANRE.",
    why: [
      "Conformitate cu Ord. ANRE 179/2015 — eviți amenzi 1.000–10.000 lei",
      "Proces verbal valabil pentru asigurator + distribuitor gaz",
      "Siguranță — detectare scurgeri, coroziune, tubulaturi neconforme",
    ],
  },
  "revizie-instalatie": {
    hero: "Revizia instalației de gaze se face la **maxim 10 ani** (sau mai des dacă ai modificat instalația). Obligatorie pentru aviz distribuitor.",
    why: [
      "Verificare tehnică aprofundată — toate componentele înlocuite la nevoie",
      "Certificat ANRE valabil la distribuitor (Distrigaz, Delgaz)",
      "Prelungește viața instalației cu 10+ ani",
    ],
  },
  "montaj-detector": {
    hero: "Montajul detectorului de gaze metan + CO e **recomandat la toate apartamentele și casele** cu centrală, aragaz sau sobă pe gaz. Firmele ANRE montează corect.",
    why: [
      "Detectare scurgeri în <30 secunde — alertă sonoră + vizuală",
      "Certificat EN 50194 / EN 50291 montat conform normelor",
      "Integrare cu electrovalvă de închidere automată",
    ],
  },
  "service-detector": {
    hero: "Detectoarele de gaze se calibrează și se verifică anual. Firmele ANRE din listă asigură service autorizat pentru toate brandurile.",
    why: [
      "Calibrare senzor MEMS după 12 luni de utilizare",
      "Înlocuire filtru + baterie + senzor CO (expirare ~5 ani)",
      "Test funcțional cu gaz etalon + raport service",
    ],
  },
  "reparatii-instalatie": {
    hero: "Reparațiile de urgență la instalația de gaze necesită firmă ANRE. Intervenții rapide pentru scurgeri, robineți defecți, tubulaturi.",
    why: [
      "Intervenție 24/7 pentru urgențe (scurgere gaz) — sunați 0 800 877 778",
      "Schimbare robinet, flexibil, regulator, electrovalvă",
      "Reautorizare distribuitor după reparație majoră",
    ],
  },
  "verificare-centrala": {
    hero: "Verificarea Tehnică Periodică (VTP) a centralei e obligatorie **anual**. Prelungește garanția + detectează defecte înainte să defecteze complet.",
    why: [
      "Garanție prelungită la producător (Viessmann, Vaillant, Ariston etc.)",
      "Consum redus cu 10–15% după reglarea arderii + curățare schimbător",
      "Raport VTP cu valori CO/CO₂ + presiune gaz",
    ],
  },
  "revizie-centrala": {
    hero: "Revizia centralei termice curăță schimbătorul, arzătorul, verifică circulația + presiunea. Obligatorie înaintea fiecărei perioade de iarnă.",
    why: [
      "Curățare completă schimbător principal + secundar",
      "Verificare circulație pompă, vas expansiune, manometru",
      "Tarifare corectă: 200–350 lei (fără piese schimbate)",
    ],
  },
}

const CAT_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  "verificare-instalatie": [
    { q: "Cât costă verificarea instalației?", a: "Între 150–350 lei pentru apartament standard, în funcție de număr de puncte de consum. Solicită ofertă directă." },
    { q: "Ce primesc după verificare?", a: "Un proces verbal ANRE semnat + ștampilat, valabil la distribuitor și asigurator 2 ani." },
    { q: "Pot să amân verificarea?", a: "Nu. Distribuitorul poate suspenda gazul dacă documentul expiră. Amenzile pornesc de la 1.000 lei." },
  ],
  "revizie-instalatie": [
    { q: "Cât costă revizia?", a: "300–700 lei pentru apartament standard; mai mult la casă cu multe puncte. Include componente verificate, înlocuire dacă e cazul." },
    { q: "Cât ține revizia?", a: "Între 2–4 ore pentru apartament. La casă poate dura o zi întreagă." },
    { q: "Ce obligație am?", a: "Revizia e obligatorie la maxim 10 ani, dar și după orice modificare majoră a instalației (adăugare centrală, schimbare traseu, etc)." },
  ],
  "montaj-detector": [
    { q: "Ce detector recomandați?", a: "Unul certificat EN 50194 (gaz metan) + EN 50291 (CO). Branduri recomandate: Honeywell, Kidde, Beghelli." },
    { q: "Unde se montează?", a: "Detector gaz metan — sus (aproape de tavan). Detector CO — la înălțimea ochilor. Firma ANRE te sfătuiește pentru apartament/casă." },
    { q: "Detectorul trebuie conectat la electrovalvă?", a: "Recomandat — electrovalva închide gazul automat la detectare scurgere. Montaj cu firmă ANRE obligatoriu." },
  ],
  "service-detector": [
    { q: "Cât de des se calibrează?", a: "Anual, conform producătorului. După 5 ani, senzorul CO se înlocuiește complet." },
    { q: "Cât durează?", a: "15–30 minute pentru un detector. Primesti raport service cu valori măsurate." },
  ],
  "reparatii-instalatie": [
    { q: "Sunt urgențe 24/7?", a: "Pentru scurgere gaz activă, sună 0 800 877 778 (Distrigaz) sau 0 800 800 928 (Delgaz) — gratuit, intervenție imediată. Firmele din listă fac reparații planificate." },
    { q: "Cât costă o reparație?", a: "Diagnosticare ~100 lei. Schimbare robinet/flexibil: 80–300 lei (fără manoperă). Depinde de complexitate." },
  ],
  "verificare-centrala": [
    { q: "Cât costă VTP?", a: "150–300 lei pentru centrală standard. Include reglaj ardere, test CO/CO₂, verificare presiune, curățare minimă." },
    { q: "Ce primesc?", a: "Proces verbal VTP cu valori măsurate (CO/CO₂, presiune gaz, temperatura gaze arse). Valabil 1 an." },
  ],
  "revizie-centrala": [
    { q: "Cât costă revizia anuală?", a: "200–400 lei pentru centrală standard (fără piese schimbate). Mai mult dacă schimbător blocat sau arzător înfundat." },
    { q: "E obligatorie revizia?", a: "Da, pentru menținerea garanției la producător (Viessmann, Vaillant, Bosch etc.). Recomandat toamna, înainte de iarnă." },
  ],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { cat } = await params
  const category = await resolveCategory(cat)
  if (!category) return { title: "Pagină negăsită", robots: { index: false } }
  return {
    title: `${category.nume} — firme autorizate ANRE în România`,
    description: category.descriere ?? `Firme autorizate ANRE pentru ${category.nume.toLowerCase()}. Programare online, preț transparent, certificat digital.`,
    alternates: { canonical: `/servicii/${cat}` },
    openGraph: {
      title: category.nume,
      description: category.descriere ?? `Firme autorizate ANRE pentru ${category.nume.toLowerCase()}.`,
      url: `${DOMAIN.baseUrl}/servicii/${cat}`,
      images: [{ url: `/og?title=${encodeURIComponent(category.nume)}&subtitle=${encodeURIComponent("Firme autorizate ANRE")}&type=serviciu`, width: 1200, height: 630 }],
    },
  }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { cat } = await params
  const category = await resolveCategory(cat)
  if (!category) notFound()

  const supabase = getPublicServerSupabase()

  const { data: firmsGeo } = await supabase
    .from("gas_firms")
    .select("sediu_judet_id, judete:sediu_judet_id(nume), firm_services!inner(service_category_id)")
    .eq("is_active", true)
    .eq("verification_status", "approved")
    .eq("firm_services.service_category_id", category.id)
    .limit(3000)

  const judetCounts = new Map<number, { nume: string; count: number }>()
  for (const f of (firmsGeo ?? []) as unknown as Array<{
    sediu_judet_id: number | null
    judete: { nume: string } | { nume: string }[] | null
  }>) {
    if (f.sediu_judet_id == null) continue
    const j = Array.isArray(f.judete) ? f.judete[0] : f.judete
    if (!j) continue
    const cur = judetCounts.get(f.sediu_judet_id)
    if (cur) cur.count += 1
    else judetCounts.set(f.sediu_judet_id, { nume: j.nume, count: 1 })
  }
  const allJudete = [...judetCounts.values()].sort((a, b) => b.count - a.count)
  const totalFirms = allJudete.reduce((s, j) => s + j.count, 0)

  const icon = CAT_ICONS[cat] ?? "🔧"
  const ctaInfo = CAT_CTA_TEXT[cat]
  const faq = CAT_FAQ[cat] ?? []

  const breadcrumbs = [
    { label: "Acasă", href: "/" },
    { label: "Servicii", href: "/servicii" },
    { label: category.nume },
  ]

  return (
    <>
      <JsonLdScript data={[
        breadcrumbJsonLd(breadcrumbs),
        serviceJsonLd({
          name: category.nume,
          description: category.descriere ?? `Firme autorizate ANRE pentru ${category.nume.toLowerCase()} în România.`,
          url: `${DOMAIN.baseUrl}/servicii/${cat}`,
          areaServed: "Romania",
        }),
        ...(faq.length > 0 ? [faqJsonLd(faq.map((f) => ({ question: f.q, answer: f.a })))] : []),
      ]} />

      <section className="vg-hero">
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">
            <span style={{ marginRight: 6, fontSize: 20 }}>{icon}</span>
            Serviciu autorizat ANRE
          </span>
          <h1 className="vg-hero__title">{category.nume}</h1>
          <p className="vg-hero__sub">
            {category.descriere ?? ctaInfo?.hero.replace(/\*\*(.+?)\*\*/g, "$1")}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 18 }}>
            <Link href="/programare" className="vg-btn vg-btn--primary vg-btn--lg">
              Programează online →
            </Link>
            <Link href="#judete" className="vg-btn vg-btn--ghost vg-btn--lg">
              Vezi firme pe județ
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-600)" }}>
            ✓ <strong>{totalFirms}</strong> firme autorizate ANRE · ✓ certificat digital · ✓ reminder SMS automat
          </p>
        </div>
      </section>

      {ctaInfo && (
        <section className="vg-section">
          <div className="container">
            <div className="vg-section__head">
              <p className="vg-section__kicker">De ce contează</p>
              <h2 className="vg-section__title">Ce primești cu {category.nume.toLowerCase()}</h2>
            </div>
            <div className="vg-values">
              {ctaInfo.why.map((w, i) => (
                <div key={i} className="vg-value-card">
                  <div className="vg-value-card__icon">{["✓", "📄", "🛡️"][i] ?? "•"}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-700)" }}>{w}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="vg-section" style={{ background: "var(--surface-2)" }} id="judete">
        <div className="container">
          <div className="vg-section__head">
            <p className="vg-section__kicker">Firme pe județ</p>
            <h2 className="vg-section__title">Alege județul tău</h2>
            <p className="vg-section__sub">
              Toate firmele sunt autorizate ANRE. Programarea e gratuită — plătești direct firmei după intervenție.
            </p>
          </div>

          {allJudete.length === 0 ? (
            <div className="vg-empty" style={{ textAlign: "center", padding: 40 }}>
              <p>Nu avem încă firme verificate pentru acest serviciu.</p>
              <Link href="/pentru-firme" className="vg-btn vg-btn--primary">Ești firmă ANRE? Listează gratuit →</Link>
            </div>
          ) : (
            <div className="vg-judete">
              {allJudete.map((j) => (
                <Link key={j.nume} href={`/servicii/${cat}/${slugifyRO(j.nume)}`} className="vg-judet-card">
                  <div className="vg-judet-card__name">{j.nume}</div>
                  <div className="vg-judet-card__count">{j.count} firme</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {faq.length > 0 && (
        <section className="vg-section">
          <div className="container" style={{ maxWidth: 820 }}>
            <div className="vg-section__head">
              <p className="vg-section__kicker">Întrebări frecvente</p>
              <h2 className="vg-section__title">Răspunsuri la întrebări uzuale</h2>
            </div>
            <div className="vg-faq">
              {faq.map((item, i) => (
                <details key={i} className="vg-faq__item">
                  <summary className="vg-faq__q">{item.q}</summary>
                  <div className="vg-faq__a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="vg-section vg-cta-band" style={{ background: "linear-gradient(135deg, var(--accent-700), var(--accent-600))", color: "#fff" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "clamp(22px, 3vw, 30px)", margin: "0 0 10px" }}>
            Programează {category.nume.toLowerCase()} acum
          </h2>
          <p style={{ opacity: 0.9, fontSize: 16, margin: "0 0 20px" }}>
            Formular de 2 minute. O firmă autorizată te contactează în 24h.
          </p>
          <Link href="/programare" className="vg-btn vg-btn--lg" style={{ background: "#fff", color: "var(--accent-700)", fontWeight: 700 }}>
            Programează gratuit →
          </Link>
        </div>
      </section>
    </>
  )
}
