-- =====================================================
-- 0004 — Gas firms (echivalent funeral_firms)
-- =====================================================

create table if not exists public.gas_firms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,      -- "SC ... SRL"
  brand_name text,                -- numele comercial afișat
  cui text unique,                -- cod unic înregistrare
  registration_no text,           -- nr. reg. comerț (J..)

  -- ANRE / ISCIR
  anre_authorization_no text,     -- nr. autorizație ANRE
  anre_category text,             -- ex: "EDIB", "EDSB", "IS"
  anre_valid_until date,
  iscir_authorization_no text,
  iscir_valid_until date,

  -- moderare
  verification_status text not null default 'pending'
    check (verification_status in ('pending','approved','rejected','suspended')),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  rejection_reason text,

  -- profil public
  description text,
  short_description text,
  logo_url text,
  cover_url text,
  phone text,
  phone_secondary text,
  email text,
  website text,
  whatsapp text,
  facebook_url text,
  instagram_url text,

  -- persoană responsabilă
  contact_person_name text,
  contact_person_role text,
  contact_person_phone text,
  contact_person_email text,

  -- adresă sediu
  sediu_judet_id integer references public.judete(id) on delete set null,
  sediu_localitate_id integer references public.localitati(id) on delete set null,
  sediu_adresa text,
  sediu_lat numeric(10,6),
  sediu_lng numeric(10,6),

  -- plan abonament
  plan text not null default 'free'
    check (plan in ('free','start','plus','premium')),
  plan_valid_until timestamptz,

  -- shop
  shop_enabled boolean not null default false,
  shop_delivery_options jsonb,    -- { locker: true, courier: true, pickup: true, own_fleet: false }

  -- SMS templates per firmă (override la nivel B2B)
  sms_template_verificare text,
  sms_template_revizie text,
  sms_template_confirmare_programare text,

  -- stats cached
  rating_avg numeric(3,2) default 0,
  rating_count integer default 0,
  bookings_count integer default 0,
  premium_articles_enabled boolean not null default false,

  is_active boolean not null default true,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gas_firms_slug on public.gas_firms(slug);
create index if not exists idx_gas_firms_status on public.gas_firms(verification_status);
create index if not exists idx_gas_firms_plan on public.gas_firms(plan);
create index if not exists idx_gas_firms_owner on public.gas_firms(owner_user_id);
create index if not exists idx_gas_firms_sediu_judet on public.gas_firms(sediu_judet_id);
create index if not exists idx_gas_firms_sediu_localitate on public.gas_firms(sediu_localitate_id);
create index if not exists idx_gas_firms_name_trgm on public.gas_firms using gin (legal_name gin_trgm_ops);

drop trigger if exists trg_gas_firms_updated_at on public.gas_firms;
create trigger trg_gas_firms_updated_at
before update on public.gas_firms
for each row execute function public.set_updated_at();

-- FK-ul profiles.firm_id → gas_firms.id (adăugăm acum că există tabelul)
alter table public.profiles
  drop constraint if exists profiles_firm_id_fkey,
  add constraint profiles_firm_id_fkey
    foreign key (firm_id) references public.gas_firms(id) on delete set null;

-- ---------- firm_locations (areas de operare) ----------
create table if not exists public.firm_locations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,
  judet_id integer not null references public.judete(id) on delete cascade,
  localitate_id integer references public.localitati(id) on delete cascade,
  service_radius_km integer default 15,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (firm_id, judet_id, localitate_id)
);

create index if not exists idx_firm_locations_firm on public.firm_locations(firm_id);
create index if not exists idx_firm_locations_judet on public.firm_locations(judet_id);
create index if not exists idx_firm_locations_localitate on public.firm_locations(localitate_id);

-- ---------- firm_services (many-to-many firmă ↔ serviciu + prețuri) ----------
create table if not exists public.firm_services (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,
  service_category_id integer not null references public.service_categories(id) on delete cascade,
  price_from numeric(10,2),
  price_to numeric(10,2),
  price_note text,               -- ex: "preț final în funcție de instalație"
  turnaround_days integer,       -- cât durează de la programare
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (firm_id, service_category_id)
);

create index if not exists idx_firm_services_firm on public.firm_services(firm_id);
create index if not exists idx_firm_services_category on public.firm_services(service_category_id);

-- ---------- firm_documents (autorizații scanate, contracte) ----------
create table if not exists public.firm_documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,
  document_type text not null,   -- "anre_authorization", "iscir_authorization", "cui_certificate", "insurance"
  file_url text not null,
  file_name text,
  valid_until date,
  uploaded_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_firm_documents_firm on public.firm_documents(firm_id);
create index if not exists idx_firm_documents_type on public.firm_documents(document_type);
