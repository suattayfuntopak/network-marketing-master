# Hot Log

## 2026-05-24 — Council Triad İyileştirme Paketi

### bug: useUpdateCandidate last_contact_at kaldırıldı (Kritik)

- `useUpdateCandidate`'te `last_contact_at: new Date().toISOString()` satırı kaldırıldı
- Not düzelten, takip tarihi güncelleyen kullanıcı artık "az önce arandı" kaydı oluşturmuyor
- `useDailyActions` algoritması artık temiz girdiye sahip; önceliklendirme düzgün çalışıyor
- `last_contact_at` yalnızca `useMarkContacted` (WA/Ara tıklaması) ile güncelleniyor

### bug: TakvimClient FOLLOW_DAYS duplikasyonu giderildi

- `TakvimClient.tsx`'teki yerel `FOLLOW_DAYS` sabiti silindi
- `lib/stages.ts`'den import edildi; tek kaynak of truth sağlandı

### feat: Bugün İlgilen — inline AI mesaj butonu

- Her aday kartına Bot ikonu eklendi (WA/Ara yanında)
- Tıklanınca `generateQuickMessageAction` server action çağrılıyor
- Mesaj üretilince clipboard'a otomatik kopyalanıyor + toast
- `/bugun/ilgilen → /pipeline/[id] → /yazar` 3 sayfa akışı tek tapa indi

### perf: EkipPanel N+1 sorgusu giderildi

- `fetchMembers`: N+1 (1 üye listesi + N aday sorgusu) → 2 paralel sorgu
- Tüm adaylar tek sorguda çekiliyor, JavaScript'te owner_id'ye göre gruplanıyor

### feat: Human-readable davet kodu (8 karakter)

- `nmm_workspaces.invite_code` kolonu eklendi (migration 003)
- 38 karakter UUID yerine `AHMET42` formatında 8 char alfanumerik kod
- Davet kodu büyük monospace font ile gösteriliyor
- Ekibe katılma flow'u `invite_code` ile arama yapıyor
- RLS yeniden yapılandırıldı: authenticated_read + owner_write ayrıldı
- **Not:** Migration 003'ü Supabase Dashboard → SQL Editor'dan çalıştır

### feat: Pipeline isim araması

- Stage filter'ın üstüne Search input eklendi
- Gerçek zamanlı filtreleme (büyük/küçük harf duyarsız)
- X butonu ile hızlı temizleme

### feat: Aktivite geçmişi (nmm_daily_actions artık okunuyor)

- `useActivityHistory(candidateId)` hook'u `useCandidates.ts`'e eklendi
- Kişi detay sayfasında son 10 eylem görüntüleniyor (arama / WA / not / aşama)
- Tablonun write-only durumu sona erdi

### feat: 3 adımlı onboarding modal

- Yeni kullanıcı 0 adayla baş başa kalıyordu → `OnboardingModal` bileşeni
- Adım 1: Hoş geldin motivasyonu
- Adım 2: İlk adayı ekle (inline AddCandidate)
- Adım 3: Lider davet kodu gir (opsiyonel join)
- `localStorage('nmm_onboarding_done')` ile bir kez gösterilir, sadece 0 adaylı kullanıcıya

---

## 2026-05-24

### ux: silme onay modalı sadeleştirildi

- `ConfirmDeleteModal`'dan gereksiz açıklama paragrafı (`{name} silindikten sonra 5 saniye içinde geri alabilirsiniz.`) kaldırıldı
- `name` prop'u artık kullanılmadığından interface'den ve tüm çağıran bileşenlerden (`EditCandidateSheet`, `CandidateDetail`, `EkipPanel`, `CandidateCard`) temizlendi
- Modal artık yalnızca uyarı ikonu, "Silmek istediğinizden emin misiniz?" başlığı ve iki buton içeriyor

### ux: kişi ekle paneli ortalanmış popup'a dönüştürüldü

- `AddCandidateSheet` mobilizde alta yapışan / masaüstünde sağ üste konumlanan alt sheet tasarımından arındırıldı
- `EditCandidateSheet` ile tutarlı şekilde tam ortada açılan centered modal olarak yeniden tasarlandı
- z-index hiyerarşisi `EditCandidateSheet` ile eşleştirildi (backdrop `z-[60]`, panel `z-[70]`)

---

### refactor: z-index merkezi sabitlerle yönetiliyor

- `src/lib/zIndex.ts` oluşturuldu — `sheetBackdrop(60)`, `sheet(70)`, `confirmBackdrop(80)`, `confirm(90)` sabitleri
- 9 bileşen güncellendi: `AddCandidateSheet`, `EditCandidateSheet`, `CandidateCard`, `CandidateDetail`, `ConfirmDeleteModal`, `ProfileModal`, `NotificationsModal`, `SettingsModal`, `EkipPanel`
- Tüm hardcoded `z-[xx]` sınıfları sabitlerle değiştirildi; çakışma riski ortadan kalktı

### feat: ConfirmDeleteModal bağlam mesajı desteği

