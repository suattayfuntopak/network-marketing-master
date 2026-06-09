# Ortam değişkenleri — nereye ne gider?

## Özet tablo

| Değişken | `.env.local` (geliştirme) | Vercel (prod/preview) | GitHub Actions |
|----------|---------------------------|------------------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Evet | Evet | E2E build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Evet | Evet | E2E build |
| `SUPABASE_SERVICE_ROLE_KEY` | Evet | Evet | E2E build |
| `GEMINI_API_KEY` | Evet | Evet | E2E build |
| `PLAYWRIGHT_TEST_EMAIL` | Evet (yalnızca `npm run test:e2e`) | Hayır | E2E auth |
| `PLAYWRIGHT_TEST_PASSWORD` | Evet (yalnızca `npm run test:e2e`) | Hayır | E2E auth |
| `SUPABASE_ACCESS_TOKEN` | Hayır (isteğe bağlı `migrate:check:remote`) | Hayır | `migrate-check.yml` |
| `SUPABASE_PROJECT_REF` | Hayır | Hayır | `migrate-check.yml` |
| `CRON_SECRET` | Evet (cron test) | Evet | Cron workflow |
| `NMM_APP_URL` | Evet | Evet | Cron / e-posta |
| `RESEND_API_KEY` | Evet (e-posta test) | Evet | Genelde gerekmez |

**Kural:** GitHub’a eklediğiniz secret’lar CI için yeterlidir; uygulama runtime’ı Vercel env’den beslenir. `PLAYWRIGHT_*` ve `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF` Vercel’e **eklenmez**.

---

## GitHub Actions secret'ları

Repo → **Settings → Secrets and variables → Actions**

### Migration drift (`migrate-check.yml`)

| Secret | Açıklama |
|--------|----------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) personal access token |
| `SUPABASE_PROJECT_REF` | Proje ref (Settings → General → Reference ID) |

Tanımlı değilse remote job sessizce atlanır; local numara doğrulaması yine çalışır.

### E2E Playwright (`e2e.yml`)

| Secret | Açıklama |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production/staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Build + server actions için |
| `GEMINI_API_KEY` | AI özellikleri (build sırasında import) |
| `PLAYWRIGHT_TEST_EMAIL` | E2E test kullanıcısı e-postası |
| `PLAYWRIGHT_TEST_PASSWORD` | E2E test kullanıcısı şifresi |

**`PLAYWRIGHT_TEST_*` tamamen isteğe bağlıdır.** Tanımlı değilse veya giriş başarısızsa auth setup boş session yazar ve skip eder; landing + mobil smoke testleri yine koşar. Korunan route testleri (egitim/itirazlar redirect) yalnızca geçerli auth varken çalışır. Yanlış secret girmek artık tüm job'u düşürmez.

### CI testi nasıl çalıştırılır?

1. **Otomatik:** `main`’e push veya PR açıldığında `E2E (Playwright)` workflow’u tetiklenir.
2. **Manuel:** GitHub → Actions → **E2E (Playwright)** → **Run workflow**.
3. **Yerel:** `.env.local`’e `PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD` ekleyip `npm run test:e2e`.

Migration drift için: Actions’ta **Migration check** workflow’unu veya yerelde `npm run migrate:check:remote` (token + ref gerekir).

### GitHub bildirim e-postalarını sadeleştirme

Çift bildirim (Vercel deploy + Actions fail) almak istemiyorsanız:

1. GitHub → profil **Settings → Notifications → Actions**
2. **Send notifications for failed workflows only** seçin (veya `main` dışı branch’lerde kapatın)
3. Vercel deploy bildirimleri Dashboard → Project → Settings → Notifications üzerinden ayrı yönetilir

E2E workflow iki job kullanır: **Build** (önce) ve **E2E (chromium)** (`needs: build`). Build kırılırsa Playwright adımı hiç başlamaz — mailde hangi aşamanın düştüğü net görünür.

---

## Vercel

Dashboard → Project → Settings → Environment Variables. Production ve Preview için en az:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `CRON_SECRET`, `NMM_APP_URL`, `RESEND_*` (e-posta/cron kullanıyorsanız)

Yeni ürettiğiniz Supabase/Gemini anahtarlarını GitHub’a girdikten sonra **aynı değerleri Vercel’e de** kopyalayın; aksi halde canlı ortam eski key ile kalır.

---

## Yerel `.env.local`

Geliştirme ve `npm run dev` için Supabase + Gemini zorunlu. E2E koşacaksanız `PLAYWRIGHT_TEST_*` ekleyin. CI-only secret’ları (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`) yalnızca yerelde migration drift kontrolü yapacaksanız ekleyin.
