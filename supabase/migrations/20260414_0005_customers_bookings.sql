-- =====================================================
-- 0005 — Customers, properties, bookings, jobs, reviews, leads
-- =====================================================

-- ---------- customers (clienți finali, pot fi fără cont) ----------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- null = client guest
  customer_type text not null default 'individual'
    check (customer_type in ('individual','association','business')),
  full_name text not null,
  phone text not null,
  email text,
  cui text,                                    -- pentru clienți business / asociații
  association_name text,                        -- pentru asociație de proprietari
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_user on public.customers(user_id);
create index if not exists idx_customers_phone on public.customers(phone);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- ---------- properties (adrese unde e instalația) ----------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_type text not null
    check (property_type in ('apartment','house','building','office','association')),
  judet_id integer references public.judete(id) on delete set null,
  localitate_id integer references public.localitati(id) on delete set null,
  address text not null,
  block_name text,
  stair text,
  apartment text,
  floor text,
  lat numeric(10,6),
  lng numeric(10,6),
  has_detector boolean default false,
  detector_brand text,
  detector_installed_at date,
  last_verificare_at date,
  last_revizie_at date,
  next_verificare_due date,          -- calculată auto: last_verificare + 24 luni
  next_revizie_due date,             -- calculată auto: last_revizie + 120 luni
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_properties_customer on public.properties(customer_id);
create index if not exists idx_properties_localitate on public.properties(localitate_id);
create index if not exists idx_properties_next_verif on public.properties(next_verificare_due);
create index if not exists idx_properties_next_revizie on public.properties(next_revizie_due);

-- ---------- bookings (programări) ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  public_ref text not null unique,          -- ex: "VG-2026-000123"
  customer_id uuid not null references public.customers(id),
  property_id uuid not null references public.properties(id),
  firm_id uuid not null references public.gas_firms(id),
  service_category_id integer not null references public.service_categories(id),

  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','scheduled','in_progress','completed','cancelled','no_show')),

  preferred_date date,
  preferred_time_window text,               -- "dimineata","pranz","dupa-amiaza","seara"
  scheduled_start timestamptz,
  scheduled_end timestamptz,

  assigned_team_member_id uuid,
  price_quoted numeric(10,2),
  price_final numeric(10,2),

  notes_customer text,
  notes_internal text,
  source text,                               -- "web","phone","whatsapp","api","admin"

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

create index if not exists idx_bookings_customer on public.bookings(customer_id);
create index if not exists idx_bookings_firm on public.bookings(firm_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_scheduled on public.bookings(scheduled_start);
create index if not exists idx_bookings_public_ref on public.bookings(public_ref);

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------- jobs (execuția propriu-zisă, one-to-one cu booking) ----------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  job_status text not null default 'scheduled'
    check (job_status in ('scheduled','en_route','on_site','in_progress','completed','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer,
  summary text,
  photos jsonb,                              -- [{url, note}]
  measurements jsonb,                         -- date tehnice capturate
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_booking on public.jobs(booking_id);
create index if not exists idx_jobs_status on public.jobs(job_status);

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- ---------- reviews (recenzii verificate după job completat) ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  firm_id uuid not null references public.gas_firms(id),
  customer_id uuid not null references public.customers(id),
  rating_overall integer not null check (rating_overall between 1 and 5),
  rating_punctuality integer check (rating_punctuality between 1 and 5),
  rating_clarity integer check (rating_clarity between 1 and 5),
  rating_professionalism integer check (rating_professionalism between 1 and 5),
  body text,
  photos jsonb,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending','approved','rejected','flagged')),
  moderated_by uuid references auth.users(id),
  moderated_at timestamptz,
  firm_reply text,
  firm_reply_at timestamptz,
  short_link text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_firm on public.reviews(firm_id);
create index if not exists idx_reviews_status on public.reviews(moderation_status);

-- ---------- leads (cereri rapide fără programare fixă) ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  judet_id integer references public.judete(id),
  localitate_id integer references public.localitati(id),
  service_category_id integer references public.service_categories(id),
  message text,
  preferred_firm_id uuid references public.gas_firms(id),
  assigned_firm_id uuid references public.gas_firms(id),
  status text not null default 'new'
    check (status in ('new','assigned','contacted','converted','lost','spam')),
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  converted_booking_id uuid references public.bookings(id)
);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_assigned on public.leads(assigned_firm_id);