- `message?: string` opsiyonel prop eklendi
- Mesaj verildiğinde başlığın altında bağlama özel küçük metin gösteriyor
- `EkipPanel`'de `"[üye adı] ekibinizden çıkarılacak."` mesajıyla kullanıma alındı

### feat: kişi ekle telefon formatı doğrulaması

- `AddCandidateSheet`'e `PHONE_RE = /^(\+90|0)5\d{9}$/` regex doğrulaması eklendi
- Hatalı format girişinde alan kırmızıya döner, açıklayıcı hata mesajı inline gösterilir
- Kullanıcı düzeltmeye başladığında hata otomatik temizlenir

### not: deleteWithUndo toast zaten mevcut

- 4. öneri `lib/deleteWithUndo.tsx`'te halihazırda uygulanmış durumdaydı
- Circular SVG countdown animasyonu + "Geri Al" butonu + 5 saniyelik timer zaten aktif

---

## 2026-05-24 (tur 3)

### fix: EditCandidateSheet'e telefon doğrulaması eklendi

- `PHONE_RE` regex doğrulaması `EditCandidateSheet`'e eklendi (`AddCandidateSheet` ile tutarlı)
- Hatalı format girişinde inline hata mesajı, alanın kırmızı kenarlaşması ve düzeltince otomatik temizleme

### fix: deleteWithUndo çift onClose kaldırıldı

- `deleteWithUndo` fonksiyonunun `onClose?` parametresi kaldırıldı
- `EditCandidateSheet` ve `CandidateDetail`'daki çift çağrı temizlendi; `onClose`/`router.push` artık sadece çağıran tarafından anında tetikleniyor

### fix: ConfirmDeleteModal onCancel useCallback ile sabitlendi

- `EditCandidateSheet`, `CandidateDetail`, `CandidateCard`, `EkipPanel`'de `onCancel` arrow function `useCallback` ile memoize edildi
- `useEffect` listener yeniden bağlanması engellendi

### refactor: CLAUDE.md'ye z-index ve deleteWithUndo kuralları eklendi

- `src/lib/zIndex.ts` kullanımı ve `deleteWithUndo`'nun parametre politikası belgelendi

### feat: aşama renkleri birbirinden ayrıştırıldı

- `sunum` → gökyüzü mavisi (`#E0F2FE / #0369A1`) — önceden yeşil ile aynıydı
- `katildi` → zümrüt yeşili (`#D1FAE5 / #065F46`) — tüm sekiz aşama artık görsel olarak belirgin
- `STAGE_CARD_BG` kart arka planları da güncellendi

### feat: swipe ile sekme navigasyonu

- `DashboardShell`'e dokunmatik swipe desteği eklendi
- Yatay kaydırma (≥60px, yatay/dikey oranı ≥2) sağa/sola sekme değiştiriyor
- Dikey kaydırma, diyagonal ve küçük kaydırmalar yok sayılıyor; masaüstünde etkisiz

---

## 2026-05-24 (tur 4)

### feat: sayfa geçiş animasyonları (View Transitions API)

- `next.config.ts`'e `experimental: { viewTransition: true }` eklendi
- `globals.css`'e `::view-transition-old/new(root)` kuralları + 6 keyframe eklendi
- `data-nav-dir="forward"` → sola kayarak geçiş; `"back"` → sağa kayarak geri
- `prefers-reduced-motion: reduce` desteğiyle animasyonlar erişilebilir

### feat: yön duyarlı swipe + BottomNav anlık geri bildirim

- `DashboardShell`'de `onTouchMove` ile swipe hedefi erken hesaplanıyor
- `pendingHref` `BottomNav`'a aktarılıyor: hedef sekme scale-110 ile öne çıkıyor
- BottomNav tıklamalarında `setNavDir` ile geçiş yönü belirleniyor

### refactor: PHONE_RE merkezi validation dosyasına taşındı

- `src/lib/validation.ts` oluşturuldu: `export const PHONE_RE = /^(\+90|0)5\d{9}$/`
- `AddCandidateSheet`'deki yerel kopya (satır 17) kaldırıldı; import ile değiştirildi
- `EditCandidateSheet` de aynı import'u kullanıyor

### refactor: STAGE_THEME tek kaynak olarak birleştirildi

- Badge + kart renkleri ayrı objeler yerine tek `STAGE_THEME` objesinde tanımlanıyor
- `STAGE_COLOR` ve `STAGE_CARD_BG` artık `STAGE_THEME`'den türetiliyor; ilerleyen değişikliklerde renk tutarsızlığı önlendi

### feat: YZ Mesajı güvenlik duvarı — konu dışı soru yönlendirme

- `generateMessage.ts` sistem promptu 3 görev modeli ile güncellendi
- NM sektörü soruları → kısa pratik Türkçe cevap
- Tamamen konu dışı istekler (haber, yemek, yazılım vb.) → kibar yönlendirme mesajı
- Mesaj üretme ana görevi değişmeden korunuyor

### ux: not karakter limiti 500 → 1000 karakter

- `AddCandidateSheet`, `EditCandidateSheet`, `YazarForm` güncellendi
- Etiket metni "(max 500 karakter)" → "(max 1000 karakter)" olarak düzeltildi
