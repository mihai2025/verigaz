// lib/cron/cronjob.ts
// Helper pentru cron-job.org API — creare/update/toggle job-uri programatic.
// Reutilizăm același cont ca alertincidenti (CRONJOB_API_KEY).

const API_BASE = process.env.CRONJOB_API_BASE ?? "https://api.cron-job.org"
const API_KEY = process.env.CRONJOB_API_KEY

function authHeaders() {
  if (!API_KEY) throw new Error("CRONJOB_API_KEY not set")
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  }
}

export type CronJobSchedule = {
  timezone?: string          // ex "Europe/Bucharest"
  hours?: number[]           // -1 = every hour, sau [5] pentru ora 5
  minutes?: number[]         // ex [0] pentru minutul 0
  mdays?: number[]           // -1 = every day
  months?: number[]          // -1 = every month
  wdays?: number[]           // -1 = every weekday
}

export type CronJobDefinition = {
  title: string
  url: string                // ex https://verigaz.ro/api/cron/send-reminders
  enabled?: boolean
  saveResponses?: boolean
  requestMethod?: 0 | 1      // 0 = GET, 1 = POST
  extendedData?: {
    headers?: Record<string, string>
    body?: string
  }
  schedule: CronJobSchedule
}

/** Creează un job nou în cron-job.org și returnează ID-ul */
export async function createJob(def: CronJobDefinition): Promise<number> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ job: def }),
  })
  if (!res.ok) throw new Error(`cron-job.org createJob ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.jobId as number
}

/** Update schedule / config al unui job existent */
export async function updateJob(jobId: number, patch: Partial<CronJobDefinition>) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ job: patch }),
  })
  if (!res.ok) throw new Error(`cron-job.org updateJob ${res.status}: ${await res.text()}`)
}

/** Activează sau dezactivează un job */
export async function toggleJob(jobId: number, enabled: boolean) {
  return updateJob(jobId, { enabled })
}

/** Șterge un job */
export async function deleteJob(jobId: number) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`cron-job.org deleteJob ${res.status}: ${await res.text()}`)
}

/** Helper: verifică secretul trimis de cron-job.org la endpoint-urile /api/cron/* */
export function verifyCronSecret(req: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const sent = req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret")
  return sent === expected
}
