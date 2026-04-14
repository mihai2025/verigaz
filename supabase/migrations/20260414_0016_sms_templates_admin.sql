-- =====================================================
-- 0016 — SMS templates editabile de admin platformă
-- =====================================================
--
-- Înlocuiește constantele hardcoded din lib/sms/templates.ts cu un catalog
-- configurabil în DB. Fiecare reminder_type are un template cu placeholdere:
--   {FIRMA}        — nume firmă
--   {DATA}         — data scadenței DD.MM.YYYY
--   {ECHIPAMENT}   — tip echipament (centrala, detector, instalatie gaz)
--   {ACTIUNE}      — "verificarea" sau "revizia"
--   {TELEFON}      — telefon firmă
--   {ADRESA}       — adresa clientului
--   {LINK}         — shortlink programare (via Bitly)
--
-- Limită: 160 caractere după substituire + strip diacritice.
-- Dispatcher-ul fallbackuieşte la templatele din lib/sms/templates.ts dacă
-- rândul nu există sau e inactiv.

create table if not exists public.sms_templates_admin (
  id uuid primary key default gen_random_uuid(),
  reminder_type text not null unique,    -- verificare_24m, revizie_120m, service_detector_12m, iscir_centrala
  template text not null,                 -- text cu placeholdere {FIRMA}, {DATA}, etc
  description text,                       -- notă pentru admin
  is_active boolean not null default true,
  max_chars integer not null default 160,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_sms_templates_admin_updated_at on public.sms_templates_admin;
create trigger trg_sms_templates_admin_updated_at
before update on public.sms_templates_admin
for each row execute function public.set_updated_at();

-- Seed cu șabloane compacte (sub 160 chars după substituire normală)
insert into public.sms_templates_admin (reminder_type, template, description) values
  (
    'verificare_24m',
    '{FIRMA}: {ACTIUNE} {ECHIPAMENT} expira {DATA}. Tel {TELEFON}. Programeaza: {LINK}',
    'Scadenta verificare la 2 ani (instalatie gaz)'
  ),
  (
    'revizie_120m',
    '{FIRMA}: {ACTIUNE} {ECHIPAMENT} scadenta {DATA}. Obligatoriu ANRE. Tel {TELEFON}. Programare: {LINK}',
    'Scadenta revizie la 10 ani (instalatie gaz)'
  ),
  (
    'service_detector_12m',
    '{FIRMA}: service anual detector gaz scadent {DATA}. Tel {TELEFON}. Programare: {LINK}',
    'Scadenta anuala service detector'
  ),
  (
    'iscir_centrala',
    '{FIRMA}: {ACTIUNE} centrala termica scadenta {DATA}. Tel {TELEFON}. Programare: {LINK}',
    'Scadenta VTP centrala termica (ISCIR)'
  )
on conflict (reminder_type) do nothing;
