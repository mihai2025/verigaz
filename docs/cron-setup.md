# Cron Setup — cron-job.org

Vercel plan Free nu permite cron jobs. Folosim **cron-job.org** (cont partajat cu `alertincidenti`, același `CRONJOB_API_KEY`).

## Job-uri necesare pentru Verigaz

| Nume | Endpoint | Schedule | Scop |
|---|---|---|---|
| `verigaz_reminders` | `GET https://verificari-gaze.ro/api/cron/send-reminders` | `0 5 * * *` (zilnic 05:00) | Trimite SMS/email pentru scadențe verificare/revizie/service detector care expiră în 60/30/7 zile |
| `verigaz_subscriptions` | `GET https://verificari-gaze.ro/api/cron/check-subscriptions` | `0 3 * * *` (zilnic 03:00) | Verifică abonamente Stripe, downgrade firm-uri la plan `free` când expiră |
| `verigaz_document_cleanup` | `GET https://verificari-gaze.ro/api/cron/document-cleanup` | `0 4 * * 0` (săptămânal duminică 04:00) | Marchează documente expirate, arhivare |

## Cum configurezi manual în dashboard cron-job.org

1. Login la https://console.cron-job.org
2. „Create cronjob" → completează:
   - **Title:** `verigaz_reminders` (sau numele din tabel)
   - **URL:** endpoint-ul corespunzător
   - **Request method:** GET
   - **Request headers:**
     - `x-cron-secret: verigaz-cron-Mth3b3st-2026` (valoarea `CRON_SECRET` din `.env.local`)
     - `User-Agent: cron-job.org`
   - **Schedule:** pune cron-ul din tabel (ex 5:00 AM zilnic)
   - **Timezone:** `Europe/Bucharest`
   - **Save**
3. Copiază `Job ID` rezultat și pune-l în `.env.local` la `CRONJOB_REMINDERS_ID` (etc).

## Cum configurezi programatic (alternativ)

Rulează un script Node care apelează helper-ul `lib/cron/cronjob.ts`:

```ts
import { createJob } from "@/lib/cron/cronjob"

const id = await createJob({
  title: "verigaz_reminders",
  url: "https://verificari-gaze.ro/api/cron/send-reminders",
  requestMethod: 0,
  enabled: true,
  extendedData: {
    headers: {
      "x-cron-secret": process.env.CRON_SECRET!,
    },
  },
  schedule: {
    timezone: "Europe/Bucharest",
    hours: [5],
    minutes: [0],
    mdays: [-1],
    months: [-1],
    wdays: [-1],
  },
})
console.log("Created job:", id)
```

## Verificare auth la endpoint-urile `/api/cron/*`

În fiecare route handler:

```ts
import { verifyCronSecret } from "@/lib/cron/cronjob"

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return new Response("Unauthorized", { status: 401 })
  }
  // ... logica cron-ului
}
```

## Monitoring

Dashboard cron-job.org afișează ultimele execuții cu response code + body. Pentru alerting, activează „Email notifications on failure" per job.
