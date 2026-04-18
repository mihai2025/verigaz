"use client"

import { FirmaMobileHeader } from "@/components/firma/FirmaMobileHeader"
import { FirmaHero } from "@/components/firma/FirmaHero"
import { FirmaAside } from "@/components/firma/FirmaAside"
import { FirmaStickyCta } from "@/components/firma/FirmaStickyCta"
import FirmaOfferAutoModal from "@/components/leads/FirmaOfferAutoModal"
import OfferRequestButton from "@/components/leads/OfferRequestButton"

export type FirmaClientData = {
  firm: {
    id: string
    slug: string
    name: string
    legal_name: string
    cui: string | null
    logo_url: string | null
    cover_url: string | null
    description: string | null
    short_description: string | null
    phone: string | null
    whatsapp: string | null
    email: string | null
    website: string | null
    facebook_url: string | null
    instagram_url: string | null
    sediu_adresa: string | null
    sediu_localitate_nume: string | null
    sediu_judet_nume: string | null
    sediu_judet_slug: string | null
    sediu_judet_id: number | null
    sediu_localitate_id: number | null
    anre_authorization_no: string | null
    anre_category: string | null
    anre_valid_until: string | null
    rating_avg: number | null
    rating_count: number | null
    plan: string | null
  }
  services: Array<{
    nume: string
    descriere: string | null
    price_from: number | null
    price_to: number | null
    price_note: string | null
  }>
}

export default function FirmaClient({ data }: { data: FirmaClientData }) {
  const { firm, services } = data

  const description = firm.description || firm.short_description || ""

  return (
    <main className="page firmaPage">
      <FirmaMobileHeader firm={firm} />
      <FirmaStickyCta firm={firm} />
      <FirmaOfferAutoModal
        firmSlug={firm.slug}
        firmName={firm.name}
        judetId={firm.sediu_judet_id}
        localitateId={firm.sediu_localitate_id}
      />

      <div className="container firmaContainer">
        <div className="firmaGrid">
          <div className="firmaMain">
            <FirmaHero firm={firm} />

            <section className="firmaSection" id="prezentare">
              <h2 className="firmaH2">Prezentare</h2>
              <div className="firmaCard">
                {description ? (
                  <p className="firmaP">{description}</p>
                ) : (
                  <p className="firmaP">
                    {firm.name} este o firmă autorizată ANRE pentru servicii de verificare, revizie
                    și instalație gaze naturale
                    {firm.sediu_judet_nume ? ` în județul ${firm.sediu_judet_nume}` : ""}. Autorizația
                    este validată manual de echipa verificari-gaze.ro în registrul oficial ANRE.
                  </p>
                )}
              </div>
            </section>

            {services.length > 0 && (
              <section className="firmaSection" id="servicii">
                <h2 className="firmaH2">Servicii oferite</h2>
                <div className="firmaCard">
                  <ul className="firmaServicesList">
                    {services.map((s, i) => {
                      const price = s.price_from && s.price_to
                        ? `${s.price_from}–${s.price_to} lei`
                        : s.price_from
                        ? `de la ${s.price_from} lei`
                        : null
                      return (
                        <li key={i} className="firmaServiceItem">
                          <div className="firmaServiceItem__name">{s.nume}</div>
                          {s.descriere && <div className="firmaServiceItem__desc">{s.descriere}</div>}
                          {price && <div className="firmaServiceItem__price">{price}</div>}
                          {s.price_note && <div className="firmaServiceItem__note">{s.price_note}</div>}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            )}

            <section className="firmaSection" id="programare">
              <div className="firmaCtaBand">
                <h2>Gata să programezi?</h2>
                <p>
                  Formular de 2 minute. {firm.name} te contactează în 24h pentru confirmare.
                  Certificat digital + reminder automat la scadență.
                </p>
                <OfferRequestButton
                  className="firmaCtaBand__btn"
                  label="Cere ofertă"
                  source="firma_cta_band"
                  firmSlug={firm.slug}
                  firmName={firm.name}
                  defaultJudetId={firm.sediu_judet_id}
                  defaultLocalitateId={firm.sediu_localitate_id}
                />
              </div>
            </section>
          </div>

          <aside className="firmaAside" id="contact">
            <FirmaAside firm={firm} />
          </aside>
        </div>
      </div>
    </main>
  )
}
