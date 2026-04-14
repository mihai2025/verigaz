// lib/reminders/status.ts
//
// Semnal UI "bulină" pentru reminder status pe o proprietate/echipament:
//   sent    — notificare trimisă, încă în termen, așteaptă verificare (BULINĂ VERDE)
//   done    — verificare/revizie efectuată după ultima notificare (BULINĂ DISPARE)
//   none    — încă nu e în fereastra de notificare (FĂRĂ BULINĂ)
//   overdue — scadența a trecut fără verificare (roșu — opțional)
//
// Derivat din tabelul `reminders`:
//   - Reminder cu status='sent' și response_booking_id NULL și scheduled_for <= now → "sent"
//   - Reminder cu status='converted' (customer a răspuns / verificare făcută) → "done"
//   - Reminder cu status='queued' și scheduled_for > now → "none"
//   - Reminder cu status='sent' și due < now și nu există follow-up booking → "overdue"

export type ReminderBullet = "sent" | "done" | "none" | "overdue" | null

export type ReminderRow = {
  status: string
  scheduled_for: string | null
  sent_at: string | null
  response_booking_id: string | null
  reminder_type: string
  advance_days: number | null
}

/**
 * Calculează bulina pentru cel mai recent reminder activ pe o (property, reminder_type).
 * `dueIso` = data reală a scadenței (din properties.next_verificare_due sau similar).
 */
export function resolveBullet(
  latest: ReminderRow | null | undefined,
  dueIso: string | null,
): ReminderBullet {
  if (!latest) return "none"
  const now = new Date()
  const due = dueIso ? new Date(dueIso) : null

  if (latest.status === "converted") return "done"

  if (latest.status === "sent") {
    if (due && due < now) return "overdue"
    return "sent"
  }

  if (latest.status === "queued") {
    // Reminder viitor — nu am ajuns în fereastra de notificare
    return "none"
  }

  // failed, skipped — tratăm ca "none" (firma va reîncerca manual)
  return "none"
}
