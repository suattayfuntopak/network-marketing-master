# Smoke test: Günlük senkronu (057 — `nmm_day_journal`)

Deploy sonrası cross-device doğrulama checklist'i.

## Önkoşul

- `057_day_journal.sql` production'da uygulanmış (`nmm_day_journal` tablosu mevcut).
- Uygulama deploy edilmiş.

## Adımlar

1. **Cihaz A** — Giriş yap → Hızlı Bakış → Saha günlüğüne benzersiz metin yaz (ör. `sync-test-{timestamp}`).
2. 2–3 saniye bekle (debounced kayıt).
3. Supabase Table Editor'da ilgili `user_id` + bugünün `journal_date` satırını kontrol et; `content` dolu olmalı.
4. **Cihaz B** (farklı tarayıcı / gizli sekme / telefon) — Aynı hesapla giriş → Hızlı Bakış → aynı metin görünmeli.
5. **Cihaz B**'de metni düzenle → Cihaz A'da sayfayı yenile → güncel metin gelmeli.
6. Metni tamamen sil → DB satırı silinmeli (delete-on-empty).

## Offline / retry

1. DevTools → Network → Offline.
2. Günlüğe metin yaz → "Yerel kaydedildi — bulut senkronu bekliyor" toast'u görünmeli.
3. Online'a dön → birkaç saniye içinde sync tamamlanmalı (toast tekrar etmemeli).

## Başarısızlık

- Toast görünüyor ama sync olmuyorsa: RLS, migration uygulanmamış veya auth hatası — Vercel/Supabase loglarına bak.
