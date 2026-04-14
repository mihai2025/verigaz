-- =====================================================
-- 0010 — Firm subscriptions (billing + entitlements)
-- =====================================================
--
-- Tabelul firm_subscriptions urmărește istoricul abonamentelor per firmă.
-- gas_firms.plan + gas_firms.plan_valid_until sunt cache-uri convenabile,
-- dar sursa de adevăr e ultima rândul activ/trialing din firm_subscriptions.

create table if not exists public.firm_subscriptions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.gas_firms(id) on delete cascade,

  plan text not null check (plan in ('free','start','plus','premium')),
  billing_period text not null default 'yearly' check (billing_period in ('monthly','yearly')),
  amount numeric(10,2) not null,              -- preț plătit (snapshot la subscribe)
  currency text not null default 'RON',

  status text not null default 'pending'
    check (status in ('pending','trialing','active','past_due','canceled','expired')),

  -- stripe
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  stripe_checkout_session_id text,

  -- cycle
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  expires_at timestamptz,                     -- alias practic pt. current_period_end
  trial_end timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_firm_subs_firm on public.firm_subscriptions(firm_id);
create index if not exists idx_firm_subs_status on public.firm_subscriptions(status);
create index if not exists idx_firm_subs_expires on public.firm_subscriptions(expires_at);
create index if not exists idx_firm_subs_stripe_sub on public.firm_subscriptions(stripe_subscription_id);

drop trigger if exists trg_firm_subs_updated_at on public.firm_subscriptions;
create trigger trg_firm_subs_updated_at
before update on public.firm_subscriptions
for each row execute function public.set_updated_at();

-- Adaugă coloană pt plan_updated_at pe gas_firms dacă nu există
alter table public.gas_firms
  add column if not exists plan_updated_at timestamptz;
