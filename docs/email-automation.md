# E-posta otomasyonu (NMM)

> **Durum: UYGULANDI** (Resend + cron route'lar + GitHub Actions tetikleyici).
> Çalışan kurulum için doğrudan ["Repoda uygulandı"](#repoda-uygulandı-resend--cron) ve
> ["Cron test"](#cron-test--license_expires_at-rehberi) bölümlerine bakın.
> Aşağıdaki **n8n bölümü artık opsiyonel/geçmiş** — yeni kurulum gerektirmez, referans için tutuluyor.

**İdempotency (migration 036):** `trial-emails` ve `license-reminder` cron'ları, aynı gün
aynı workspace + e-posta türü için `nmm_email_sent_log`'a "claim-before-send" yazar; cron
iki kez tetiklense bile çift e-posta gitmez. **Deploy:** `036_email_sent_log.sql` uygulanmalı.

## (Opsiyonel/geçmiş) Sade ve işlevsel model — n8n

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

## Vercel Hobby — cron ücretsiz alternatif

Vercel **ücretsiz (Hobby)** planda “her gün saat 09:00’da şu URL’yi çağır” özelliği yok. Bu yüzden repoda **GitHub Actions** workflow var: `.github/workflows/cron-emails.yml`

GitHub → repo **Settings → Secrets → Actions**:

- `CRON_SECRET` — Vercel’deki ile aynı gizli anahtar
- `NMM_APP_URL` — `https://nmm.suattayfuntopak.com`

Kurulumdan sonra **Actions** sekmesinden workflow’u manuel çalıştırarak test edin. Ek ücret: GitHub public repo’da Actions kotası genelde yeterlidir.

**Proxy:** `src/proxy.ts` içinde `/api/cron/` oturum kontrolünden muaf (route kendi `CRON_SECRET` doğrulamasını yapar). Yoksa istekler `/giris`’e 307 ile düşer ve e-posta gitmez.

Doğrulama (yönlendirme takip edilmeden):

```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-redirs 0 \
  -H "Authorization: Bearer CRON_SECRET" \
  "https://nmm.suattayfuntopak.com/api/cron/trial-emails"
```

`200` beklenir; `307` = proxy whitelist eksik; `401` = secret uyuşmuyor.

## Cron test — `license_expires_at` rehberi

Cron **bugün** (sunucu UTC günü) için eşleşen workspace’lere mail atar. `processed: 0` = o gün koşula uyan kimse yok (hata değil).

### Deneme mailleri (`GET /api/cron/trial-emails`)

Workspace şartları:

- `license_type = 'free'`
- Lider satırı `nmm_workspace_members` (role = `leader`)
- Liderin `auth.users` kaydında geçerli e-posta

| Mail | `license_expires_at` (cron çalıştığı gün = **D**) | Örnek (D = 30 Mayıs 2026) |
|------|-----------------------------------------------------|---------------------------|
| 3 gün kala | **D + 3 gün** (o gün içinde) | `2026-06-02T12:00:00+00:00` |
| 1 gün kala | **D + 1 gün** | `2026-05-31T12:00:00+00:00` |
| Deneme bitti | **D − 1 gün** (dün bitti) | `2026-05-29T12:00:00+00:00` |
| 15 gün sonra | **D − 15 gün** | `2026-05-15T12:00:00+00:00` |

Saat için `T12:00:00+00:00` (veya aynı UTC günü içinde herhangi bir an) yeterli.

### Ücretli plan yenileme (`GET /api/cron/license-reminder`)

- `license_type` ∈ `leader`, `master`, `pro`
- Süresi dolmamış (`license_expires_at` > şimdi)

| Mail | `license_expires_at` |
|------|----------------------|
| 7 gün kala | **D + 7 gün** |
| 3 gün kala | **D + 3 gün** |
| 1 gün kala | **D + 1 gün** |

### Supabase’de hızlı test

1. Test workspace’inizi seçin (`nmm_workspaces`).
2. Yukarıdaki tabloya göre `license_expires_at` güncelleyin.
3. Cron’u tetikleyin:

```bash
curl -s --max-redirs 0 \
  -H "Authorization: Bearer CRON_SECRET" \
  "https://nmm.suattayfuntopak.com/api/cron/trial-emails"
```

4. Yanıtta `"processed": 1` ve `"sent": true` bekleyin; **Resend dashboard**’da gönderimi doğrulayın.

### Tam JSON yanıtı

```bash
curl -s --max-redirs 0 \
  -H "Authorization: Bearer CRON_SECRET" \
  "https://nmm.suattayfuntopak.com/api/cron/trial-emails" | python3 -m json.tool
```

`results` dizisinde `kind` (`trial_3d`, `trial_1d`, …) ve `sent` alanları görünür.

### Notlar

- Farklı **türler** (trial_3d, trial_1d…) aynı gün ayrı ayrı gidebilir (her job ayrı döngü). Ancak **aynı tür** aynı gün ikinci kez gitmez — `nmm_email_sent_log` idempotency guard'ı (migration 036) engeller.
- Testten sonra `license_expires_at`’i gerçek değere geri alın.
- Hoş geldin maili cron değil; **yeni kayıt** anında gider (`sendWelcomeEmail`).
