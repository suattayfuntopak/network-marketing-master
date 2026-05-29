# NMU n8n → NMM uyarlaması

`docs/local/n8n/trial-reminders.json` dosyanız **doğru yerde** ve NMU şemasına (`nmu_subscriptions`, `nmu_user_profiles`) bağlı. NMM için aynı mantığı kullanırken tablolar ve süreler değişir.

## NMM farkları

| NMU | NMM |
|-----|-----|
| 7 gün deneme | **14 gün** deneme (`license_expires_at`) |
| `nmu_subscriptions.trial_end_date` | `nmm_workspaces.license_expires_at` |
| `status = trialing` | `license_type = 'free'` |
| E-posta Gmail node | Öneri: **Resend** (repoda `trial-emails` cron) |

## Repoda hazır cron (Resend)

Günlük tetikleyici (Vercel Cron örneği):

`GET /api/cron/trial-emails`  
Header: `Authorization: Bearer CRON_SECRET`

Gönderilenler:

- Deneme bitimine **3** ve **1** gün kala  
- Deneme **bitti** (bitişten 1 gün sonra)  
- **15 gün** sonra yeniden katılım (ekteki NMU örneğine benzer metin, açık tema)

E-postalar: `src/lib/infra/trialEmails.ts` — karanlık tema yok, harici resim yok.

## n8n kullanmaya devam ederseniz — örnek SQL

**3 veya 1 gün kala** (günlük 09:00):

```sql
SELECT u.email,
       w.license_expires_at,
       (w.license_expires_at::date - CURRENT_DATE) AS days_left
FROM nmm_workspaces w
JOIN nmm_workspace_members m ON m.workspace_id = w.id AND m.role = 'leader'
JOIN auth.users u ON u.id = m.user_id
WHERE w.license_type = 'free'
  AND w.license_expires_at::date IN (
    (CURRENT_DATE + INTERVAL '3 days')::date,
    (CURRENT_DATE + INTERVAL '1 day')::date
  );
```

**Deneme bitti** (dün bitti, hâlâ free):

```sql
SELECT u.email
FROM nmm_workspaces w
JOIN nmm_workspace_members m ON m.workspace_id = w.id AND m.role = 'leader'
JOIN auth.users u ON u.id = m.user_id
WHERE w.license_type = 'free'
  AND w.license_expires_at::date = (CURRENT_DATE - INTERVAL '1 day')::date;
```

**15 gün sonra hatırlatma** (ödeme yok):

```sql
SELECT u.email
FROM nmm_workspaces w
JOIN nmm_workspace_members m ON m.workspace_id = w.id AND m.role = 'leader'
JOIN auth.users u ON u.id = m.user_id
WHERE w.license_type = 'free'
  AND w.license_expires_at::date = (CURRENT_DATE - INTERVAL '15 days')::date;
```

Gmail node HTML’inde NMU karanlık şablon yerine Resend ile aynı metin yapısını kullanın veya cron + Resend’e geçin.

## Vercel Cron örneği (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-emails",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/license-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

`CRON_SECRET`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` Vercel env’de tanımlı olmalı.
