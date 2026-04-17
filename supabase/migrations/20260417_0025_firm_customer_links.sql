-- =====================================================
-- 0025 — firm_customer_links (many-to-many firmă ↔ client)
-- =====================================================
--
-- Pâna acum, „clienții firmei" erau derivați implicit din bookings.customer_id
-- și contracts.customer_id. Nu se puteau adăuga clienți fără booking/contract.
--
-- Tabelul `firm_customer_links` permite firmei să-și înregistreze un client
-- manual (fără booking/contract). În combinație cu UNION-ul din clienti/page
-- (bookings + contracts + links), firma vede toți clienții săi.

create table if not exists public.firm_customer_links (
  firm_id uuid not null references public.gas_firms(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by uuid references auth.users(id) on delete set null,
  notes text,
  primary key (firm_id, customer_id)
);

create index if not exists idx_firm_customer_links_firm on public.firm_customer_links(firm_id);
create index if not exists idx_firm_customer_links_customer on public.firm_customer_links(customer_id);

-- Backfill: populate din bookings existente
insert into public.firm_customer_links (firm_id, customer_id, added_at)
select distinct b.firm_id, b.customer_id, min(b.created_at)
from public.bookings b
where b.firm_id is not null and b.customer_id is not null
group by b.firm_id, b.customer_id
on conflict (firm_id, customer_id) do nothing;

-- Backfill: populate din contracts existente
insert into public.firm_customer_links (firm_id, customer_id, added_at)
select distinct c.firm_id, c.customer_id, min(c.created_at)
from public.contracts c
where c.firm_id is not null and c.customer_id is not null
group by c.firm_id, c.customer_id
on conflict (firm_id, customer_id) do nothing;
