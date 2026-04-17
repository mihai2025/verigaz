-- =====================================================
-- 0023 — Relax contracts: period_type + expiry_date opționale
-- =====================================================
--
-- Scadențele efective sunt pe property_equipments (next_verificare_due, next_revizie_due).
-- Contractul e doar relația comercială — poate fi fără termen (auto-reînnoit).
-- Dezactivăm și SMS template-ul contract_service (redundant acum — reminders vin de pe echipamente).

alter table public.contracts
  alter column period_type drop not null,
  alter column period_type drop default;

alter table public.contracts
  alter column expiry_date drop not null;

-- Dezactivează template-ul SMS contract_service — reminder-ele se generează acum
-- pe baza scadențelor de echipamente, nu pe expiry_date al contractului.
update public.sms_templates_admin
  set is_active = false,
      description = coalesce(description, '') || ' [DEZACTIVAT 2026-04-17: reminders vin din property_equipments scadențe]',
      updated_at = now()
  where reminder_type = 'contract_service';
