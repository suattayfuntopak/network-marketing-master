# Council durum özeti (2026-05-31)

## 2. Tur — Triad (Torvalds + Aristoteles + Ada)

Tam rapor: [council-triad-2026-05-31.md](council-triad-2026-05-31.md). **Analiz turu — kod değişmedi.**

### Geçen turdan kapanan (regresyon yok)
A–D, #6–7, E (i18n), F (perf), G (error/loading boundary), H (E2E), K-1..K-5, Y-7/Y-11/Y-12, O-8 ✅

### Bu turun açık bulguları

| Faz | Kapsam | Bulgular | Durum |
|---|---|---|---|
| **A — Güvenlik** | Cron auth + secret hijyeni | K-1 (🔴), Y-1 | ✅ `cronAuthError` guard + Resend fallback sil + typed admin client (gizli null bug yakalandı) |
| **B — Cron doğruluğu** | İdempotency + timezone + lisans | Y-2, Y-3, O-9 | ✅ `nmm_email_sent_log` (mig 036) + claim-before-send · İstanbul gün-başı · birleşik expiry · N+1→batch. **Deploy: migration 036.** |
| **C — Veri bütünlüğü** | Race + yalancı UI | Y-4, Y-5, O-1, O-2, O-12 | ✅ taze-okuma race fix · yalancı e-posta UI silindi · bulkDefer terminal filtre + batch · parent_id ölü koşul kaldırıldı |
| **D — i18n & yapı** | bimodal + flat lib + admin dedup | Y-7, O-3, O-4, O-6, O-8 | ✅ flat lib→domain · admin client dedup · inline super-admin→isSuperAdmin · eslint exact allowlist · deleteWithUndo→t() |

**Y-7 yeniden sınıflandırma (önemli):** "67 `lang === 'en'`" büyük ölçüde yanlış sayımdı. Çoğu meşru: `title_en:title_tr` (iki-dilli DB verisi — CLAUDE.md kalıbı) ve `'en-US':'tr-TR'` (locale argümanı). Gerçek hardcoded UI kopyası yalnızca `deleteWithUndo` (3 string → `common.*` anahtarları) + ölü `'Ayşe':'Ayşe'` ternary idi; ikisi de düzeltildi. Kalan kopya-vari ternary'ler `YazarForm`/`CandidateDetail` (god component) içinde → **Faz F**'te dekompozisyonla birlikte.
| **E — `\|\|\|` göçü** | Okuma typed kolona, legacy sil | Y-6 | ✅ backfill doğrulandı (mig 023 içinde) · parseNote→2-segment · ölü formatNote silindi · fallback avatar/warmth kaldırıldı |
| **F — God component & hijyen** | Bölme + lint + log + circular | Y-8, O-5, O-11 ✅ · O-7, O-10 ⏸️ | Y-8 circular dep kırıldı (notificationSound.ts) · O-5 translate-note→server action (API route silindi) · O-11 mail.ts success log temizlendi. **O-7/O-10 bilinçli ertelendi** (aşağıda). |

**O-7 + O-10 — neden ertelendi (dürüst mühendislik kararı):** Bu ikisi tek-geçiş otomatik düzeltmeye uygun DEĞİL; aceleci değişiklik çalışan premium UX'i bozar.
- **O-7 (god component):** `CandidateDetail` (1010) ve `IstatistiklerContent` (1000) satırlık dosyaların alt-bileşenlere bölünmesi çok-adımlı, app-doğrulaması (`/verify`) gerektiren bir refactor. EkipPanel örneği gibi tek tek, izleyerek yapılmalı.
- **O-10 (lint 86 error):** Çoğu davranışsal: 32 `set-state-in-effect` (SSR hydration guard kalıbı — körlemesine değiştirmek hydration'ı bozar), 8 `exhaustive-deps` (yanlış bağımlılık sonsuz döngü yapabilir), **1 `rules-of-hooks` (koşullu `useCallback` — potansiyel gerçek bug, öncelikli ele alınmalı)**, 12 `img→next/image` (layout/optimizasyon riski), 31 `any`, 30 `unused-vars`. Her biri ayrı, doğrulanarak yapılmalı.
- **Öneri:** O-7'yi bileşen-bileşen, O-10'u kural-kural ayrı oturumlarda `/verify` ile ilerletmek. rules-of-hooks bug'ı ilk sırada.
| **G — Düşük öncelik** | Test, type, doc | L-1..L-4 | ✅ L-1 kota UTC hizalama · L-3 calendarDates test (Faz B) · L-4 email-automation.md güncellendi · L-2 bilinçli "tip tüketim noktasında" kararı |

### Önceki turdan devreden (1. tur)
| Paket | Not |
|-------|-----|
| **C — Shopier 501** | Shopier panel / API secret eşleşmesi — destek yanıtı bekleniyor |
