-- E-posta gönderim kaydı: cron'ların aynı gün aynı kişiye çift e-posta göndermesini önler.
-- Idempotency: (workspace_id, kind, sent_date) üçlüsü benzersiz. Cron "claim-before-send"
-- yapar; insert çakışırsa (zaten gönderilmiş) e-posta atlanır.

create table if not exists nmm_email_sent_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references nmm_workspaces(id) on delete cascade,
  kind text not null,
  sent_date date not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, kind, sent_date)
);

-- Yalnızca service-role (cron) erişir; RLS açık ama policy yok = istemci erişimi kapalı.
alter table nmm_email_sent_log enable row level security;

comment on table nmm_email_sent_log is
  'Cron e-posta idempotency kaydı. kind: trial_3d|trial_1d|trial_ended|trial_15d|license_7d|license_3d|license_1d. sent_date İstanbul takvim günü.';
