-- =====================================================
-- 0019 — Work type + contract/worksheet equipment links
-- =====================================================
--
-- 1. Enum work_type pentru fișe: verificare, revizie, reparație, instalare, altul
-- 2. Junction contract_equipments (contract_id, equipment_id)
-- 3. Junction work_sheet_equipments (work_sheet_id, equipment_id, notes)
-- 4. work_sheets.work_type + work_sheets.contract_covered (bool) pentru raportare

create type public.work_type as enum (
  'verificare',
  'revizie',
  'reparatie',
  'instalare',
  'inspectie',
  'altul'
);

alter table public.work_sheets
  add column if not exists work_type public.work_type not null default 'altul';

create index if not exists idx_work_sheets_type on public.work_sheets(firm_id, work_type);

-- Junction: care echipamente sunt acoperite de un contract
create table if not exists public.contract_equipments (
  contract_id uuid not null references public.contracts(id) on delete cascade,
  equipment_id uuid not null references public.property_equipments(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (contract_id, equipment_id)
);

create index if not exists idx_contract_equip_contract on public.contract_equipments(contract_id);
create index if not exists idx_contract_equip_equipment on public.contract_equipments(equipment_id);

-- Junction: care echipamente au fost servisate într-o fișă de lucru
create table if not exists public.work_sheet_equipments (
  work_sheet_id uuid not null references public.work_sheets(id) on delete cascade,
  equipment_id uuid not null references public.property_equipments(id) on delete cascade,
  notes text,
  added_at timestamptz not null default now(),
  primary key (work_sheet_id, equipment_id)
);

create index if not exists idx_ws_equip_sheet on public.work_sheet_equipments(work_sheet_id);
create index if not exists idx_ws_equip_equipment on public.work_sheet_equipments(equipment_id);
