# Council durum özeti (2026-05-29)

## Tamamlanan

| Paket | Durum |
|-------|--------|
| A–D, #6–7 | ✅ |
| **E — i18n** | ✅ Takvim (`calendarLocale`), ProvaForm (`pickLangField`). CandidateDetail: notlar/aktivite bilingual alan — `lang` bilinçli kalır |
| **F — Performans** | ✅ `useTeamMembers` RPC + 2dk staleTime; candidates 60s |
| **G — Hijyen** | ✅ `RouteError` + pano/odeme/ekip/pipeline `error.tsx` |
| **H — E2E** | ✅ Playwright smoke (`e2e/landing.spec.ts`, `npm run test:e2e`) |
| Trial e-posta | ✅ Açık tema Resend + `/api/cron/trial-emails` (3g, 1g, bitti, +15g) |
| n8n JSON | ✅ `docs/local/n8n/trial-reminders.json` incelendi → `docs/n8n-nmm-adaptation.md` |

## Bekleyen

| Paket | Not |
|-------|-----|
| **C — Shopier 501** | Shopier destek yanıtı bekleniyor |

## Önceki oturumda kısmi bırakılma nedeni

Onayınız tüm paketleri kapsıyordu; önceki turda **popup UX + deploy aciliyeti** önceliklendi. E’nin tamamı (özellikle CandidateDetail/YazarForm server metinleri) yüzlerce satır `lang === 'en'` içeriyor — çoğu bilingual **içerik** seçimi, UI chrome değil. Faydalı kısımlar bu oturumda tamamlandı; kalan server action hata metinleri ayrı küçük paket olarak ele alınabilir.
