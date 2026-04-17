"use client"

import { useEffect, useRef } from "react"
import flatpickr from "flatpickr"
import { Romanian } from "flatpickr/dist/l10n/ro"
import "flatpickr/dist/flatpickr.min.css"

type Props = {
  name?: string
  defaultValue?: string | null      // YYYY-MM-DD
  value?: string | null             // controlled YYYY-MM-DD
  onChange?: (isoDate: string) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  min?: string
  max?: string
  id?: string
}

// Date picker consistent DD.MM.YYYY across all browsers + locale RO.
// Sub the hood: flatpickr text input cu afișare d.m.Y și valoare ISO Y-m-d
// trimisă în form (în input-ul ascuns altInput=false, iar inputul vizibil e cel controlat).
// Native <input type="date"> e ignorat ca să evităm formatul OS (m/d/Y pe Chrome US).
export default function DateInput({
  name,
  defaultValue,
  value,
  onChange,
  required,
  disabled,
  placeholder = "DD.MM.YYYY",
  className,
  min,
  max,
  id,
}: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const fpRef = useRef<flatpickr.Instance | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const instance = flatpickr(ref.current, {
      dateFormat: "Y-m-d",        // VALOARE trimisă în form (ISO)
      altInput: true,
      altFormat: "d.m.Y",          // AFIȘARE vizibilă
      locale: Romanian,
      allowInput: true,
      minDate: min || undefined,
      maxDate: max || undefined,
      defaultDate: value ?? defaultValue ?? undefined,
      onChange: (_dates, dateStr) => {
        if (onChange) onChange(dateStr)
      },
    })
    fpRef.current = instance
    return () => { instance.destroy() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Support controlled updates
  useEffect(() => {
    if (fpRef.current && value !== undefined && value !== null) {
      fpRef.current.setDate(value, false)
    }
  }, [value])

  return (
    <input
      ref={ref}
      type="text"
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      id={id}
      autoComplete="off"
    />
  )
}
