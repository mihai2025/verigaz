# Verigaz

Platformă națională din România pentru verificări și revizii instalații gaze, montaj detectoare și magazin online. Construită pe același stack ca `ghidulfunerar` (E:/ghidulfunerar/www).

## Stack

- Next.js 16 App Router + React 19 + TypeScript 5
- Tailwind CSS 4
- Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- Cloudflare R2 (bucket partajat cu ghidulfunerar, folder `verigaz/`)
- Resend (transactional email)
- smsadvert.ro (SMS)
- Stripe (payments)
- pdf-lib, Sharp, @anthropic-ai/sdk

## Structură

```
app/                — Next.js App Router
  page.tsx          — landing (placeholder, de înlocuit cu UI portat)
  layout.tsx        — root layout cu metadata din DOMAIN
  not-found.tsx     — 404
  robots.ts         — robots.txt
  sitemap.ts        — sitemap.xml static inițial
components/         — UI components (scheleton copiat din ghidulfunerar)
lib/
  auth/             — role checks (copiat)
  config/
    domain.ts       — SINGLE SOURCE OF TRUTH pentru copy/SEO/branding
    siteSettings.ts — constante runtime (prefixuri, intervale reminder)
  geo/              — judete, localitati, helpers (copiat)
  media/            — R2 upload wrapper (copiat)
  search/           — search cu geo-priority (copiat, necesită adaptare la gas_firms)
  sms/
    smsadvert.ts    — wrapper smsadvert (copiat)
    templates.ts    — template-uri SMS Verigaz (NOU)
  supabase/         — client factories (copiat)
  utils/            — slugify, fmtDate (copiat)
middleware.ts       — redirects SEO + auth gating (adaptat /servicii-gaze)
styles/             — CSS tokens, base, globals (copiat)
supabase/
  migrations/       — 8 migrații fresh pentru schema gazelor
```

## Setup local

```bash
cd E:/verigaz/www
npm install
# completează .env.local cu cheile Supabase verigaz după crearea proiectului
npm run dev
```

## Deploy

- **GitHub:** `https://github.com/mihai2025/verigaz`
- **Vercel:** proiect separat, cont partajat cu ghidulfunerar
- **Domeniu:** `verificari-gaze.ro` (DNS → Vercel)

## Ce se reutilizează din ghidulfunerar

Vezi `E:/verificarigaz/gazdetect_platform_spec/21-ghidulfunerar-mapping.md` pentru tabelul 1:1 al rutelor, lib-urilor și tabelelor DB.

## Convenții

- Brand și copy public: români curat, fără englezisme (check, safe, pro).
- Toată terminologia trăiește în `lib/config/domain.ts` — NU hardcoda branding în componente.
- Scadențele ANRE (24m verificare, 120m revizie) sunt configurabile în `lib/config/siteSettings.ts`.
- R2 upload folosește prefix `verigaz/` în bucketul partajat.
