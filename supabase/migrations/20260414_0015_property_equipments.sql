-- =====================================================
-- 0015 — Property equipments (instanțe echipament per adresă)
-- =====================================================
--
-- Un proprietar (customer) are 1+ adrese (properties). Fiecare adresă are
-- 0 sau mai multe echipamente instalate (centrale, detectoare, instalație gaz etc.).
-- Un proprietar poate avea 2 centrale la aceeași adresă (Ariston + Motan) cu date
-- diferite de fabricație/instalare și serial diferit.
--
-- Tabela `properties` are deja câteva câmpuri (has_detector, detector_brand, etc.)
-- care rezolvau modelul simplu anterior; le lăsăm pentru compat dar noua sursă de
-- adevăr pentru multi-echipament e `property_equipments`.

create table if not exists public.property_equipments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,

  -- Tipul echipamentului (unul din default catalog SAU custom firm)
  equipment_type_id integer references public.equipment_types(id) on delete set null,
  firm_equipment_type_id uuid references public.firm_equipment_types(id) on delete set null,

  -- Date specifice instanței
  brand text,                          -- ex: "Ariston", "Motan", "Bosch"
  model text,                          -- ex: "Genus One 24", "Kaplya 24 KSS"
  serial_number text,                  -- număr serie (unicul echipament)
  manufacture_date date,               -- data fabricației
  installation_date date,              -- data instalării (default = manufacture_date dacă lipsește)

  -- Istoric verificări (source of truth pentru scadențe per echipament)
  last_verificare_at date,
  next_verificare_due date,
  last_revizie_at date,
  next_revizie_due date,

  observations text,                   -- notițe tehnicianului / proprietarului

  is_active boolean not null default true,  -- false dacă a fost înlocuit
  deactivated_at timestamptz,
  replaced_by_id uuid references public.property_equipments(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prop_equip_property on public.property_equipments(property_id);
create index if not exists idx_prop_equip_type on public.property_equipments(equipment_type_id);
create index if not exists idx_prop_equip_firm_type on public.property_equipments(firm_equipment_type_id);
create index if not exists idx_prop_equip_active on public.property_equipments(property_id, is_active);
create index if not exists idx_prop_equip_next_verif on public.property_equipments(next_verificare_due);
create index if not exists idx_prop_equip_serial on public.property_equipments(serial_number) where serial_number is not null;

drop trigger if exists trg_prop_equip_updated_at on public.property_equipments;
create trigger trg_prop_equip_updated_at
before update on public.property_equipments
for each row execute function public.set_updated_at();

-- Leagă bookings la echipamentul specific (opțional — null = programare la nivel de adresă)
alter table public.bookings
  add column if not exists equipment_id uuid references public.property_equipments(id) on delete set null;

create index if not exists idx_bookings_equipment on public.bookings(equipment_id);

-- Leagă reminders la echipamentul specific (pentru "bulină verde" per echipament)
alter table public.reminders
  add column if not exists equipment_id uuid references public.property_equipments(id) on delete set null;

create index if not exists idx_reminders_equipment on public.reminders(equipment_id);

-- Check: cel puțin unul din equipment_type_id / firm_equipment_type_id trebuie setat
alter table public.property_equipments
  drop constraint if exists property_equipments_type_required;
alter table public.property_equipments
  add constraint property_equipments_type_required
  check (equipment_type_id is not null or firm_equipment_type_id is not null);
