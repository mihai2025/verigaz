-- =====================================================
-- 0003 — Categorii servicii (gaze)
-- =====================================================

create table if not exists public.service_categories (
  id serial primary key,
  slug text not null unique,
  nume text not null,
  descriere text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.service_categories (slug, nume, descriere, sort_order) values
  ('verificare-instalatie',  'Verificare instalație gaze', 'Obligatorie la maxim 2 ani (ANRE Ord. 179/2015)', 1),
  ('revizie-instalatie',     'Revizie instalație gaze',    'Obligatorie la maxim 10 ani (ANRE Ord. 179/2015)', 2),
  ('montaj-detector',        'Montaj detector gaze',       'Detector automat cu electrovalvă', 3),
  ('service-detector',       'Service detector gaze',      'Calibrare și verificare anuală', 4),
  ('reparatii-instalatie',   'Reparații instalație gaze',  'Remedieri după opriri sau defecțiuni', 5),
  ('racordare-gaze',         'Racordare la rețea',         'Bransament nou / extensie', 6),
  ('audit-asociatie',        'Audit asociație proprietari','Verificare conformitate pentru asociații', 7),
  ('verificare-centrala',    'Verificare centrală termică (VTP)', 'Verificare tehnică periodică ISCIR', 8),
  ('revizie-centrala',       'Revizie centrală termică',   'Revizie completă centrală ISCIR', 9)
on conflict (slug) do nothing;
