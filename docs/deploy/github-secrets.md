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
| `PLAYWRIGHT_TRIAL_EXPIRED_EMAIL` | Opsiyonel (expired-trial E2E) | Hayır | E2E expired trial |
| `PLAYWRIGHT_TRIAL_EXPIRED_PASSWORD` | Opsiyonel (expired-trial E2E) | Hayır | E2E expired trial |
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
| `NEXT_PUBLIC_SUPABASE_URL` | Production/staging Supabase URL (E2E job build; Build job placeholder kullanır) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | E2E build + server actions |
| `GEMINI_API_KEY` | AI özellikleri (build sırasında import) |
| `PLAYWRIGHT_TEST_EMAIL` | E2E giriş test kullanıcısı e-postası |
| `PLAYWRIGHT_TEST_PASSWORD` | E2E giriş test kullanıcısı şifresi |
| `PLAYWRIGHT_TRIAL_EXPIRED_EMAIL` | *(Opsiyonel)* 14 gün denemesi bitmiş test hesabı — `e2e/expired-trial-ekip.spec.ts` |
| `PLAYWRIGHT_TRIAL_EXPIRED_PASSWORD` | *(Opsiyonel)* Deneme bitmiş hesap şifresi |

**`PLAYWRIGHT_TRIAL_EXPIRED_*` tanımlı değilse** expired-trial spec’leri atlanır (ana E2E yeşil kalır). Ekibim crash regresyonu için staging’de trial’ı bitmiş ayrı bir hesap önerilir.

**`PLAYWRIGHT_TEST_*` yoksa E2E job bilinçli olarak atlanır** (workflow uyarısı + yeşil job). Build job yine lint + derleme çalıştırır. Auth’lu senaryoları CI’da koşturmak için aşağıdaki adımları uygulayın.

#### E2E secret ekleme (adım adım)

1. Supabase’de yalnızca test için bir kullanıcı oluşturun (veya mevcut staging hesabını kullanın).
2. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**.
3. Sırayla ekleyin: `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`.
4. (Önerilen) Aynı Supabase/Gemini değerlerini `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` olarak da ekleyin — E2E job gerçek ortamda build eder.
5. **Actions → E2E (Playwright) → Run workflow** ile doğrulayın; “E2E skipped” adımı yerine Playwright raporu yüklenmeli.

### CI testi nasıl çalıştırılır?

1. **PR:** PR açıldığında `E2E (Playwright)` koşar (kod değişikliği varsa).
2. **Haftalık:** Pazartesi 06:00 (İstanbul) otomatik schedule.
3. **Manuel:** GitHub → Actions → **E2E (Playwright)** → **Run workflow** (büyük özellik / auth akışı değişikliği sonrası).
4. **Yerel:** `.env.local`'e `PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD` ekleyip `npm run test:e2e`.

`main` push **E2E tetiklemez** — prod gate yalnızca **CI Gate** (lint + unit + build, ~2 dk). E2E advisory kalır; deploy'u bloklamaz.

Migration drift için: Actions’ta **Migration check** workflow’unu veya yerelde `npm run migrate:check:remote` (token + ref gerekir).

### GitHub bildirim e-postalarını sadeleştirme

Çift bildirim (Vercel deploy + Actions fail) almak istemiyorsanız:

1. GitHub → profil **Settings → Notifications → Actions**
2. **Send notifications for failed workflows only** seçin (veya `main` dışı branch’lerde kapatın)
3. Vercel deploy bildirimleri Dashboard → Project → Settings → Notifications üzerinden ayrı yönetilir

E2E workflow: **Lint** (~30 sn) → **Build** → **E2E (chromium)** + **E2E (mobile-chrome)** (paralel, ayrı Playwright artifact). Lint kırılırsa build başlamaz.

**Lint (PR)** (`lint-pr.yml`): PR açılınca yalnızca ESLint — Build/E2E beklemeden hızlı geri bildirim. Branch protection'da **Lint (PR)** zorunlu yapılabilir.

