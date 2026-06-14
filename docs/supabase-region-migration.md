# Supabase Bölge Taşıma Runbook (eu-central-1 / Frankfurt)

> **Durum (2026-06-14): ERTELENDİ.** Supabase Free planında 2 proje slotu da dolu;
> Pro'ya geçilemiyor → yeni Frankfurt projesi açılamıyor. Bu, performansın **en
> büyük tek kaldıracı** (origin coğrafi uzaklığı ~320ms/sorgu → Frankfurt ~40-60ms,
> ~5x). Slot/Pro açılınca bu runbook uygulanır. Kod tarafındaki tüm round-trip ve
> auth-turu kırpmaları zaten yapıldı; tavanı yalnızca bu taşıma düşürür.
> Bağlam: `docs/performance.md`, hafıza `project_perf_round_trips`.

## Neden
TTFB ölçümü: Cloudflare edge (IST) connect ~17ms AMA gerçek PostgREST sorgusu
**~320-630ms**. Yani her tablo sorgusu + auth doğrulaması bu gecikmeye biner.
Kod optimizasyonu round-trip **sayısını** düşürür; **mesafeyi** yalnız bölge taşıma düşürür.

## Ön koşullar
- [ ] Supabase Pro (veya boş proje slotu) — yeni proje `eu-central-1` (Frankfurt) bölgesinde.
- [ ] Bakım penceresi (kısa yazma kesintisi) — kullanıcı trafiği düşükken (gece TR).
- [ ] `supabase` CLI giriş yapılı; eski + yeni proje ref'leri elde.

## Adımlar

### 1. Şema + veri taşı
```bash
# Eski projeden tam dump (şema + veri + roller).
supabase db dump --linked --file dump_full.sql            # şema
supabase db dump --linked --data-only --file dump_data.sql # veri
# Yeni Frankfurt projesine bağlan ve uygula:
supabase link --project-ref <YENI_REF>
psql "$NEW_DB_URL" -f dump_full.sql
psql "$NEW_DB_URL" -f dump_data.sql
```
- [ ] `supabase/migrations` defteri yeni projede senkron (gerekirse `migration repair`).
- [ ] RLS politikaları taşındı (dump içinde gelir) — `supabase/scripts/verify_rls_policies.sql` ile doğrula.
- [ ] `pg_cron` job'ları (070) yeni projede yeniden etkinleştir (dump cron şemasını taşımayabilir).

### 2. Storage (avatar/aday foto) taşı
- [ ] `nmm-avatars` bucket'ını yeni projeye kopyala (Storage API / `supabase storage cp` veya script).
- [ ] Bucket public/policy ayarlarını eşle.

### 3. Avatar URL domain rewrite
- [ ] DB'deki `avatar_url` değerleri eski proje storage domain'ini içeriyorsa yeni domaine
      güncelle (tek seferlik idempotent UPDATE; bkz. AGENTS.md veri-onarım migration kuralı).

### 4. Auth taşı
- [ ] `auth.users` dump ile taşındı mı doğrula (parola hash'leri dahil). Taşınmadıysa
      Supabase auth migrate yöntemini uygula. **Asimetrik JWT signing key** (ECC P-256)
      yeni projede de aktif olmalı → `getClaims` yerel doğrulaması (kod buna dayanıyor) çalışsın.

### 5. Uygulama env değişimi (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
      yeni proje değerleriyle güncelle (Production + Preview).
- [ ] Redeploy.

### 6. Shopier
- [ ] Webhook **app domain'inde** (`/api/payment/shopier`), Supabase'e bağlı değil → **etkilenmez.**
      Yine de bir test ödemesi/webhook ile doğrula.

## Doğrulama (taşıma sonrası)
- [ ] `BASE_URL=https://<app> NMM_COOKIE="..." npm run perf:baseline` → p75 TTFB
      ~320ms'den ~40-60ms'e düşmeli (docs/performance.md §3 tablosuna "sonrası" satırı işle).
- [ ] `supabase/scripts/verify_focus_team_identity.sql` (süper admin Focus Team kimliği) yeşil.
- [ ] Giriş, pano, metrik sayfaları, bildirim realtime, ödeme akışı duman testi.

## Geri dönüş (rollback)
- [ ] Sorun olursa Vercel env'i eski proje değerlerine geri al + redeploy. Eski proje
      taşıma onaylanana dek **silinmez** (en az 1 hafta paralel tut, sonra kapat).
