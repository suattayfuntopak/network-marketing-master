-- ============================================================
-- NMM: Network Marketing Master — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table nmm_workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table nmm_workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references nmm_workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'member'
                  check (role in ('leader', 'member')),
  full_name     text,
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table nmm_candidates (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references nmm_workspaces(id) on delete cascade,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  full_name        text not null,
  phone            text,
  stage            text not null default 'yeni'
                     check (stage in (
                       'yeni', 'iletisim', 'takip',
                       'sunum', 'kararsiz', 'katildi', 'kayboldu'
                     )),
  last_contact_at  timestamptz,
  note             text check (char_length(note) <= 200),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table nmm_daily_actions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references nmm_workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  candidate_id  uuid references nmm_candidates(id) on delete set null,
  action_type   text not null
                  check (action_type in ('call', 'whatsapp', 'note', 'stage_change')),
  note          text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on nmm_candidates (workspace_id, owner_id);
create index on nmm_candidates (workspace_id, stage);
create index on nmm_candidates (owner_id, last_contact_at);
create index on nmm_daily_actions (workspace_id, user_id);
create index on nmm_daily_actions (candidate_id);
create index on nmm_workspace_members (workspace_id);
create index on nmm_workspace_members (user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function nmm_update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger nmm_candidates_updated_at
  before update on nmm_candidates
  for each row execute procedure nmm_update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table nmm_workspaces        enable row level security;
alter table nmm_workspace_members enable row level security;
alter table nmm_candidates        enable row level security;
alter table nmm_daily_actions     enable row level security;

-- nmm_workspaces: sahibi okuyabilir/düzenleyebilir
create policy "nmm_workspace_owner_all" on nmm_workspaces
  for all using (owner_id = auth.uid());

-- nmm_workspace_members: kendi satırını veya sahip olduğu workspace'in üyelerini görebilir
create policy "nmm_member_read" on nmm_workspace_members
  for select using (
    user_id = auth.uid()
    or workspace_id in (
      select id from nmm_workspaces where owner_id = auth.uid()
    )
  );

-- nmm_workspace_members: workspace sahibi yönetebilir + ilk üyelik için self-insert
create policy "nmm_leader_manage_members" on nmm_workspace_members
  for all using (
    workspace_id in (
      select id from nmm_workspaces where owner_id = auth.uid()
    )
  );

create policy "nmm_owner_insert_first_membership" on nmm_workspace_members
  for insert with check (
    user_id = auth.uid() and
    workspace_id in (
      select id from nmm_workspaces where owner_id = auth.uid()
    )
  );

-- nmm_candidates: kendi workspace_id'sine ait kayıtlara tam erişim
create policy "nmm_candidate_owner_all" on nmm_candidates
  for all using (
    workspace_id in (
      select workspace_id from nmm_workspace_members
      where user_id = auth.uid()
    )
  );

-- nmm_daily_actions: kendi workspace'i
create policy "nmm_action_member_all" on nmm_daily_actions
  for all using (
    workspace_id in (
      select workspace_id from nmm_workspace_members
      where user_id = auth.uid()
    )
  );
