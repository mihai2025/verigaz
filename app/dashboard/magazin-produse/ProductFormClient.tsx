"use client"

import { useState, useTransition } from "react"
import { createProduct, updateProduct } from "./actions"

type Initial = Record<string, unknown>

export default function ProductFormClient({
  mode,
  productId,
  initial,
  categories,
}: {
  mode: "create" | "edit"
  productId?: string
  initial?: Initial
  categories: { id: number; nume: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const v = (k: string, fallback = "") => {
    const val = initial?.[k]
    return val == null ? fallback : String(val)
  }
  const checked = (k: string) => !!(initial?.[k] as unknown)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setSaved(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = mode === "create" ? await createProduct(fd) : await updateProduct(productId!, fd)
      if (res && !res.ok) setError(res.error)
      else if (mode === "edit") setSaved(true)
    })
  }

  return (
    <form onSubmit={onSubmit} className="dash-form">
      {error && <div className="auth-error" role="alert">{error}</div>}
      {saved && <div className="auth-notice">Produs actualizat.</div>}

      <fieldset className="dash-fieldset">
        <legend>Date produs</legend>
        <label className="dash-field">
          <span>Nume *</span>
          <input name="nume" required defaultValue={v("nume")} maxLength={200} />
        </label>
        <div className="booking-row">
          <label className="dash-field">
            <span>Categorie</span>
            <select name="category_id" defaultValue={v("category_id")}>
              <option value="">— alege —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nume}</option>
              ))}
            </select>
          </label>
          <label className="dash-field">
            <span>Brand</span>
            <input name="brand" defaultValue={v("brand")} maxLength={100} />
          </label>
          <label className="dash-field">
            <span>Model</span>
            <input name="model" defaultValue={v("model")} maxLength={100} />
          </label>
          <label className="dash-field">
            <span>SKU</span>
            <input name="sku" defaultValue={v("sku")} maxLength={60} />
          </label>
        </div>
        <label className="dash-field">
          <span>Descriere scurtă (card)</span>
          <textarea name="descriere_scurta" defaultValue={v("descriere_scurta")} maxLength={240} rows={2} />
        </label>
        <label className="dash-field">
          <span>Descriere completă</span>
          <textarea name="descriere" defaultValue={v("descriere")} maxLength={4000} rows={6} />
        </label>
        <label className="dash-field">
          <span>URL imagine principală</span>
          <input name="image_url" defaultValue={v("image_url")} type="url" maxLength={500} />
        </label>
      </fieldset>

      <fieldset className="dash-fieldset">
        <legend>Preț + stoc</legend>
        <div className="booking-row">
          <label className="dash-field">
            <span>Preț (lei) *</span>
            <input name="price" required type="number" step="0.01" min="0" defaultValue={v("price")} />
          </label>
          <label className="dash-field">
            <span>Preț vechi (pentru discount)</span>
            <input name="price_old" type="number" step="0.01" min="0" defaultValue={v("price_old")} />
          </label>
          <label className="dash-field">
            <span>Stoc</span>
            <input name="stock" type="number" min="0" defaultValue={v("stock", "0")} />
          </label>
        </div>
        <label className="booking-checkbox">
          <input type="checkbox" name="manage_stock" defaultChecked={checked("manage_stock")} />
          <span>Gestionează stoc (altfel: vânzare nelimitată)</span>
        </label>
      </fieldset>

      {mode === "edit" && (
        <fieldset className="dash-fieldset">
          <legend>Status</legend>
          <label className="booking-checkbox">
            <input type="checkbox" name="is_active" defaultChecked={checked("is_active")} />
            <span>Produs activ (vizibil pe site)</span>
          </label>
          <label className="booking-checkbox">
            <input type="checkbox" name="is_featured" defaultChecked={checked("is_featured")} />
            <span>Recomandat (apare primul în listing)</span>
          </label>
        </fieldset>
      )}

      <button type="submit" disabled={pending} className="dash-btn dash-btn--primary">
        {pending ? "Se salvează…" : mode === "create" ? "Creează produs" : "Salvează modificările"}
      </button>
    </form>
  )
}