**Mobile E2E advisory:** `E2E (mobile-chrome)` `continue-on-error: true` — prod deploy gate yalnızca **E2E (chromium)** job'unu doğrular (`deploy.yml`).

**PR preview yorumu:** `preview-comment.yml` — Vercel preview deploy hazır olunca PR'a URL yorumu (GitHub ↔ Vercel entegrasyonu gerekir).

**PR preview deploy:** `vercel.json` yalnızca `main` auto-deploy'u kapatır; PR/preview branch'leri Vercel'de normal build alır (`scripts/vercel-should-build.sh` preview'da her zaman build eder). Prod gate ayrıdır (E2E + Deploy Hook).

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

## CI-driven deploy (opsiyonel gate) — `deploy.yml`

**Amaç:** Şu an Vercel, `main`’e her push’ta CI’dan **bağımsız** deploy eder. Build’i kıran commit zaten Vercel build’inde takılır; ama **derlenip davranışsal bozulan** (E2E’nin yakaladığı) bir commit prod’a gidebilir. Bu gate, prod deploy’u E2E yeşiline bağlar. Yarış yoktur: deploy yalnızca E2E koşusu tamamlanıp başarılı olunca `workflow_run` ile tetiklenir.

`deploy.yml` zaten repoda ve **secret yokken no-op**’tur (hiçbir şeyi bozmaz). Aktive etmek için 2 adım:

1. **Deploy Hook oluştur:** Vercel → Project → **Settings → Git → Deploy Hooks** → ad: `ci-prod`, branch: `main` → **Create**. Verilen URL’i kopyala.
2. **Secret ekle:** GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret** → ad: `VERCEL_DEPLOY_HOOK_URL`, değer: kopyaladığın URL.
3. **Auto-deploy’u kapat:** `vercel.json` içine ekle (Git push auto-deploy kapanır; Deploy Hook etkilenmez):
   ```json
   { "ignoreCommand": "bash scripts/vercel-should-build.sh", "git": { "deploymentEnabled": { "main": false } } }
   ```

Bu üçü tamamlanınca: push → E2E koşar → yeşilse `deploy.yml` hook’u tetikler → Vercel deploy eder. Kırmızıysa deploy **gitmez**. Doğrudan-`main`-push akışın değişmez.

> Secret’ı eklemeden 3. adımı yaparsan prod deploy **donar** (ne auto-deploy ne hook). Sıraya uy: önce 1–2, sonra 3.

### Prod'da değişiklik görünmüyorsa (sık nedenler)

| Belirti | Muhtemel neden | Çözüm |
|---------|----------------|--------|
| GitHub'da **E2E (Playwright) kırmızı**, Deploy **skipped** | `vercel.json` → `deploymentEnabled.main: false`; prod yalnızca E2E yeşil + Deploy Hook ile gider | Actions → failed run → **Build** job logunu aç (çoğunlukla `npm run lint` veya `npm run build`) |
| Vercel son deploy eski commit | Hook tetiklenmemiş veya E2E fail | E2E'yi yeşile getir; `VERCEL_DEPLOY_HOOK_URL` secret'ının tanımlı olduğunu doğrula |
| Unit test yeşil, E2E kırmızı | E2E ayrı job; build lint/build fail veya Playwright fail | `unit-test.yml` ile `e2e.yml` **Build** ayrı — ikisini de kontrol et |

**Zincir:** `main` push → Lint → Build → Playwright (desktop zorunlu, mobile advisory) → başarılıysa `Deploy (production)` → **chromium job doğrulama** → Vercel Deploy Hook → **prod smoke** (`/pano` HTTP 200/307, en fazla ~6 dk). Smoke fail → `prod-smoke` etiketli GitHub issue.

