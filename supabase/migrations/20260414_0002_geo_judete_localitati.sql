-- =====================================================
-- 0002 — Geo: judete + localitati (seed populat separat)
-- Structură compatibilă cu ghidulfunerar pentru reutilizare UI
-- =====================================================

create table if not exists public.judete (
  id serial primary key,
  nume text not null,
  slug text not null unique,
  cod_auto text,             -- ex: "B", "CJ", "IS"
  lat numeric(10,6),
  lng numeric(10,6),
  created_at timestamptz not null default now()
);

create index if not exists idx_judete_slug on public.judete(slug);

create table if not exists public.localitati (
  id serial primary key,
  judet_id integer not null references public.judete(id) on delete cascade,
  nume text not null,
  slug text not null,
  populatie integer,
  tip_localitate text,       -- "municipiu", "oras", "comuna", "sat"
  tier text,                 -- "A" (>100k), "B" (20-100k), "C" (<20k)
  lat numeric(10,6),
  lng numeric(10,6),
  nr_firme integer not null default 0,
  created_at timestamptz not null default now(),
  unique (judet_id, slug)
);

create index if not exists idx_localitati_judet on public.localitati(judet_id);
create index if not exists idx_localitati_slug on public.localitati(slug);
create index if not exists idx_localitati_tier on public.localitati(tier);
create index if not exists idx_localitati_tip on public.localitati(tip_localitate);
create index if not exists idx_localitati_nume_trgm on public.localitati using gin (nume gin_trgm_ops);
