# Hot Log

## 2026-05-24 — NMU-Style Bilingual (TR/EN) Migration & Premium Header Revamp

### feat: Çift Dilli (TR/EN) Dil Altyapısı (i18n) Kurulumu
- **Geliştirme:** Sistem genelinde dil durumunu yöneten ve `localStorage` üzerinde kaydedilen `LanguageProvider` React Context yapısı kuruldu.
- **Sözlükler:** `src/lib/translations/` altında `tr.ts` ve `en.ts` dosyaları oluşturularak tüm terimler profesyonel ağ pazarlaması terminolojisine (Prospect, Pipeline, Follow-up, Presentation Done, Objection Handling vb.) tam uyumlu olarak çevrildi.
- **Entegrasyon:** Giriş, Kayıt, Pano, Boru Hattı, Vaktin Varsa eğitim sayfaları ve menüler `useTranslation` ile tamamen iki dilli yapıldı.

### feat: Premium Siber-Punk NMM Neon Logo
- **Tasarım:** Yapay zeka ile son derece asil ve fütüristik NMM neon logo görseli (`public/logo.png`) üretildi.
- **Auth Sayfaları Revizyonu:** `AuthLayout` kabuğu, giriş/kayıt sayfaları ile birlikte, bu neon logoyla tam uyumlu parıldayan koyu siber-gradyan ve glassmorphic kart tasarımına kavuşturuldu.

### feat: NMU Tasarımı Premium Horizontal Header Çubuğu
- **Tasarım:** Görseldeki sıralamaya tam uyumlu horizontal `Header.tsx` bileşeni sıfırdan inşa edilerek Dashboard üst çubuğu olarak yerleştirildi.
- **Elementler:**
  - Sol: Neon Logo + Başlık + "OPERATING SYSTEM / İŞLETİM SİSTEMİ" alt başlığı.
  - Orta: Google-style arama barı (`Ne istersen ara! ⌘K` placeholder ve `⌘K` kısayol odaklanma dinleyicisi).
  - Sağ: Hızlı Aday Ekleme Kıvılcım (Spark) butonu, Tema Switcher, TR/USA bayrak kapsül toggle butonu, sayı badge'li Çan bildirim ikonu ve Profil dropdown.
- **Responsive Entegrasyon:** Eski `MobileHeader` ve sabit sağ üst buton grupları kaldırılarak horizontal Header tüm ekran boyutlarında kusursuz çalışacak şekilde `DashboardShell`'e entegre edildi. Sol `Sidebar` ve mobil `BottomNav` ile tam sinerji sağlandı.

### feat: Kıvılcım Hızlı Aday Ekleme Modalı
- **Geliştirme:** Sadece isim ve isteğe bağlı not alarak tek tıkla adayları Boru Hattı'nda ilk aşamaya (`stages.yeni` / *New Prospect*) ekleyen `QuickAddModal.tsx` modal bileşeni tamamlandı. `useAddCandidate` mutasyonu ile anında veritabanına kayıt yapar ve cache'i tazeleyerek sayfayı günceller.

### feat: Google-Style Arama Sonuç Sayfası
- **Geliştirme:** `/search?q=QUERY` arama sonuç sayfası kuruldu.
- **Arama Kapsamı:** Case-insensitive olarak hem workspace adayları (isim, not, meslek, şehir vb.) hem de Vaktin Varsa eğitim içerikleri (başlık, özet, maddeler) taranır.
- **Akıllı Navigasyon:** Aday sonuçlarına tıklandığında `/pipeline/[id]` detayına; eğitim konularına tıklandığında `/egitim?id=[id]` sayfasına gidilerek **ilgili akordeon konusu otomatik genişletilir** ve görünür hale getirilir.

## 2026-05-24 — Pipeline Page Icon + Soft Stage Card Colors + Super Admin Bypass + Pano Grid Colors

### feat: Boru Hattı Sayfa Başlığı İkon Güncellemesi (TrendingUp)

