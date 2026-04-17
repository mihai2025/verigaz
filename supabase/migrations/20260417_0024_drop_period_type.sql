-- =====================================================
-- 0024 — Drop period_type from contracts
-- =====================================================
--
-- Tipul perioadei nu mai are sens la nivel de contract — scadențele sunt
-- pe echipamente (property_equipments.next_verificare_due / next_revizie_due).
-- Eliminăm coloana și enum-ul aferent.

alter table public.contracts drop column if exists period_type;
drop type if exists public.contract_period_type;
