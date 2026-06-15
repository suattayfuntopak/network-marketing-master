-- 100: Müşteri & sipariş takibi (perakende tarafı — recruiting adayından ayrı)
-- NM geliri iki kaynaktan: kendi satışın (müşteri/sipariş) + ekibin. Bu modül ilkini ekler.

create table if not exists public.nmm_customers (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.nmm_workspaces(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text,
  note         text check (char_length(note) <= 200),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_customers_workspace_created
  on public.nmm_customers (workspace_id, created_at desc);

create table if not exists public.nmm_orders (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.nmm_workspaces(id) on delete cascade,
  customer_id  uuid not null references public.nmm_customers(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  amount       numeric(12,2) not null default 0 check (amount >= 0),
  note         text check (char_length(note) <= 200),
  ordered_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists idx_orders_workspace_ordered
  on public.nmm_orders (workspace_id, ordered_at desc);
create index if not exists idx_orders_customer_ordered
  on public.nmm_orders (customer_id, ordered_at desc);

-- updated_at trigger (mevcut paylaşılan fonksiyon)
drop trigger if exists nmm_customers_updated_at on public.nmm_customers;
create trigger nmm_customers_updated_at
  before update on public.nmm_customers
  for each row execute procedure public.nmm_update_updated_at();

alter table public.nmm_customers enable row level security;
alter table public.nmm_orders enable row level security;

-- RLS: kendi workspace'inin kayıtlarına tam erişim (nmm_candidates ile aynı kalıp;
-- super admin de kendi workspace'i içinde normal kullanıcı gibi — ayrı bypass yok).
drop policy if exists "nmm_customer_member_all" on public.nmm_customers;
create policy "nmm_customer_member_all" on public.nmm_customers
  for all using (
    workspace_id in (
      select workspace_id from public.nmm_workspace_members where user_id = auth.uid()
    )
  );

drop policy if exists "nmm_order_member_all" on public.nmm_orders;
create policy "nmm_order_member_all" on public.nmm_orders
  for all using (
    workspace_id in (
      select workspace_id from public.nmm_workspace_members where user_id = auth.uid()
    )
  );

comment on table public.nmm_customers is 'Perakende müşteriler (recruiting adayından ayrı) — kendi satış tarafı.';
comment on table public.nmm_orders is 'Müşteri siparişleri (tutar + tarih) — yeniden-sipariş ve ciro takibi.';
