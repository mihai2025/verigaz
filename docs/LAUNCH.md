# Verigaz — MVP launch checklist

Ghid pas cu pas pentru trecerea `verificari-gaze.ro` în producție. Parcurge în ordine;
fiecare secțiune are dependințe de cele anterioare.

---

## 0. Pre-flight

```bash
# Verifică că toate env vars sunt setate și serviciile răspund.
node scripts/preflight-check.mjs
```

Script-ul verifică: Supabase (URL + service role), R2 (bucket access), Resend
(API key), smsadvert (token present), Stripe (secret key), cron-job.org API,
price IDs pentru planuri.

---

## 1. Supabase — proiect prod

- [ ] Creează proiect nou `verigaz` în [supabase.com](https://supabase.com/dashboard) — region **eu-central-1** (Frankfurt).
- [ ] Parola Postgres: generează una nouă, salveaz-o în password manager.
- [ ] Din **Project Settings → API** copiază și pune în Vercel env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL` (same as NEXT_PUBLIC)
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ secret, doar server-side
- [ ] Aplică migrațiile în ordine:
  ```bash
  for f in supabase/migrations/*.sql; do
    psql "$SUPABASE_DB_URL" -f "$f" && echo "✓ $f"
  done
  ```
- [ ] Aplică seed-ul geo:
  ```bash
  psql "$SUPABASE_DB_URL" -f supabase/seeds/0001_geo_seed.sql
  ```
- [ ] Verifică: `select count(*) from judete` → `42`, `select count(*) from localitati` → `13856`.
- [ ] Verifică: `select count(*) from service_categories` → `7`.
- [ ] În **Auth → Providers** activează Email (password). Disable sign-up dacă vrei restrictiv.
- [ ] În **Auth → URL Configuration** setează:
  - Site URL: `https://verificari-gaze.ro`
  - Redirect URLs: `https://verificari-gaze.ro/auth/callback`, `http://localhost:3000/auth/callback` (pentru dev)

## 2. Cloudflare R2

- [ ] Bucket `ghidulfunerar` e shared cu verigaz (prefix `verigaz/`). Nu e nevoie să creezi altul.
- [ ] Verifică că `R2_PUBLIC_URL=https://media.ghidulfunerar.ro` e CDN activ (CORS permite serving din verificari-gaze.ro).
- [ ] Test upload manual:
  ```bash
  # Testează via API route /api/media/upload (după deploy).
  # Pe dev: verifică că putObject() din lib/r2/putObject.ts uploadează documente PDF.
  ```

## 3. Resend — email domain

- [ ] Adaugă domain nou `verificari-gaze.ro` în [Resend Dashboard](https://resend.com/domains).
- [ ] Copiază DNS records (SPF, DKIM, MX) și adaugă-le la DNS-ul Cloudflare/Namecheap.
- [ ] Așteaptă verificarea (5-30 min). Confirm că status = "verified".
- [ ] În Vercel env:
  - `RESEND_API_KEY` (poți reutiliza cheia ghidulfunerar sau creezi una dedicată)
  - `RESEND_FROM="verigaz <no-reply@verificari-gaze.ro>"`
- [ ] Test: trimite email de confirmare după signup test.

## 4. smsadvert.ro

- [ ] Cont shared cu ghidulfunerar — `SMS_API_TOKEN` e același.
- [ ] Copiază token-ul din Vercel ghidulfunerar → Vercel verigaz.
- [ ] Test: programează o scadență de test (setează `next_verificare_due` la o dată trecută) și forțează `/api/cron/reminders?token=...` să vezi că SMS ajunge.

## 5. Stripe — cont shared ghidulfunerar

- [ ] În [Stripe Dashboard](https://dashboard.stripe.com) (test mode):
  - Creează 3 produse: **Start**, **Plus**, **Premium**
  - Fiecare cu price recurring yearly RON:
    - Start: 490.00 RON/an
    - Plus: 890.00 RON/an
    - Premium: 1490.00 RON/an
  - Copiază price IDs (price_...) în Vercel env:
    - `STRIPE_PRICE_START_YEARLY`
    - `STRIPE_PRICE_PLUS_YEARLY`
    - `STRIPE_PRICE_PREMIUM_YEARLY`
- [ ] În **Developers → Webhooks** adaugă endpoint:
  - URL: `https://verificari-gaze.ro/api/stripe/webhook`
  - Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Copiază signing secret → Vercel env `STRIPE_WEBHOOK_SECRET`
- [ ] Test cu Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  stripe trigger checkout.session.completed
  ```
- [ ] După validare, comută Dashboard la **live mode** și repetă pașii pentru producție (produse + webhook secret nou).

## 6. Vercel — deploy prod

- [ ] Import repo verigaz/www în Vercel.
- [ ] Framework: Next.js (auto-detect).
- [ ] Environment Variables: copiază toate din `.env.local` (exclude cele cu `TODO_` sau `COPY_FROM_`).
- [ ] Domenii: adaugă `verificari-gaze.ro` + `www.verificari-gaze.ro` (redirect www → apex).
- [ ] Production deploy branch: `main`.
- [ ] Setează `NEXT_PUBLIC_SITE_URL=https://verificari-gaze.ro`.

## 7. DNS — verificari-gaze.ro

- [ ] `A` record pentru apex `verificari-gaze.ro` → IP Vercel (sau `ALIAS`/`ANAME` către `cname.vercel-dns.com`).
- [ ] `CNAME` pentru `www.verificari-gaze.ro` → `cname.vercel-dns.com`.
- [ ] Adaugă în Vercel domains și validează SSL (automat via Let's Encrypt).
- [ ] Păstrează DNS records pentru Resend (SPF, DKIM, MX de la pasul 3).

## 8. Cron jobs (cron-job.org)

- [ ] Setează `NEXT_PUBLIC_SITE_URL=https://verificari-gaze.ro` în `.env.local` local.
- [ ] Setează `CRON_SECRET` cu valoare random puternică în Vercel env + `.env.local`.
- [ ] Rulează:
  ```bash
  node scripts/setup-cron-jobs.mjs --dry   # verifică
  node scripts/setup-cron-jobs.mjs         # creează/actualizează
  ```
- [ ] În [cron-job.org dashboard](https://console.cron-job.org) confirmă că cele 2 job-uri apar:
  - `verigaz · reminders dispatcher` — la fiecare 10 min
  - `verigaz · check expired subscriptions` — zilnic 03:00 Europe/Bucharest
- [ ] Verifică execution log după primul trigger.

## 9. Admin account

- [ ] Creează cont pe `https://verificari-gaze.ro/inregistrare`.
- [ ] În Supabase SQL editor rulează (înlocuind user_id-ul tău):
  ```sql
  update profiles set role = 'admin' where user_id = '<your-uuid>';
  ```
- [ ] Logout + login. Confirmă acces la `/dashboard/firme`, `/dashboard/leads-admin`, `/dashboard/audit`, `/dashboard/reviews-admin`.

## 10. Test end-to-end

Client:
- [ ] Homepage se încarcă.
- [ ] Căutare funcționează pe `/cauta?q=bucuresti`.
- [ ] Listare județ: `/servicii-gaze/cluj` (gol, dar pagina randează).
- [ ] Redirect flat URL: `/servicii-gaze-cluj-napoca` → `/servicii-gaze/cluj/cluj-napoca` (301).
- [ ] Creare cont user + confirmare email.

Firmă:
- [ ] Cont nou cu checkbox "sunt firmă" → `/dashboard/adauga-firma`.
- [ ] Completează form cu autorizație ANRE test.
- [ ] Din cont admin → `/dashboard/firme?status=pending` → aprobă firma.
- [ ] Confirmă că firma apare acum în `/servicii-gaze/<judet>`.

Programare:
- [ ] `/programare?firma=<slug-firmă-test>` → completează și trimite.
- [ ] Confirmare la `/programare/VG-2026-000001`.
- [ ] Din cont firmă → `/dashboard/programari` — apare booking cu status pending.
- [ ] Acționează: confirm → complete → generează PDF.
- [ ] `/verifica-document/<ref>` — pagina publică funcționează.

Plată abonament:
- [ ] Din cont firmă test → `/dashboard/abonament` → Upgrade la Start.
- [ ] Folosește card test `4242 4242 4242 4242` (exp orice viitor, CVV orice).
- [ ] După plată, `gas_firms.plan = 'start'` + `firm_subscriptions` are status `active`.

Shop:
- [ ] `/magazin` catalog.
- [ ] Add to cart + checkout cu card test.
- [ ] `/magazin/comanda/<ref>` afișează status paid după webhook.

Reminder:
- [ ] Forțează manual `/api/cron/reminders?token=<secret>&dry=1` — vezi care ar fi triggerate.
- [ ] Dezactivează dry-run, rulează din nou, confirmă SMS + email.

## 11. Monitorizare

- [ ] Configurează Sentry sau echivalent (Vercel Analytics e by default).
- [ ] Alertă pe `/api/stripe/webhook` failures (>5% rate în 1h).
- [ ] Alertă pe `reminders.status='failed'` > 10 într-o zi.
- [ ] Weekly dashboard: nr. firme aprobate, bookings create, venit lunar.

## 12. Post-launch (primele 7 zile)

- [ ] Verifică zilnic `/dashboard/audit` pentru acțiuni suspecte.
- [ ] Răspunde la tichetele din `contact@verificari-gaze.ro` în < 24h.
- [ ] Urmărește conversia `programare → booking completed` — target > 60%.
- [ ] Urmărește rata de completare cont firmă → aprobare → plan plătit.

---

## Rollback plan

Dacă apare un bug critic:
1. În Vercel dashboard → Deployments → revert la ultima versiune stabilă.
2. Dacă e problemă de bază de date → Supabase point-in-time restore (Pro plan necesar).
3. Dacă Stripe webhook rupt → dezactivează `/api/stripe/webhook` în dashboard, procesează manual ultimele comenzi din Stripe Dashboard.

## Contacte urgență

- Supabase incident: https://status.supabase.com
- Vercel incident: https://www.vercel-status.com
- Stripe incident: https://status.stripe.com
- Cloudflare incident: https://www.cloudflarestatus.com
