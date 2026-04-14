-- =====================================================
-- 0007 — Magazin online (port din ghidulfunerar cu adaptare gaze)
-- =====================================================

-- ---------- shop_categories ----------
create table if not exists public.shop_categories (
  id serial primary key,
  slug text not null unique,
  nume text not null,
  descriere text,
  parent_id integer references public.shop_categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  icon text,
  created_at timestamptz not null default now()
);

insert into public.shop_categories (slug, nume, sort_order) values
  ('detectoare-gaze',       'Detectoare gaze',        1),
  ('detectoare-co',         'Detectoare CO',          2),
  ('senzori-fum',           'Senzori fum',            3),
  ('electrovalve',          'Electrovalve',           4),
  ('accesorii-instalare',   'Accesorii instalare',    5),
  ('piese-centrala',        'Piese centrală termică', 6),
  ('kit-conformitate',      'Kituri conformitate',    7)
on conflict (slug) do nothing;

-- ---------- shop_products ----------
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nume text not null,
  descriere text,
  descriere_scurta text,

  -- category + brand
  category_id integer references public.shop_categories(id) on delete set null,
  brand text,
  model text,
  sku text unique,

  -- preț
  price numeric(10,2) not null,
  price_old numeric(10,2),                     -- pentru discount display
  currency text not null default 'RON',
  vat_included boolean not null default true,

  -- firma care vinde (opțional — dacă null, platformă directă)
  seller_firm_id uuid references public.gas_firms(id) on delete set null,

  -- inventory
  stock integer not null default 0,
  manage_stock boolean not null default true,
  low_stock_threshold integer default 3,

  -- media
  image_url text,
  images jsonb,                                -- [{url, alt, order}]

  -- specificații tehnice (pentru detectoare: senzibilitate, certificare EN, etc.)
  specs jsonb,
  certifications jsonb,                         -- ["EN50194", "CE", "RoHS"]

  -- livrare / instalare
  delivery_options jsonb,                       -- override la nivel produs
  installation_available boolean not null default false,
  installation_price numeric(10,2),

  -- status
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new boolean not null default false,

  -- SEO
  meta_title text,
  meta_description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_products_slug on public.shop_products(slug);
create index if not exists idx_shop_products_category on public.shop_products(category_id);
create index if not exists idx_shop_products_seller on public.shop_products(seller_firm_id);
create index if not exists idx_shop_products_active on public.shop_products(is_active) where is_active = true;
create index if not exists idx_shop_products_name_trgm on public.shop_products using gin (nume gin_trgm_ops);

drop trigger if exists trg_shop_products_updated_at on public.shop_products;
create trigger trg_shop_products_updated_at
before update on public.shop_products
for each row execute function public.set_updated_at();

-- ---------- shop_orders ----------
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  public_ref text not null unique,              -- "VG-ORD-2026-000123"

  -- buyer
  customer_id uuid references public.customers(id) on delete set null,
  buyer_email text not null,
  buyer_name text not null,
  buyer_phone text not null,

  -- billing / shipping
  billing_address jsonb not null,
  shipping_address jsonb,
  cui text,                                     -- dacă factură pe firmă

  -- items (snapshot la momentul comenzii)
  items jsonb not null,                         -- [{product_id, nume, price, qty, sku}]
  subtotal numeric(10,2) not null,
  delivery_key text,
  delivery_label text,
  delivery_price numeric(10,2) not null default 0,
  discount_code text,
  discount_amount numeric(10,2) not null default 0,
  vat_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'RON',

  -- seller (opțional — pentru orders direct prin firma de platformă)
  seller_firm_id uuid references public.gas_firms(id) on delete set null,

  -- plată
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded','cancelled')),
  payment_provider text default 'stripe',
  stripe_payment_intent_id text,
  stripe_session_id text,
  paid_at timestamptz,

  -- fulfillment
  fulfillment_status text not null default 'pending'
    check (fulfillment_status in ('pending','processing','shipped','delivered','returned','cancelled')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  tracking_url text,
  tracking_number text,

  -- instalare opțional adăugată
  installation_requested boolean not null default false,
  installation_booking_id uuid references public.bookings(id),

  notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_orders_customer on public.shop_orders(customer_id);
create index if not exists idx_shop_orders_seller on public.shop_orders(seller_firm_id);
create index if not exists idx_shop_orders_payment_status on public.shop_orders(payment_status);
create index if not exists idx_shop_orders_fulfillment on public.shop_orders(fulfillment_status);
create index if not exists idx_shop_orders_created on public.shop_orders(created_at desc);

drop trigger if exists trg_shop_orders_updated_at on public.shop_orders;
create trigger trg_shop_orders_updated_at
before update on public.shop_orders
for each row execute function public.set_updated_at();
