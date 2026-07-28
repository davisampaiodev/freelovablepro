create table if not exists public.utmify_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  status text not null
    check (status in ('processing', 'sent', 'failed')),
  attempts integer not null default 1
    check (attempts > 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.utmify_deliveries enable row level security;

create index if not exists utmify_deliveries_status_updated_at_idx
  on public.utmify_deliveries (status, updated_at);
