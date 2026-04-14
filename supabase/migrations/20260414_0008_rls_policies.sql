-- =====================================================
-- 0008 — Row-Level Security policies
-- =====================================================

-- helper: is_admin(uid)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = uid and role in ('admin','administrator')
  );
$$;

-- helper: is_firm_owner(uid, firm_uuid)
create or replace function public.is_firm_owner(uid uuid, firm_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gas_firms
    where id = firm_uuid and owner_user_id = uid
  );
$$;

-- ==========================================
-- profiles
-- ==========================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

-- ==========================================
-- judete, localitati, service_categories, shop_categories — public read
-- ==========================================
alter table public.judete enable row level security;
alter table public.localitati enable row level security;
alter table public.service_categories enable row level security;
alter table public.shop_categories enable row level security;

drop policy if exists judete_public_read on public.judete;
create policy judete_public_read on public.judete for select using (true);

drop policy if exists localitati_public_read on public.localitati;
create policy localitati_public_read on public.localitati for select using (true);

drop policy if exists service_categories_public_read on public.service_categories;
create policy service_categories_public_read on public.service_categories for select using (is_active);

drop policy if exists shop_categories_public_read on public.shop_categories;
create policy shop_categories_public_read on public.shop_categories for select using (is_active);

-- ==========================================
-- gas_firms
-- ==========================================
alter table public.gas_firms enable row level security;

drop policy if exists gas_firms_public_read on public.gas_firms;
create policy gas_firms_public_read on public.gas_firms
  for select using (verification_status = 'approved' and is_active = true);

drop policy if exists gas_firms_owner_all on public.gas_firms;
create policy gas_firms_owner_all on public.gas_firms
  for all using (auth.uid() = owner_user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = owner_user_id or public.is_admin(auth.uid()));

-- firm_locations, firm_services, firm_documents
alter table public.firm_locations enable row level security;
alter table public.firm_services enable row level security;
alter table public.firm_documents enable row level security;

drop policy if exists firm_locations_public_read on public.firm_locations;
create policy firm_locations_public_read on public.firm_locations for select using (true);

drop policy if exists firm_locations_owner_write on public.firm_locations;
create policy firm_locations_owner_write on public.firm_locations
  for all using (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()))
  with check (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()));

drop policy if exists firm_services_public_read on public.firm_services;
create policy firm_services_public_read on public.firm_services for select using (is_active);

drop policy if exists firm_services_owner_write on public.firm_services;
create policy firm_services_owner_write on public.firm_services
  for all using (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()))
  with check (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()));

drop policy if exists firm_documents_owner_read on public.firm_documents;
create policy firm_documents_owner_read on public.firm_documents
  for select using (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()));

drop policy if exists firm_documents_owner_write on public.firm_documents;
create policy firm_documents_owner_write on public.firm_documents
  for all using (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()))
  with check (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()));

-- ==========================================
-- customers, properties — owner + firm care are programare + admin
-- ==========================================
alter table public.customers enable row level security;
alter table public.properties enable row level security;

drop policy if exists customers_self_read on public.customers;
create policy customers_self_read on public.customers
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists customers_self_write on public.customers;
create policy customers_self_write on public.customers
  for all using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists properties_customer_all on public.properties;
create policy properties_customer_all on public.properties
  for all using (
    exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
    or public.is_admin(auth.uid())
  )
  with check (
    exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
    or public.is_admin(auth.uid())
  );

-- ==========================================
-- bookings, jobs — customer + firm + admin
-- ==========================================
alter table public.bookings enable row level security;
alter table public.jobs enable row level security;

drop policy if exists bookings_access on public.bookings;
create policy bookings_access on public.bookings
  for select using (
    exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
    or public.is_firm_owner(auth.uid(), firm_id)
    or public.is_admin(auth.uid())
  );

drop policy if exists bookings_insert_any on public.bookings;
create policy bookings_insert_any on public.bookings
  for insert with check (true); -- insert public (guest booking) — validat in app

drop policy if exists bookings_firm_update on public.bookings;
create policy bookings_firm_update on public.bookings
  for update using (
    public.is_firm_owner(auth.uid(), firm_id)
    or public.is_admin(auth.uid())
    or exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
  );

