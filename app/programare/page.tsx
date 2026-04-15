// app/programare/page.tsx
// Formular public de programare — premium + trust signals + FAQ.
import type { Metadata } from "next"
import Link from "next/link"
import { getPublicServerSupabase } from "@/lib/supabase/server"
import ProgramareClient from "./ProgramareClient"

export const metadata: Metadata = {
  title: "Programează verificare / revizie gaze online — gratuit, 2 minute",
  description:
    "Formular rapid de programare la firme autorizate ANRE pentru verificare instalație gaze, revizie la 10 ani, montaj detector, service centrală termică. Gratuit pentru utilizator, confirmare în 24h, certificat digital cu QR.",
  alternates: { canonical: "/programare" },
}

type Props = {
  searchParams: Promise<{ firma?: string; serviciu?: string; judet?: string; localitate?: string }>
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = getPublicServerSupabase()

  const [firmRes, categoriesRes, judeteRes] = await Promise.all([
    sp.firma
      ? supabase
          .from("gas_firms")
          .select("id, slug, brand_name, legal_name, short_description, sediu_judet_id, sediu_localitate_id")
          .eq("slug", sp.firma)
          .eq("is_active", true)
          .eq("verification_status", "approved")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("service_categories")
      .select("id, slug, nume")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("judete").select("id, nume").order("nume"),
  ])

  const firm = firmRes.data as
    | { id: string; slug: string; brand_name: string | null; legal_name: string; short_description: string | null; sediu_judet_id: number | null; sediu_localitate_id: number | null }
    | null
  const categories = (categoriesRes.data ?? []) as unknown as { id: number; slug: string; nume: string }[]
  const judete = (judeteRes.data ?? []) as unknown as { id: number; nume: string }[]

  const firmName = firm ? (firm.brand_name || firm.legal_name) : null

  return (
    <>
      {/* HERO */}
      <section className="vg-hero" style={{ paddingBottom: 24 }}>
        <div className="vg-hero__inner">
          <span className="vg-hero__eyebrow">Programare online · 100% gratuit</span>
          <h1 className="vg-hero__title">
            {firmName ? (
              <>Programează la <em>{firmName}</em></>
            ) : (
              <>Programează o <em>verificare gaze</em></>
            )}
          </h1>
          <p className="vg-hero__sub">
            Completează formularul în 2 minute. O firmă autorizată ANRE te contactează în 24h pentru
            confirmare. Primești certificat digital cu QR + reminder automat la următoarea scadență.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
            <span className="vg-badge"><span className="vg-badge__dot" /> Gratuit pentru tine</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Confirmare în 24h</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Certificat PDF cu QR</span>
            <span className="vg-badge"><span className="vg-badge__dot" /> Reminder SMS la scadență</span>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="vg-section" style={{ paddingTop: 24 }}>
        <div className="booking-page container" style={{ maxWidth: 900, margin: "0 auto" }}>
          {sp.firma && !firm && (
            <div className="booking-warning" style={{ padding: 14, background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 10, marginBottom: 20, color: "#92400e", fontSize: 14 }}>
              ⚠ Firma solicitată nu mai e disponibilă. Poți continua fără firmă preselectată{" "}
              sau <Link href="/servicii-gaze" style={{ color: "#92400e", fontWeight: 700 }}>alege alta din listă</Link>.
            </div>
          )}

          <ProgramareClient
            firm={firm}
            categories={categories}
            judete={judete}
            defaultCategorySlug={sp.serviciu ?? (firm ? undefined : "verificare-instalatie")}
            defaultJudetSlug={sp.judet ?? null}
            defaultLocalitateSlug={sp.localitate ?? null}
          />
        </div>
      </section>

      {/* TRUST — DE CE SĂ PROGRAMEZI AICI */}
      <section className="vg-section" style={{ background: "var(--surface-2)" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">De ce aici</p>
            <h2 className="vg-section__title">Ce primești cu o programare pe verificari-gaze.ro</h2>
          </div>

          <div className="vg-values">
            <div className="vg-value">
              <div className="vg-value__icon">✓</div>
              <h3 className="vg-value__title">Firme validate ANRE</h3>
              <p className="vg-value__desc">1.743 firme cu autorizație verificată manual — afișăm numărul și categoria pe profil.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">📄</div>
              <h3 className="vg-value__title">Certificat digital cu QR</h3>
              <p className="vg-value__desc">PDF cu hash SHA-256, acceptat la Distrigaz, Delgaz, asigurator. Imposibil de falsificat.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">🔔</div>
              <h3 className="vg-value__title">Reminder la scadență</h3>
              <p className="vg-value__desc">SMS + email cu 30 zile înainte de expirarea următoarei verificări.</p>
            </div>
            <div className="vg-value">
              <div className="vg-value__icon">💰</div>
              <h3 className="vg-value__title">Fără comision de intermediere</h3>
              <p className="vg-value__desc">Plătești direct firma. Prețul din cardul firmei e prețul final.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MINI FAQ */}
      <section className="vg-section">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="vg-section__head">
            <p className="vg-section__kicker">Frecvent</p>
            <h2 className="vg-section__title">Câteva răspunsuri rapide</h2>
          </div>

          <div className="vg-faq">
            <details className="vg-faq__item" open>
              <summary className="vg-faq__q">Cât costă programarea?</summary>
              <div className="vg-faq__a">
                Zero lei. Căutarea firmelor, programarea, certificatul digital și reminderele sunt
                gratuite pentru utilizatori. Plătești doar firma pentru intervenția tehnică — preț
                vizibil pe profilul firmei înainte să programezi.
              </div>
            </details>
            <details className="vg-faq__item">
              <summary className="vg-faq__q">Ce se întâmplă după ce trimit formularul?</summary>
              <div className="vg-faq__a">
                Primești imediat o referință unică (ex: VG-2026-XXXXXX) pe email și SMS. Firma
                aleasă (sau prima firmă disponibilă din zona ta dacă n-ai ales) te contactează
                telefonic în maxim 24h pentru confirmarea datei și orei.
              </div>
            </details>
            <details className="vg-faq__item">
              <summary className="vg-faq__q">Pot modifica programarea după trimitere?</summary>
              <div className="vg-faq__a">
                Da. Contactează firma direct (telefon vizibil pe cardul ei) sau scrie-ne la
                contact@verificari-gaze.ro cu referința programării. Anularea gratuită până cu 24h
                înainte de data intervenției.
              </div>
            </details>
            <details className="vg-faq__item">
              <summary className="vg-faq__q">Firma nu răspunde — ce fac?</summary>
              <div className="vg-faq__a">
                Dacă nu primești apel în 24h lucrătoare, scrie-ne la contact@verificari-gaze.ro cu
                referința programării. Redirecționăm cererea la altă firmă autorizată din zonă.
                Cei care nu onorează programările sunt suspendați din listing.
              </div>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}
