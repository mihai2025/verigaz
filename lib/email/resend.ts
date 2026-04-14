// lib/email/resend.ts
// Thin wrapper peste Resend API pentru send-uri tranzacționale.
import { Resend } from "resend"

let client: Resend | null = null

function getClient(): Resend {
  if (client) return client
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("Missing RESEND_API_KEY")
  client = new Resend(key)
  return client
}

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  from?: string               // default: RESEND_FROM env
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const from = opts.from ?? process.env.RESEND_FROM ?? "verigaz <no-reply@verificari-gaze.ro>"
  try {
    const { data, error } = await getClient().emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id ?? "" }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
