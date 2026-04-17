-- =====================================================
-- 0020 — Contract reminders + SMS template
-- =====================================================
--
-- 1. Adaugă coloana `contract_id` la `reminders` pentru a lega direct
--    un reminder de contractul care expiră.
-- 2. Inserează template SMS pentru reminder_type 'contract_service'.

alter table public.reminders
  add column if not exists contract_id uuid references public.contracts(id) on delete set null;

create index if not exists idx_reminders_contract on public.reminders(contract_id) where contract_id is not null;

-- Previne dublare: max 1 reminder queued per (contract_id, advance_days)
create unique index if not exists uq_reminders_contract_advance
  on public.reminders(contract_id, advance_days)
  where contract_id is not null and status = 'queued';

-- Seed template SMS pentru contract_service
insert into public.sms_templates_admin (reminder_type, template, description, is_active, max_chars)
values (
  'contract_service',
  '{FIRMA}: contractul {CONTRACT} expira pe {DATA}. Reinnoire: {LINK}. Detalii: {TELEFON}',
  'SMS automat trimis la 60/30/7 zile inainte de expirarea unui contract de service/verificare.',
  true,
  160
)
on conflict (reminder_type) do update set
  template = excluded.template,
  description = excluded.description,
  is_active = excluded.is_active;
