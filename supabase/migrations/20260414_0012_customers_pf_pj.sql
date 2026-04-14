-- =====================================================
-- 0012 — Customers: câmpuri explicite PF/PJ
-- =====================================================
--
-- Proprietar de instalație poate fi:
--   PF (persoană fizică): first_name + last_name + cnp
--   PJ (persoană juridică): company_name + cui (inclusiv asociație)
--
-- Păstrăm `full_name` ca nume afișat (populat automat din câmpurile explicite).
-- `association_name` devine alias istoric pentru company_name când customer_type='association'.

alter table public.customers
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists cnp        text,
  add column if not exists company_name text;

create index if not exists idx_customers_cnp on public.customers(cnp) where cnp is not null;
create index if not exists idx_customers_cui on public.customers(cui) where cui is not null;

-- Backfill: dacă avem customers vechi (nu e cazul la MVP fresh), mapează valorile
update public.customers
set company_name = association_name
where customer_type = 'association'
  and association_name is not null
  and company_name is null;

-- Check: tipul de client trebuie să aibă câmpurile potrivite
-- (permisiv — validarea strictă rămâne la nivel de aplicație în booking flow)
alter table public.customers
  drop constraint if exists customers_type_fields_check;
alter table public.customers
  add constraint customers_type_fields_check
  check (
    (customer_type = 'individual' and (full_name is not null or (first_name is not null and last_name is not null)))
    or (customer_type in ('association', 'business') and (full_name is not null or company_name is not null))
  );
