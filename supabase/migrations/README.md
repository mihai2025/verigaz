# Verigaz — Supabase Migrations

Migrații inițiale pentru proiectul `verigaz` (Supabase).

## Ordine

1. `20260414_0001_init_extensions_profiles.sql` — extensii (uuid, pg_trgm, citext, unaccent), `profiles`, trigger `handle_new_user`, helper `set_updated_at`
2. `20260414_0002_geo_judete_localitati.sql` — `judete`, `localitati` (compatibile ghidulfunerar)
3. `20260414_0003_service_categories.sql` — categorii servicii gaze + seed (9 categorii)
4. `20260414_0004_gas_firms.sql` — firme autorizate ANRE + `firm_locations`, `firm_services`, `firm_documents`
5. `20260414_0005_customers_bookings.sql` — `customers`, `properties`, `bookings`, `jobs`, `reviews`, `leads`
6. `20260414_0006_documents_reminders_sms.sql` — `documents`, `reminders`, `sms_logs`
7. `20260414_0007_shop.sql` — `shop_categories`, `shop_products`, `shop_orders` (port din ghidulfunerar)
8. `20260414_0008_rls_policies.sql` — RLS peste toate tabelele + helper functions `is_admin`, `is_firm_owner`

## Rulare

### Via Supabase CLI
```bash
cd E:/verigaz/www
supabase link --project-ref <PROJECT_REF>
supabase db push
```

### Via SQL Editor (manual, în dashboard Supabase)
Rulează fiecare fișier în ordine, în SQL Editor.

### Via psql direct
```bash
psql "postgresql://postgres.<PROJECT_REF>:!Mth3b3st2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f 20260414_0001_init_extensions_profiles.sql \
  -f 20260414_0002_geo_judete_localitati.sql \
  -f 20260414_0003_service_categories.sql \
  -f 20260414_0004_gas_firms.sql \
  -f 20260414_0005_customers_bookings.sql \
  -f 20260414_0006_documents_reminders_sms.sql \
  -f 20260414_0007_shop.sql \
  -f 20260414_0008_rls_policies.sql
```

## Seed date lipsă (separate)

- `judete` + `localitati`: se va rula un script de seed separat (după ce recuperăm CSV-ul din ghidulfunerar).
- `shop_categories` + `service_categories`: deja inserate ca parte din migrații.
- `gas_firms`: seed inițial din lista ANRE (să fie importată via script dedicat).

## Note

- Toate tabele au RLS activat. Accesul cu `anon` key e limitat la read public (firme aprobate, produse active, recenzii aprobate, geo, categorii).
- Operațiuni admin/firm folosesc `service_role` key doar server-side (NU în browser).
- `owner_user_id` pe `gas_firms` leagă firma de user-ul care o administrează.
