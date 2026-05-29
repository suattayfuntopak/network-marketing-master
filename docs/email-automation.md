# E-posta otomasyonu (NMM) — n8n önerisi

NMU’daki n8n akışına benzer bir yapı **NMM’de henüz yok**. Uygulama içi bildirimler (`useNotifications`) var; **trial bitiş / hoş geldin e-postaları** için harici otomasyon önerilir.

## Sade ve işlevsel model (önerilen)

| Tetikleyici | Sıklık | Aksiyon |
|-------------|--------|---------|
| Yeni kayıt | Saatlik veya anlık (Supabase webhook) | Hoş geldin e-postası (Resend) |
| Deneme bitişine 3 gün kala | Günlük 09:00 | Hatırlatma + `/odeme` linki |
| Deneme bitişine 1 gün kala | Günlük 09:00 | Son hatırlatma |
| Deneme bitti | Günlük | “Erişim duraklatıldı” + plan seçimi |

**Veri kaynağı:** Supabase `nmm_workspaces` + `auth.users`  
- `license_type = 'free'`  
- `license_expires_at` (14 gün deneme bitişi)  
- `created_at` (yedek)

## n8n JSON nereye koyulur (git’e girmez)

`docs/local/n8n/` — bu klasör `.gitignore` ile hariç tutulur.  
Örnek: `docs/local/n8n/trial-reminders.json` (NMU akışınızdan uyarlayın).

## Alternatif: Vercel Cron + API route

Daha az parça, tamamen repoda:

- `src/app/api/cron/trial-emails/route.ts` (CRON_SECRET ile korunur)
- Günlük sorgu → Resend (`src/lib/infra/mail.ts` genişletilir)

**Artı:** Tek deploy, secret yönetimi Vercel’de.  
**Eksi:** n8n kadar görsel düzenleme yok.

## Önerilen sıra

1. **Faz 1:** n8n ile hızlı prototip (JSON’u `docs/local/n8n/` altına koyun, birlikte uyarlarız).  
2. **Faz 2:** İşe yarayan şablonları isteğe bağlı cron route’a taşıyın.

Shopier ödeme sonrası zaten `sendPaymentSuccessEmail` var; trial hatırlatmaları eksik parça.
