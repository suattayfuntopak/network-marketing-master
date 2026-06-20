# NMM Supabase Migrations

## Numbering Policy

**One number = one migration, monotonically increasing.**

When adding a new migration, use the next unused number (e.g. `019_*.sql`). Do not reuse a number even if the prior file with that number was small. Numbers form the total ordering Supabase uses to decide application order — collisions force alphabetical fallback within the same number, which is implicit and fragile.

## Known historical collision

Two files share `004_` from early development:
- `004_member_self_update.sql`
- `004_note_length_constraint.sql`

Both are already applied in production. Renaming them now would cause Supabase to treat them as new migrations and attempt re-application — risky. They are left as-is and documented here as the single exception. Do not introduce more `004_*` files.

## Adding a new migration

1. Pick the next number: `ls supabase/migrations | grep -oE '^[0-9]+' | sort -n | tail -1`, increment by one.
2. Name it descriptively: `019_short_kebab_purpose.sql`.
3. Test locally first, then apply to staging, then production.
4. After applying, regenerate types: `supabase gen types typescript --project-id <id> > src/types/database.types.ts` (or update manually — see `src/types/database.types.ts` header).

## Deploy checklist (production öncesi)

**⚙️ Prod'a uygulama OTOMATİKTİR.** Yeni migration'ı `supabase/migrations/`'a ekleyip
main'e push etmen yeterli — `migrate-check.yml` → `migrate-deploy` job'ı, doğrulama
yeşilse prod'a kendisi uygular. Elle `db push` / Dashboard SQL **gerekmez**.

1. `npm run migrate:check` — numara çakışması / boşluk (CI: `migrate-check.yml`).
   - **`migrate-apply` job** tüm migration'ları gerçek bir Postgres'e uygular (CI) →
     şema-referans hataları (olmayan kolon/tablo) PR'da yakalanır. Kırmızıysa prod'a UYGULANMAZ.
2. `src/types/database.types.ts`'i güncelle (şema değiştiyse).
3. **main'e push** → `migrate-deploy` job'ı bekleyen migration'ları prod'a otomatik uygular
   (numara + gerçek-Postgres apply yeşilse). Çalıştığını `Actions → Migration check →
   Migration apply (PROD)` job'ından doğrulayabilirsin.
4. Smoke test: yeni tablo/RLS ile ilgili UI akışını doğrula; `hot.md` deploy notuna ekle.

**İstisnai/elle** (`DB migrate (prod)` workflow): `repair-gaps`/`repair` (defter onarımı),
`apply` (otomatik job kapalıyken acil), `dry-run` (salt-okunur önizleme).

**Pending (2026-06):** `057_day_journal.sql` — `nmm_day_journal` günlük senkronu.
