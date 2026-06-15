-- 102: İçerik takvimi — Sosyal Satış Stüdyosu'nda üretilen içeriğin planlanması

create table if not exists public.nmm_content_plans (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.nmm_workspaces(id) on delete cascade,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  platform      text not null default 'instagram',
  scheduled_for date not null,
  body          text not null check (char_length(body) <= 2000),
  is_posted     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_content_plans_workspace_sched
  on public.nmm_content_plans (workspace_id, scheduled_for asc);

alter table public.nmm_content_plans enable row level security;

-- RLS: kendi workspace'inin planlarına tam erişim (nmm_candidates kalıbı).
drop policy if exists "nmm_content_plan_member_all" on public.nmm_content_plans;
create policy "nmm_content_plan_member_all" on public.nmm_content_plans
  for all using (
    workspace_id in (
      select workspace_id from public.nmm_workspace_members where user_id = auth.uid()
    )
  );

comment on table public.nmm_content_plans is
  'İçerik takvimi: Sosyal Stüdyo''dan planlanan gönderiler (platform + tarih + metin).';
