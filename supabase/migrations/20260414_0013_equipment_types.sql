-- =====================================================
-- 0013 — Equipment types (nomenclator echipamente)
-- =====================================================
--
-- Două tabele:
--   equipment_types       — catalog default platformă (seed fixed, editabil doar de admin)
--   firm_equipment_types  — override per firmă (custom nume/intervale sau tip complet nou)
--
-- Intervalele de verificare diferă per tip:
--   detector gaz:           5 ani (60 luni)
--   centrală termică:       2 ani (24 luni)
--   instalație gaz:         verificare 24 luni + revizie 120 luni (ANRE Ord. 179/2015)
--   electrovalvă automată:  2 ani
--   senzor CO:              1 an

create table if not exists public.equipment_types (
  id serial primary key,
  slug text not null unique,
  nume text not null,
  descriere text,
  verificare_months integer,          -- interval recomandat verificare (null = nu se aplică)
  revizie_months integer,             -- interval revizie (null = nu există revizie distinctă)
  service_category_slug text,         -- leagă de service_categories pentru reminder routing
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_equipment_types_active on public.equipment_types(is_active);

-- Seed catalog default
insert into public.equipment_types
  (slug, nume, descriere, verificare_months, revizie_months, service_category_slug, sort_order) values
  ('instalatie-gaz', 'Instalație gaz', 'Instalația interioară de gaze naturale — conducte, robineți, contor, fittinguri.',
    24, 120, 'verificare-instalatie', 1),
  ('centrala-termica', 'Centrală termică', 'Centrală termică pe gaz — verificare tehnică periodică (VTP) ISCIR.',
    24, null, 'verificare-centrala', 2),
  ('detector-gaz', 'Detector gaz', 'Detector automat de scurgeri gaz cu electrovalvă. Calibrare recomandată.',
    60, null, 'service-detector', 3),
  ('electrovalva', 'Electrovalvă automată', 'Electrovalvă pentru închidere automată la detecție.',
    24, null, null, 4),
  ('senzor-co', 'Senzor CO', 'Detector de monoxid de carbon. Test anual recomandat.',
    12, null, null, 5)
on conflict (slug) do nothing;

-- Per-firm override / custom
create table if not exists public.firm_equipment_types (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,
  -- NULL = tip custom (fără referință la default); altfel override pe un default
  equipment_type_id integer references public.equipment_types(id) on delete cascade,

  nume text not null,                 -- dacă e override, e copie din default; dacă e custom, e original
  descriere text,
  verificare_months integer,          -- override — null păstrează defaultul pentru overrides
  revizie_months integer,
  service_category_slug text,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, equipment_type_id)  -- o firmă nu poate suprascrie de 2 ori același default
);

create index if not exists idx_firm_equipment_firm on public.firm_equipment_types(firm_id);
create index if not exists idx_firm_equipment_active on public.firm_equipment_types(firm_id, is_active);

drop trigger if exists trg_firm_equipment_updated_at on public.firm_equipment_types;
create trigger trg_firm_equipment_updated_at
before update on public.firm_equipment_types
for each row execute function public.set_updated_at();
