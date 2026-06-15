-- 101: Ekip İletişim Hub'ı — lider duyuruları (downline okur)
-- Yazma: basit RLS (author_id = auth.uid()). Okuma (kendi + üst hat) cross-workspace
-- olduğundan server action'da admin client ile çözülür (mevcut downline kalıbı gibi).

create table if not exists public.nmm_team_announcements (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.nmm_workspaces(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) <= 120),
  body         text not null check (char_length(body) <= 1000),
  created_at   timestamptz not null default now()
);

create index if not exists idx_announcements_workspace_created
  on public.nmm_team_announcements (workspace_id, created_at desc);
create index if not exists idx_announcements_author_created
  on public.nmm_team_announcements (author_id, created_at desc);

alter table public.nmm_team_announcements enable row level security;

-- Yazar kendi duyurularını yönetir (insert/select/update/delete). Downline okuması
-- server action'da (admin client, üst hat çözümlemesi) yapılır — recursive RLS yok.
drop policy if exists "nmm_announcement_author_all" on public.nmm_team_announcements;
create policy "nmm_announcement_author_all" on public.nmm_team_announcements
  for all using (author_id = auth.uid()) with check (author_id = auth.uid());

comment on table public.nmm_team_announcements is
  'Lider ekip duyuruları; downline okuması server action ile (üst hat admin-resolve).';
