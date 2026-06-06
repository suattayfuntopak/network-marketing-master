# GitHub Actions — gerekli secret'lar

Repo → **Settings → Secrets and variables → Actions** altında tanımlayın.

## Migration drift (`migrate-check.yml`)

| Secret | Açıklama |
|--------|----------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) personal access token |
| `SUPABASE_PROJECT_REF` | Proje ref (Settings → General → Reference ID) |

Tanımlı değilse remote job sessizce atlanır; local numara doğrulaması yine çalışır.

## E2E Playwright (`e2e.yml`)

| Secret | Açıklama |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production/staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Build + server actions için |
| `GEMINI_API_KEY` | AI özellikleri (build sırasında import) |
| `PLAYWRIGHT_TEST_EMAIL` | E2E test kullanıcısı e-postası |
| `PLAYWRIGHT_TEST_PASSWORD` | E2E test kullanıcısı şifresi |

`PLAYWRIGHT_TEST_*` yoksa auth setup boş state yazar; landing smoke testleri yine koşar, günlük sync testleri skip edilir.

## Opsiyonel

| Secret | Açıklama |
|--------|----------|
| `RESEND_API_KEY` | E-posta akışları (E2E'de genelde gerekmez) |
