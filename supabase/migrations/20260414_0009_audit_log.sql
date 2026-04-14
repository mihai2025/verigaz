-- =====================================================
-- 0009 — Audit log pentru acțiuni admin
-- =====================================================
--
-- Înregistrează acțiuni sensibile din dashboard-ul admin:
--   - firm KYB (approved/rejected/suspended)
--   - lead assignments + conversii
--   - review moderations
--   - orice altă acțiune care trebuie trasabilă legal/operational

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,                        -- snapshot rol la momentul acțiunii
  action text not null,                   -- ex: "firm.approve", "lead.assign", "review.reject"
  entity_type text not null,              -- ex: "gas_firms", "leads", "reviews"
  entity_id uuid not null,
  summary text,                            -- notă human-readable
  metadata jsonb,                          -- payload structurat (before/after, reason etc)
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_actor on public.audit_log(actor_user_id);
create index if not exists idx_audit_entity on public.audit_log(entity_type, entity_id);
create index if not exists idx_audit_action on public.audit_log(action);
create index if not exists idx_audit_created on public.audit_log(created_at desc);