- **Geliştirme:** Boru Hattı sayfasının (`pipeline/page.tsx`) en üstündeki `BarChart2` (sütun grafik) ikonu, panodaki "Boru Hattı" karesiyle tam uyumlu olacak şekilde **`TrendingUp`** (yükselen ok grafiği) ikonu ile değiştirildi.
- **Tasarım:** İkon kutusunun arka planı ve ikon rengi Dashboard ile tam uyumlu soft mavi tona (`bg-[#E8F0FE] dark:bg-[#0a1f4d] text-[#1A56DB] dark:text-[#93c5fd]`) güncellendi.

### feat: Aday Kartlarında Yumuşak Pastel Renkler (Özellikle Dark Mode İyileştirmesi)

- **Sorun:** Boru hattındaki aday kartlarının arka plan renkleri (`yeni`, `takip`, `sunum` vb.) özellikle **dark mode**'da çok koyu ve boğucu tondaydı, bu da görsel akıcılığı azaltıyordu.
- **Çözüm:** Tüm kart arka plan renkleri (`stages.ts` -> `STAGE_THEME`), tıpkı panodaki pastel renkler gibi **yumuşak, parlak ve yüksek kontrastlı pastel tonlara** güncellendi. Artık dark mode'da da kartlar aşamalarına göre gözü yormayan, son derece asil ve ayırt edilebilir soft pastel tonlarda parlıyor.

### feat: suattayfuntopak@gmail.com İçin Super Admin AI Limit Bypass

- **Özellik:** Uygulama sahibi olan `suattayfuntopak@gmail.com` e-posta adresi için günlük 20 AI mesaj limiti tamamen devre dışı bırakıldı (Sınırsız yapıldı).
- **Detaylar:**
  - `aiUsage.ts` kütüphanesine `bypass` parametresi eklendi.
  - Aktif kullanıcının e-postası Supabase Auth üzerinden çekilerek `suattayfuntopak@gmail.com` ise `isSuperAdmin` flag'i aktif edildi.
  - Super Admin için `isAILimitReached` kontrolü her zaman `false` döner, sayaç artırılmaz (`incrementAIUsage` engellenir) ve YZ sayfasındaki buton metninde `Üret (Sınırsız)` ifadesi yer alır. Olası tüm diğer yetki kısıtlamaları Super Admin için devre dışı bırakıldı.
- **Sıfırlanma Periyodu:** Günlük 20 limitinin sıfırlanması localStorage'da tarih damgasıyla (`YYYY-MM-DD`) tutulmaktadır. Dolayısıyla her gece yarısı 00:00 itibarıyla yeni bir gün anahtarı oluşturulduğunda sıfırlanma kendiliğinden milisaniyeler içinde gerçekleşmektedir.

### feat: Hızlı Erişim Kareleri Renk Sinerjisi ve Simetri Dengeleme

- **Renk Değişikliği:**
  - Vaktin Varsa kutusunun rengi **amber** yapılarak **Ekibim** kutusunun rengiyle birebir eşleştirildi.
  - Kazanımlar kutusunun rengi **teal** yapılarak **YZ Mesajı Üret** kutusunun rengiyle birebir eşleştirildi.
- **Renk Dağılımı:**
  - 1. Sütun: Zap (`purple`) ➔ Takvim (`pink`)
  - 2. Sütun: Boru Hattı (`blue`) ➔ İtirazlara Cevaplar (`indigo`)
  - 3. Sütun: YZ Mesajı Üret (`teal`) ➔ Vaktin Varsa (`amber`)
  - 4. Sütun: Ekibim (`amber`) ➔ Kazanımlar (`teal`)
  Böylece 3. ve 4. sütunlar simetrik olarak birbirinin zıt rengi yapılmış (Teal/Amber ve Amber/Teal) ve müthiş bir tasarım kalitesi elde edilmiştir.

### fix: Ekibim Sayfası React Hook Kural İhlali (React Error #310)