drop policy if exists jobs_access on public.jobs;
create policy jobs_access on public.jobs
  for all using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (
          public.is_firm_owner(auth.uid(), b.firm_id)
          or public.is_admin(auth.uid())
          or exists (select 1 from public.customers c where c.id = b.customer_id and c.user_id = auth.uid())
        )
    )
  );

-- ==========================================
-- reviews — public read (approved), write după booking completat
-- ==========================================
alter table public.reviews enable row level security;

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (moderation_status = 'approved' or public.is_admin(auth.uid()));

drop policy if exists reviews_customer_insert on public.reviews;
create policy reviews_customer_insert on public.reviews
  for insert with check (
    exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
  );

drop policy if exists reviews_firm_reply on public.reviews;
create policy reviews_firm_reply on public.reviews
  for update using (
    public.is_firm_owner(auth.uid(), firm_id)
    or public.is_admin(auth.uid())
  );

-- ==========================================
-- leads — firm vede lead-urile atribuite, admin vede tot
-- ==========================================
alter table public.leads enable row level security;

drop policy if exists leads_insert_any on public.leads;
create policy leads_insert_any on public.leads for insert with check (true);

drop policy if exists leads_firm_read on public.leads;
create policy leads_firm_read on public.leads
  for select using (
    public.is_firm_owner(auth.uid(), assigned_firm_id)
    or public.is_admin(auth.uid())
  );

drop policy if exists leads_admin_write on public.leads;
create policy leads_admin_write on public.leads
  for update using (public.is_admin(auth.uid()) or public.is_firm_owner(auth.uid(), assigned_firm_id));

-- ==========================================
-- documents — customer + firm + admin (private)
-- ==========================================
alter table public.documents enable row level security;

drop policy if exists documents_access on public.documents;
create policy documents_access on public.documents
  for select using (
    exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
    or public.is_firm_owner(auth.uid(), firm_id)
    or public.is_admin(auth.uid())
  );

drop policy if exists documents_firm_write on public.documents;
create policy documents_firm_write on public.documents
  for all using (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()))
  with check (public.is_firm_owner(auth.uid(), firm_id) or public.is_admin(auth.uid()));

-- ==========================================
-- reminders, sms_logs — customer + firm + admin
-- ==========================================
alter table public.reminders enable row level security;
alter table public.sms_logs enable row level security;

drop policy if exists reminders_access on public.reminders;
create policy reminders_access on public.reminders
  for select using (
    exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
    or (firm_id is not null and public.is_firm_owner(auth.uid(), firm_id))
    or public.is_admin(auth.uid())
  );

drop policy if exists sms_logs_admin_firm_read on public.sms_logs;
create policy sms_logs_admin_firm_read on public.sms_logs
  for select using (
    public.is_admin(auth.uid())
    or (firm_id is not null and public.is_firm_owner(auth.uid(), firm_id))
  );

-- ==========================================
-- shop_products — public read (active), firm write
-- ==========================================
alter table public.shop_products enable row level security;

drop policy if exists shop_products_public_read on public.shop_products;
create policy shop_products_public_read on public.shop_products
  for select using (is_active);

drop policy if exists shop_products_seller_write on public.shop_products;
create policy shop_products_seller_write on public.shop_products
  for all using (
    (seller_firm_id is not null and public.is_firm_owner(auth.uid(), seller_firm_id))
    or public.is_admin(auth.uid())
  )
  with check (
    (seller_firm_id is not null and public.is_firm_owner(auth.uid(), seller_firm_id))
    or public.is_admin(auth.uid())
  );

-- ==========================================
-- shop_orders — buyer (dacă autentificat), seller firm, admin
-- ==========================================
alter table public.shop_orders enable row level security;

drop policy if exists shop_orders_insert_any on public.shop_orders;
create policy shop_orders_insert_any on public.shop_orders for insert with check (true);

drop policy if exists shop_orders_access on public.shop_orders;
create policy shop_orders_access on public.shop_orders
  for select using (
    (customer_id is not null and exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()))
    or (seller_firm_id is not null and public.is_firm_owner(auth.uid(), seller_firm_id))
    or public.is_admin(auth.uid())
  );

drop policy if exists shop_orders_seller_update on public.shop_orders;
create policy shop_orders_seller_update on public.shop_orders
  for update using (
    (seller_firm_id is not null and public.is_firm_owner(auth.uid(), seller_firm_id))
    or public.is_admin(auth.uid())
  );