Opsiyonel repo variable: `NMM_PROD_URL` (varsayılan `https://nmm.suattayfuntopak.com`).

**Hub prefetch rollup cron:** `cron-emails.yml` günlük `GET /api/cron/hub-prefetch-rollup` (migration `078` + `CRON_SECRET`).

### Branch protection (önerilen)

GitHub → **Settings → Branches → Branch protection rule** (`main`):

- Require status checks: **Lint (PR)** (PR'lar), **Lint**, **Build**, **Vitest** (`Unit tests (Vitest)`), **E2E (chromium)** (zorunlu prod gate)
- İsteğe bağlı (advisory): **E2E (mobile-chrome)** — branch protection'a eklemeyin; flake prod'u bloklamasın
- Require branches up to date before merging

Böylece kırık lint/build main'e merge edilmeden yakalanır; prod deploy gate'i ile birlikte çalışır.

---

## Migration doğrulama & uygulama (CI)

- **`migrate-apply` job** (`.github/workflows/migrate-check.yml`): her migration değişikliğinde tüm `supabase/migrations/*.sql` GERÇEK bir Postgres'e (`scripts/ci/supabase-shim.sql` ile auth şeması + roller hazırlanır) sırayla uygulanır. `063/064`'teki "column phone does not exist" gibi şema-referans hataları artık prod'a sızmadan burada kırmızı verir. Secret gerektirmez.
- **`DB migrate (prod)` workflow** (`.github/workflows/db-push.yml`): bekleyen migration'ları PROD'a uygular — **yalnızca elle** (`workflow_dispatch`), onaylı. Gerekli secret'lar:
  - `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` (zaten var)
  - **`SUPABASE_DB_PASSWORD`** — Supabase → Project Settings → Database → Connection string şifresi
  - **Modlar:**
    - `dry-run` — bekleyenleri listeler (varsayılan, confirm gerekmez)
    - `apply` + `confirm=PUSH` — migration SQL'lerini uygular (`--include-all` gerekirse otomatik)
    - `repair-gaps` + `confirm=PUSH` — defter boşluğu (ör. 100 eksik, 101–103 uygulanmış); SQL çalıştırmaz, yalnız eksik numaraları "applied" işaretler
    - `repair` + `confirm=PUSH` — tüm yerel numaraları applied işaretler (tek seferlik, dikkatli)
  - **Dry-run kırmızı + "inserted before the last migration"** → önce `repair-gaps`, sonra tekrar `dry-run`. Yerel: `npm run db:repair-gaps` (`supabase link` gerekir).

### `workflow_dispatch` ne demek?

GitHub Actions'ta **elle tetikleme** modu. Otomatik koşmaz; siz **Actions → ilgili workflow → Run workflow** dersiniz.

| Workflow | Ne zaman elle koşturmalısınız? |
|----------|-------------------------------|
| **DB migrate (prod)** | Yeni migration prod'a gidecekse: önce `dry-run`, gerekirse `repair-gaps`, sonra `apply` |
| **E2E (Playwright)** | Auth/ödeme büyük değişiklik sonrası güven vermek için (Pazartesi cron zaten var) |
| **Migration check** | Drift şüphesi; remote kontrol için |

**E2E için yapmanız gereken bir şey yok** — Pazartesi 06:00 İstanbul'da otomatik koşar; isterseniz deploy öncesi manuel de tetikleyebilirsiniz.

## Yerel `.env.local`

Şablon: `.env.example` → `.env.local` olarak kopyalayın.

Geliştirme ve `npm run dev` için Supabase + Gemini zorunlu. E2E koşacaksanız `PLAYWRIGHT_TEST_*` ekleyin. CI-only secret’ları (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`) yalnızca yerelde migration drift kontrolü yapacaksanız ekleyin. Types yeniden üretmek: `npm run db:gen-types` (`supabase link` gerekir). Migration push: `npm run db:push:dry-run` / `npm run db:push`.
