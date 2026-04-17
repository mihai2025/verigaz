-- =====================================================
-- 0018 — Work sheets (fișe de lucru per tehnician)
-- =====================================================
--
-- Fișă zilnică: ce a făcut tehnicianul X la clientul Y, pe adresa Z, în
-- cadrul unui contract sau al unei programări. Poate fi legată la:
--   - contract_id (vizită planificată conform contractului)
--   - booking_id (programarea care a generat vizita)
--   - technician_id (angajatul care a executat)
-- Toate sunt opționale pentru flexibilitate — minimul obligatoriu e firm_id + work_date.

create type public.work_sheet_status as enum ('planificat', 'in_lucru', 'finalizat', 'anulat');

create table if not exists public.work_sheets (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,

  contract_id uuid references public.contracts(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  technician_id uuid references public.firm_employees(id) on delete set null,

  work_date date not null,
  start_time time,
  end_time time,
  duration_minutes integer,                    -- calculat sau completat manual

  tasks_done text,                             -- descriere task-uri efectuate
  materials_used text,                         -- materiale/piese folosite
  observations text,                           -- observații tehnician
  signed_by_customer boolean not null default false,
  signed_at timestamptz,

  status public.work_sheet_status not null default 'planificat',

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_work_sheets_firm on public.work_sheets(firm_id);
create index if not exists idx_work_sheets_contract on public.work_sheets(contract_id);
create index if not exists idx_work_sheets_booking on public.work_sheets(booking_id);
create index if not exists idx_work_sheets_technician on public.work_sheets(technician_id);
create index if not exists idx_work_sheets_date on public.work_sheets(firm_id, work_date desc);
create index if not exists idx_work_sheets_status on public.work_sheets(firm_id, status);

drop trigger if exists trg_work_sheets_updated_at on public.work_sheets;
create trigger trg_work_sheets_updated_at
before update on public.work_sheets
for each row execute function public.set_updated_at();
