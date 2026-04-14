# Verigaz — environment variables

Reference complet pentru `.env.local` (dev) și Vercel env (prod).

## Supabase

| Var | Tip | Exemplu | Note |
|-----|-----|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | `https://xxxxx.supabase.co` | proiect nou verigaz |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | `eyJ...` | JWT anon key |
| `SUPABASE_URL` | server | same as NEXT_PUBLIC | copie pentru server-side |
| `SUPABASE_ANON_KEY` | server | same | copie |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** | `eyJ...` | ⚠️ doar server; bypass RLS |
| `SUPABASE_DB_PASSWORD` | secret | `...` | pentru psql CLI |
| `SUPABASE_DB_URL` | secret | `postgresql://...` | pooler connection string |

## Cloudflare R2

| Var | Tip | Note |
|-----|-----|------|
| `R2_ACCOUNT_ID` | server | ID cont Cloudflare (același ca ghidulfunerar) |
| `R2_ACCESS_KEY_ID` | server | access key |
| `R2_SECRET_ACCESS_KEY` | **secret** | secret key |
| `R2_BUCKET` | server | `ghidulfunerar` (shared) |
| `R2_PUBLIC_URL` | server | `https://media.ghidulfunerar.ro` (CDN) |
| `R2_FOLDER_PREFIX` | server | `verigaz/` — izolare față de ghidulfunerar |

## Email (Resend)

| Var | Tip | Note |
|-----|-----|------|
| `RESEND_API_KEY` | **secret** | shared cu ghidulfunerar |
| `RESEND_FROM` | server | `"verigaz <no-reply@verificari-gaze.ro>"` |
| `CONTACT_FROM_EMAIL` | server | folosit de /api/contact (dacă se adaugă) |
| `CONTACT_TO_EMAIL` | server | unde ajung mesajele |

## SMS (smsadvert.ro)

| Var | Tip | Note |
|-----|-----|------|
| `SMS_API_TOKEN` | **secret** | shared cu ghidulfunerar |

## Stripe (cont shared ghidulfunerar)

| Var | Tip | Note |
|-----|-----|------|
| `STRIPE_SECRET_KEY` | **secret** | `sk_test_...` (dev) sau `sk_live_...` (prod) |
| `STRIPE_WEBHOOK_SECRET` | **secret** | `whsec_...` — unic per endpoint/env |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | `pk_test_...` / `pk_live_...` |
| `STRIPE_PRICE_START_YEARLY` | server | `price_...` — 490 RON/an |
| `STRIPE_PRICE_PLUS_YEARLY` | server | `price_...` — 890 RON/an |
| `STRIPE_PRICE_PREMIUM_YEARLY` | server | `price_...` — 1490 RON/an |

## Cron (cron-job.org — Vercel Hobby)

| Var | Tip | Note |
|-----|-----|------|
| `CRONJOB_API_KEY` | **secret** | cont shared cu alertincidenti |
| `CRONJOB_API_BASE` | server | `https://api.cron-job.org` |
| `CRON_SECRET` | **secret** | header X-Cron-Secret pentru /api/cron/* |

## Site

| Var | Tip | Note |
|-----|-----|------|
| `NEXT_PUBLIC_SITE_URL` | public | `https://verificari-gaze.ro` (prod) sau preview URL |

---

## Workflow env

1. **Dev local** — `.env.local` (gitignored).
2. **Preview Vercel** — Vercel Environment Variables → scope `Preview`.
3. **Production Vercel** — scope `Production`.

## Secrets ce NU intră în git

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `R2_SECRET_ACCESS_KEY`
- `RESEND_API_KEY`
- `SMS_API_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CRONJOB_API_KEY`
- `CRON_SECRET`

Dacă unul e leaked, rotește imediat în serviciul respectiv + redeploy.
