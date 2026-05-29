# Council durum özeti (2026-05-29)

Kaynak: [council-triad-2026-05-28.md](./council-triad-2026-05-28.md) (37 bulgu, Faz A–F planı).

## Tamamlanan ana başlıklar

| Alan | Durum |
|------|--------|
| Shopier webhook güvenliği (K-1) | ✅ OSB + imza; checkout 501 Shopier yanıtı bekleniyor |
| `checkAIQuota` merkezi kota (K-3) | ✅ Tüm AI server action'lar |
| AI auth / kota eksikleri (K-2) | ✅ ilgilen, pipeline özeti, translate |
| `lib/` reorganizasyon (O-7) | ✅ infra, domain, utils, ui |
| EkipPanel parçalama (K-5) | ✅ Alt bileşenler |
| Landing extract (Council #6) | ✅ |
| Test paketi (Council #7) | ✅ 64+ test |
| 14 gün tek deneme + Pano duyuru | ✅ |
| Ekibim Plus/Pro kapısı | ✅ |

## Kalan (sonraki paketler — onay sonrası)

| Paket | İçerik | Öncelik |
|-------|--------|---------|
| **E — i18n derinlik** | Kalan `lang === 'en'` UI kalıntıları (ProvaForm, CandidateDetail, Takvim) | Orta |
| **F — Performans** | `useTeamMembers` waterfall, candidates staleTime | Orta |
| **G — Hijyen** | README dışı boilerplate, error boundary route-level | Düşük |
| **H — E2E** | Playwright smoke (login, pano, ödeme launch mock) | Düşük |

## Faz notu

Kritik güvenlik ve kota maddeleri kapatıldı. Kalan işler ürün kalitesi ve bakım; tek sprintte hepsi zorunlu değil.
