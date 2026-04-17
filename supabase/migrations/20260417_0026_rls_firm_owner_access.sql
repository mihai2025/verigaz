-- =====================================================
-- 0026 — RLS policies pentru firm_owner (acces clienți prin firm_customer_links)
-- =====================================================
--
-- Scenariu: firma importă clienți fără user_id (clienți care nu au cont pe site).
-- RLS vechi pe customers/properties cerea auth.uid() = customers.user_id, care
-- nu funcționează când user_id e NULL. Firm_owner trebuie să vadă clienții săi
-- indiferent dacă au cont sau nu.

-- Customers: firm_owner vede clienții linkuiți la firma lui
drop policy if exists "customers_firm_owner_read" on public.customers;
create policy "customers_firm_owner_read"
  on public.customers for select
  using (
    exists (
      select 1 from public.firm_customer_links fcl
      join public.gas_firms f on f.id = fcl.firm_id
      where fcl.customer_id = customers.id
        and f.owner_user_id = auth.uid()
    )
  );

-- Customers: firm_owner poate updata clienții săi (pt editare telefon/email)
drop policy if exists "customers_firm_owner_update" on public.customers;
create policy "customers_firm_owner_update"
  on public.customers for update
  using (
    exists (
      select 1 from public.firm_customer_links fcl
      join public.gas_firms f on f.id = fcl.firm_id
      where fcl.customer_id = customers.id
        and f.owner_user_id = auth.uid()
    )
  );

-- Properties: firm_owner vede adresele clienților săi
drop policy if exists "properties_firm_owner_read" on public.properties;
create policy "properties_firm_owner_read"
  on public.properties for select
  using (
    exists (
      select 1 from public.firm_customer_links fcl
      join public.gas_firms f on f.id = fcl.firm_id
      where fcl.customer_id = properties.customer_id
        and f.owner_user_id = auth.uid()
    )
  );

-- Property equipments: firm_owner vede echipamentele din adresele clienților săi
drop policy if exists "property_equipments_firm_owner_read" on public.property_equipments;
create policy "property_equipments_firm_owner_read"
  on public.property_equipments for select
  using (
    exists (
      select 1 from public.properties p
      join public.firm_customer_links fcl on fcl.customer_id = p.customer_id
      join public.gas_firms f on f.id = fcl.firm_id
      where p.id = property_equipments.property_id
        and f.owner_user_id = auth.uid()
    )
  );

-- firm_customer_links: enable RLS + firm_owner citește linkurile firmei lui
alter table public.firm_customer_links enable row level security;
drop policy if exists "firm_customer_links_firm_owner_read" on public.firm_customer_links;
create policy "firm_customer_links_firm_owner_read"
  on public.firm_customer_links for select
  using (
    exists (
      select 1 from public.gas_firms f
      where f.id = firm_customer_links.firm_id
        and f.owner_user_id = auth.uid()
    )
  );