- **Sorun:** Ekibim sayfasında yer alan `EkipPanel.tsx` bileşeni yüklenirken tarayıcıda `Minified React error #310` (Rendered more hooks than during the previous render) hatasıyla çöküyordu. Bu durum, loading veya error durumlarındaki erken return'lerin (early returns) altında yer alan `handleMemberRemoveCancel` isimli `useCallback` hook'unun, koşullu olarak çalıştırılmasından (React'in Hook kurallarının ihlal edilmesinden) kaynaklanıyordu.
- **Çözüm:** `handleMemberRemoveCancel` `useCallback` hook tanımı dosyanın en üst seviyesine (tüm erken return/render koşullarının üstüne) taşınarak React Hook düzen kurallarına tam uyum sağlandı, sayfa çökmesi tamamen giderildi.

### fix: nmm_workspace_members RLS Infinite Recursion

- **Sorun:** `nmm_workspace_members` tablosundaki `SELECT` politikası, tablonun kendisini recursive sorguladığı için `infinite recursion detected` hatası veriyordu. Bu hata hem "Ekibim" sayfasının yüklenmesini engelliyor hem de `useWorkspace` hook'unun çökmesi sebebiyle profil ad soyadı / avatar vb. verilerin yüklenmesini baltalıyordu.
- **Çözüm:** `SECURITY DEFINER` yetkisiyle çalışan `nmm_is_member_of_workspace` SQL fonksiyonu oluşturuldu. Bu fonksiyon RLS kuralını bypass ederek güvenli bir şekilde sorgulama yapar. `SELECT` politikası bu fonksiyonu çağıracak şekilde güncellendi, sonsuz döngü giderildi. Tüm RLS tabloları sorunsuz çalışır hale getirildi.

### feat: Sunum Materyalleri Redesign (Mockup'a Uyum)

- Aday detay sayfasındaki (`CandidateDetail.tsx`) 4 adet pastel renkli statik kutu kaldırıldı.
- Yerine, eski NMU projesindeki mockup'a tamamen sadık kalınarak:
  - **Açıklama Metni:** *"Adayınıza bir açıklama eşliğinde WhatsApp ya da SMS üzerinden sunum linkini gönderebilirsiniz. Bu link açıldığında adayınız güncel sunumu izleyebilir ve inceleyebilir."*
  - **SMS İle Gönder** (MessageSquare ikonlu, sky-600 mavi buton) eklendi.
  - **WhatsApp İle Gönder** (WhatsAppIcon ikonlu, bg-[#25D366] yeşil buton) eklendi.
  - Her iki buton da adaya özel olarak hazırlanan şablon metni kopyalar, ardından ilgili platformu açar.
  - İnternet bağlantısı çekmeme ihtimaline karşı **SMS İle Gönder** tam işlevsel çalışır hale getirildi.
  - Adayın kayıtlı telefonu yoksa butonlar devre dışı bırakılır ve **"DİKKAT: Hazır mesajı gönderebilmek için bu adaya ait telefon numarasını Düzenle bölümünden ekleyin!"** uyarısı amber renginde bir kutu içinde gösterilir.

---

## 2026-05-24 — Walkthrough Önerileri + Sunum Materyalleri

### feat: İtirazlara Cevap — Favori Sabitleme + Kopyala Butonu

- Yıldız ikonu ile itirazlar favorilere sabitlenebilir (`localStorage`)
- "Favoriler" kategori filtresi eklendi, aktif favori sayısı chip'te görünür
- Açık kart içinde "Cevabı Kopyala" butonu → clipboard + toast + 2sn onay animasyonu
- Hero kutusunda favori sayacı göstergesi

### feat: Vaktin Varsa — Okundu İşareti + İlerleme Sayacı

- Her konunun sağında daire/check ikonu ile "Okundu" işaretleme (`localStorage`)
- Okundu konular: üstü çizili başlık, soluk emoji, yeşil "Okundu" rozeti
- Hero kutusunda `X/11 okundu` ilerleme sayacı (emerald renk)
- Tüm durum sıfır backend maliyetiyle localStorage'da

### feat: BottomNav — İtirazlara Cevap eklendi (5 item)

- Takvim çıkartıldı, yerine İtirazlara Cevap (`/itirazlar`) eklendi
- Sahada en pratik sayfa artık mobil çubuğunda
- `DashboardShell` `NAV_ROUTES`'a `/itirazlar` eklendi — swipe ile geçiş çalışıyor

### feat: Kişi Detay Sayfası — Sunum Materyalleri bölümü

- Her adayın şahsi sayfasında "Sunum Materyalleri" bölümü eklendi
- 2x2 grid: Video Tanıtım, Ürün Kataloğu, Kazanç Planı, Başarı Hikayeleri
- Her materyal renkli pastel kart + external link ikonu
- Linkler şimdilik `#` — ileride profil ayarlarından özelleştirilebilir

### feat: PWA Manifest

- `public/manifest.json` oluşturuldu: standalone mod, NMM tema (#534AB7), 3 shortcut
- `layout.tsx` metadata: `manifest`, `appleWebApp`, `theme-color` eklendi
- "Ana Ekrana Ekle" ile native uygulama deneyimi

---



### fix: TakvimClient `toKey()` UTC → yerel saat dilimi

**Sorun:** `toKey(d)` içinde `d.toISOString().slice(0, 10)` kullanılıyordu. `toISOString()` tarihi UTC'ye çevirir; Türkiye +03:00 offset'inde gece 00:00–02:59 arası tıklamada tarih bir gün geri kayıyordu. Takvim grid tıklaması doğru aday gösterirken "Önümüzdeki 7 Gün" bölümü bir gün ileriden başlıyordu.

**Çözüm:** `getFullYear() / getMonth() / getDate()` ile yerel bileşenlerden `YYYY-MM-DD` üretildi. Tüm `toKey()` çağrıları tek fonksiyon üzerinden geçtiğinden tek satır değişiklik tüm takvimi düzeltti.

---

## 2026-05-24 — Pano Genişletme & Ekibim Fix


### feat: Pano 6 → 8 kare, grid 2×4

- Pano grid düzenlemesi: `grid-cols-2 md:grid-cols-3` → `grid-cols-2 md:grid-cols-4`
- Yeni 6. kare: **İtirazlara Cevap** (`/itirazlar`) — rose renk, `MessageCircleQuestion` ikonu
- Yeni 7. kare: **Vaktin Varsa** (`/egitim`) — indigo renk, `BookOpen` ikonu
- Kazanımlar kutusu 6. sıradan 8. sıraya taşındı
- Skeleton loader 6 → 8 eleman olarak güncellendi
- `SquareButton`'a dark mode desteği tüm mevcut renklere eklendi
- İki yeni pastel renk varyantı eklendi: `rose` ve `indigo` (light+dark tam destekli)

### feat: /itirazlar — İtirazlara Cevap sayfası

- 20 sahada karşılaşılan itiraz, 6 kategori
- Kategori filtresi (yatay kaydırılabilir chip'ler)
- Gerçek zamanlı arama kutusu (soru + cevap içinde arar)
- Açılır accordion — her itiraz kart, tıklanınca cevabı açar
- Light/dark mode tam destekli, rose renk paleti

### feat: /egitim — Vaktin Varsa sayfası

- 4 kategori, 11 konu (Zihniyet, İletişim, Ekip, Strateji)
- Her konu: başlık, süre etiketi, seviye rozeti (Temel/Orta/İleri), özet, numaralı maddeler
- Accordion yapısı: tıklanınca içerik açılır
- Hero bilgi kutusu + toplam konu/kategori sayacı
- Light/dark mode tam destekli, indigo renk paleti

### feat: Sidebar — 2 yeni nav item

- `/itirazlar` → İtirazlara Cevap (`MessageCircleQuestion`)
- `/egitim` → Vaktin Varsa (`BookOpen`)
- Kazanımlar sona taşındı, sıralama pano ile tutarlı

### fix: EkipPanel — hata durumu ve ws=undefined güvenliği

- `useQuery`'ye `isError` yakalandı: hata durumunda boş sayfa yerine açıklayıcı hata ekranı gösterilir
- `ws?.role` → `ws.role` (ws undefined guard sonrasına taşındı, TypeScript güvenli)
- Solo lider bilgilendirme koşulu: `!isLeader` (yanlış) → `isSolo && isLeader` (doğru)
- Üye rolü bilgilendirme ayrı blok olarak `!isLeader` koşuluyla korundu

---



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
