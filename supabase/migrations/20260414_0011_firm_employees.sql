-- =====================================================
-- 0011 — Firm employees (angajați firmă)
-- =====================================================
--
-- Nomenclator de salariați pentru fiecare firmă — cei care execută
-- verificări/revizii/instalări. Permite:
--   - atribuire booking la un angajat specific (bookings.assigned_team_member_id)
--   - semnătură tehnician pe PDF-ul de certificat
--   - dezactivare fără ștergere (păstrează istoricul pentru documente vechi)

create table if not exists public.firm_employees (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,

  full_name text not null,
  employee_code text,                     -- ex: matricolă internă "ANG-001"
  role text,                               -- ex: "tehnician verificare", "instalator"
  phone text,
  email text,
  anre_personal_certificate_no text,       -- nr. certificat personal ANRE (dacă are)

  is_active boolean not null default true,
  deactivated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, employee_code)
);

create index if not exists idx_firm_employees_firm on public.firm_employees(firm_id);
create index if not exists idx_firm_employees_active on public.firm_employees(firm_id, is_active);

drop trigger if exists trg_firm_employees_updated_at on public.firm_employees;
create trigger trg_firm_employees_updated_at
before update on public.firm_employees
for each row execute function public.set_updated_at();

-- Leagă FK-ul existent bookings.assigned_team_member_id → firm_employees.id
-- on delete set null: dacă angajatul e șters, booking-ul rămâne dar fără assign
alter table public.bookings
  drop constraint if exists bookings_assigned_team_member_fkey;

alter table public.bookings
  add constraint bookings_assigned_team_member_fkey
    foreign key (assigned_team_member_id)
    references public.firm_employees(id)
    on delete set null;

create index if not exists idx_bookings_assigned_team on public.bookings(assigned_team_member_id);
