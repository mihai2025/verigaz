-- =====================================================
-- 0021 — Contract renewal bookings
-- =====================================================
--
-- Adaugă coloana `source_contract_id` pe bookings pentru a lega un booking
-- la contractul care a triggerat reînnoirea automată (cron check-contracts
-- cu advance_days=7 creează booking pending pentru reînnoire).

alter table public.bookings
  add column if not exists source_contract_id uuid references public.contracts(id) on delete set null;

create index if not exists idx_bookings_source_contract
  on public.bookings(source_contract_id)
  where source_contract_id is not null;
