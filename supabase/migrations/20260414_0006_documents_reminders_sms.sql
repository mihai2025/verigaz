-- =====================================================
-- 0006 — Documents, reminders, SMS logs
-- =====================================================

-- ---------- documents (certificate digitale emise) ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  firm_id uuid not null references public.gas_firms(id),
  customer_id uuid not null references public.customers(id),
  property_id uuid references public.properties(id),

  document_type text not null
    check (document_type in (
      'certificat_verificare',
      'proces_verbal_revizie',
      'declaratie_detector',
      'certificat_conformitate',
      'fisa_tehnica_centrala',
      'anexa_fotografii'
    )),
  document_number text not null,             -- nr. document emis de firmă
  version integer not null default 1,
  public_ref text unique,                     -- link scurt pentru verificare online

  file_url text not null,                     -- R2 signed URL sau path public
  sha256_hash text,                           -- amprenta fișierului
  qr_code_url text,

  signed_status text not null default 'unsigned'
    check (signed_status in ('unsigned','self_signed','e_signed','cloud_signed')),
  signed_by text,
  signature_data jsonb,

  issued_at timestamptz not null default now(),
  valid_from date,
  valid_until date,
  revoked_at timestamptz,
  revoked_reason text,

  meta jsonb,                                 -- date tehnice specifice tipului
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_job on public.documents(job_id);
create index if not exists idx_documents_firm on public.documents(firm_id);
create index if not exists idx_documents_customer on public.documents(customer_id);
create index if not exists idx_documents_type on public.documents(document_type);
create index if not exists idx_documents_public_ref on public.documents(public_ref);

-- ---------- reminders (scadențe viitoare) ----------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  related_document_id uuid references public.documents(id) on delete set null,
  related_booking_id uuid references public.bookings(id) on delete set null,
  firm_id uuid references public.gas_firms(id),

  reminder_type text not null
    check (reminder_type in (
      'verificare_24m',          -- scadență verificare la 2 ani
      'revizie_120m',            -- scadență revizie la 10 ani
      'service_detector_12m',    -- service anual detector
      'contract_service',        -- reînnoire contract service
      'iscir_centrala'           -- scadență VTP centrală
    )),

  scheduled_for timestamptz not null,         -- momentul exact de trimitere
  advance_days integer not null default 30,   -- cu câte zile înainte de scadență e trimis

  channel text not null default 'sms'
    check (channel in ('sms','email','whatsapp','push','all')),
  status text not null default 'queued'
    check (status in ('queued','sent','failed','skipped','opened','clicked','converted')),

  sent_at timestamptz,
  delivered_at timestamptz,
  response_at timestamptz,
  response_booking_id uuid references public.bookings(id),

  template_used text,
  rendered_body text,
  error_message text,

  created_at timestamptz not null default now()
);

create index if not exists idx_reminders_customer on public.reminders(customer_id);
create index if not exists idx_reminders_property on public.reminders(property_id);
create index if not exists idx_reminders_scheduled on public.reminders(scheduled_for);
create index if not exists idx_reminders_status on public.reminders(status);
create index if not exists idx_reminders_type on public.reminders(reminder_type);

-- ---------- sms_logs (istoric SMS trimise prin smsadvert) ----------
create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  body text not null,
  template_key text,
  provider text not null default 'smsadvert',
  provider_message_id text,
  status text not null default 'sent'
    check (status in ('queued','sent','delivered','failed','bounced')),
  error_message text,

  -- legături opționale către entități
  booking_id uuid references public.bookings(id) on delete set null,
  reminder_id uuid references public.reminders(id) on delete set null,
  firm_id uuid references public.gas_firms(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,

  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  cost_cents integer,
  segments integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_sms_logs_phone on public.sms_logs(phone);
create index if not exists idx_sms_logs_status on public.sms_logs(status);
create index if not exists idx_sms_logs_booking on public.sms_logs(booking_id);
create index if not exists idx_sms_logs_created on public.sms_logs(created_at desc);
