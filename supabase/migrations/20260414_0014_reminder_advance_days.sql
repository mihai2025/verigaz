-- =====================================================
-- 0014 — Reminder advance days configurabil per firmă
-- =====================================================
--
-- Fiecare firmă poate seta cu câte zile înainte de scadență să plece notificarea.
-- Default: 7 zile. Se aplică la crearea reminder-urilor noi.
-- Reminder-urile existente păstrează advance_days-ul cu care au fost create.

alter table public.gas_firms
  add column if not exists reminder_advance_days integer not null default 7;

comment on column public.gas_firms.reminder_advance_days is
  'Câte zile înainte de scadența echipamentului se trimite notificarea clientului.';

-- Constraint sanity
alter table public.gas_firms
  drop constraint if exists gas_firms_reminder_advance_days_check;
alter table public.gas_firms
  add constraint gas_firms_reminder_advance_days_check
  check (reminder_advance_days between 0 and 90);
