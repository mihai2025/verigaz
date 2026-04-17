-- =====================================================
-- 0017 — Contracts (contracte clienți per firmă)
-- =====================================================
--
-- Gestiune contracte pe care firma le încheie cu clienții săi (persoană
-- fizică, asociație sau firmă). Acoperă verificări periodice (2 ani) sau
-- revizii periodice (10 ani), cu tracking automat al scadenței.
--
-- Un contract e legat la (firm_id, customer_id) obligatoriu; opțional
-- la o adresă specifică (property_id). Dacă lipsește property_id,
-- contractul acoperă toate adresele clientului la firma respectivă.

create type public.contract_period_type as enum ('2_ani', '10_ani', 'anual', 'custom');
create type public.contract_status as enum ('activ', 'expirat', 'reziliat', 'suspendat');

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  property_id uuid references public.properties(id) on delete set null,

  contract_number text,                        -- ex: "C-2026-0001" (unic per firmă dacă e setat)
  period_type public.contract_period_type not null default '2_ani',
  start_date date not null,
  expiry_date date not null,

  monthly_fee numeric(10, 2),                  -- opțional: tarif lunar
  total_amount numeric(10, 2),                 -- opțional: valoare totală contract

  status public.contract_status not null default 'activ',
  notes text,

  signed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contracts_firm on public.contracts(firm_id);
create index if not exists idx_contracts_customer on public.contracts(customer_id);
create index if not exists idx_contracts_property on public.contracts(property_id);
create index if not exists idx_contracts_status on public.contracts(firm_id, status);
create index if not exists idx_contracts_expiry on public.contracts(expiry_date) where status = 'activ';
create unique index if not exists uq_contracts_number_per_firm
  on public.contracts(firm_id, contract_number)
  where contract_number is not null;

drop trigger if exists trg_contracts_updated_at on public.contracts;
create trigger trg_contracts_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();
