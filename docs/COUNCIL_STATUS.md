# Council durum özeti (2026-05-31)

## 2. Tur — Triad (Torvalds + Aristoteles + Ada)

Tam rapor: [council-triad-2026-05-31.md](council-triad-2026-05-31.md). **Analiz turu — kod değişmedi.**

### Geçen turdan kapanan (regresyon yok)
A–D, #6–7, E (i18n), F (perf), G (error/loading boundary), H (E2E), K-1..K-5, Y-7/Y-11/Y-12, O-8 ✅

### Bu turun açık bulguları

| Faz | Kapsam | Bulgular | Durum |
|---|---|---|---|
| **A — Güvenlik** | Cron auth + secret hijyeni | K-1 (🔴), Y-1 | ⏳ bekliyor |
| **B — Cron doğruluğu** | İdempotency + timezone + lisans | Y-2, Y-3, O-9 | ⏳ |
| **C — Veri bütünlüğü** | Race + yalancı UI | Y-4, Y-5, O-1, O-2, O-12 | ⏳ |
| **D — i18n & yapı** | bimodal + flat lib + admin dedup | Y-7, O-3, O-4, O-6, O-8 | ⏳ |
| **E — `\|\|\|` göçü** | Okuma typed kolona, legacy sil | Y-6 | ⏳ (backfill doğrulaması) |
| **F — God component & hijyen** | Bölme + lint + log + circular | Y-8, O-5, O-7, O-10, O-11 | ⏳ |
| **G — Düşük öncelik** | Test, type, doc | L-1..L-4 | ⏳ |

### Önceki turdan devreden (1. tur)
| Paket | Not |
|-------|-----|
| **C — Shopier 501** | Shopier panel / API secret eşleşmesi — destek yanıtı bekleniyor |
