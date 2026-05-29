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

`docs/local/n8n/trial-reminders.json` — `.gitignore` sayesinde GitHub’a push edilmez.

### Adım adım (Mac)

1. **Terminal** (proje kökünde):

   ```bash
   cd /Users/suattayfuntopak/STT/ai/my-projects/network-marketing-master
   mkdir -p docs/local/n8n
   ```

2. **n8n’den dışa aktar:** NMU workflow → sağ üst menü → **Download** → `.json` dosyası iner.

3. **Dosyayı taşı / yeniden adlandır:**
   - Finder: İnen dosyayı `docs/local/n8n/` içine sürükleyin.
   - Adı: `trial-reminders.json` (tam yol örnek):

     `/Users/suattayfuntopak/STT/ai/my-projects/network-marketing-master/docs/local/n8n/trial-reminders.json`

   - Terminal alternatifi (İndirilenler’de `NMU-Trial.json` ise):

     ```bash
     cp ~/Downloads/"NMU-Trial-....json" docs/local/n8n/trial-reminders.json
     ```

4. **Doğrula:**

   ```bash
   ls -la docs/local/n8n/
   ```

   `trial-reminders.json` görünmeli. `git status` bu dosyayı **göstermemeli** (ignore).

5. **Cursor’da aç:** Sol dosya ağacında `docs/local/n8n/trial-reminders.json` — sohbette “JSON’u koydum” yazmanız yeterli; birlikte NMM alanlarına uyarlarız.

**Not:** Klasör ilk kez boşsa Cursor ağacında görünmeyebilir; Terminal’de `mkdir` sonrası **Reload Window** veya dosyayı Cursor’da **File → Open** ile açın.

## Alternatif: Vercel Cron + API route

Daha az parça, tamamen repoda:

- `src/app/api/cron/trial-emails/route.ts` (CRON_SECRET ile korunur)
- Günlük sorgu → Resend (`src/lib/infra/mail.ts` genişletilir)

**Artı:** Tek deploy, secret yönetimi Vercel’de.  
**Eksi:** n8n kadar görsel düzenleme yok.

## Önerilen sıra

1. **Faz 1:** n8n ile hızlı prototip (JSON’u `docs/local/n8n/` altına koyun, birlikte uyarlarız).  
2. **Faz 2:** İşe yarayan şablonları isteğe bağlı cron route’a taşıyın.

Shopier ödeme sonrası zaten `sendPaymentSuccessEmail` var.

## Repoda uygulandı (Resend + cron)

| E-posta | Ne zaman |
|---------|----------|
| Hoş geldin | Kayıt (`sendWelcomeEmail`) |
| Deneme 3 / 1 gün kala | Cron `trial-emails` |
| Deneme bitti | Cron (bitiş +1 gün) |
| **15 gün sonra** | Cron — NMU “ekibini büyüt” benzeri, **açık tema** |
| Lisans yenileme 7/3/1 | Cron `license-reminder` (ücretli planlar) |

Şablonlar: `src/lib/infra/emailTemplate.ts`, `trialEmails.ts` — karanlık tema ve harici resim yok.

n8n uyarlaması: [`n8n-nmm-adaptation.md`](./n8n-nmm-adaptation.md)
