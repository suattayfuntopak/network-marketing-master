# Hot Log

## 2026-05-24 — Council Triad Analizi: Kapsamlı Proje Güvenlik ve Kalite Denetimi

### analysis: 4 Council Üyesi ile Cerrah Titizliğinde Proje Analizi
- Socrates (güvenlik/mimari), Torvalds (mühendislik kalitesi), Ada (veri/tip sistemi), Feynman (UX/performans) perspektiflerinden eş zamanlı analiz yapıldı.
- **Toplam 19 bulgu** kritikliğe göre sınıflandırıldı.

### verify: Next.js 16 Proxy Konvansiyonu Doğrulandı
- Council analizi `src/proxy.ts` dosyasının çalışmadığını öngörmüştü — bu **yanlış alarmdı**.
- Next.js 16, Middleware'i `Proxy` olarak yeniden adlandırdı. Dokümanlar: *"Starting with Next.js 16, Middleware is now called Proxy."*
- `src/proxy.ts` + `export async function proxy(request: NextRequest)` kombinasyonu **tamamen doğru** — Next.js kaynak kodu (`middleware.js` template) `page === '/src/proxy'` kontrolüyle bu dosyayı tanıdığı teyit edildi.
- `PROXY_FILENAME = 'proxy'` ve `PROXY_LOCATION_REGEXP = '(?:src/)?proxy'` sabitler Next.js 16 `constants.js`'de mevcuttur. Auth guard aktif ve çalışıyor.

### findings: Gerçek Kritik Bulgular (Düzeltme Gerektirenler)
Gerçekten düzeltilmesi gereken bulgular (öncelik sırasıyla):
1. `/api/translate-note` — auth kontrolü yok, Anthropic kredi riski (🔴)
2. `src/lib/aiUsage.ts` — AI limiti localStorage'da, bypass edilebilir (🔴)
3. `useWorkspace` queryFn içinde DB insert — React Query retry riski (🔴)
4. `useCandidates.ts:79` — `getSession()` yerine `getUser()` kullanılmalı (🟠)
5. `EkipPanel` join/leave — atomik olmayan multi-table write (🟠)
6. `generateCoachMessage` — ownership kontrolü eksik (🟠)
7. Swipe bug — `/pipeline/[id]` detail sayfasında `startsWith` yanlış match ediyor (🟠)
8. `updated_at` — DB trigger varlığı belirsiz (🟡)
9. Canvas noise loop — saniyede 6000 gereksiz draw call (🟡)
10. `handleIndividualBroadcast` — memberId parametresi kullanılmıyor (🟡)

## 2026-05-24 — Masaüstü Header Koruma, Çift Yönlü Mobil Scroll-to-Hide ve Kazanımlar Sayfası Premium Tasarımı

### fix: Bilgisayar Sürümü Header Koruma (Statik Görünüm)
- Bilgisayar/masaüstü görünümünde kaydırma esnasında üst header'ın kaybolması ve boşluk bırakması sorunu giderildi. `md:translate-y-0` responsive Tailwind sınıfı entegre edilerek, masaüstü ekran genişliklerinde header'ın her zaman sabit, yerleşik ve statik kalması sağlandı.

### feat: Çift Yönlü (Double-Sided) Mobil Scroll-to-Hide & Otomatik Geri Çağırma
- Mobilde gezinme konforunu zirveye taşımak için **Çift Yönlü Kaydır-Gizle** yapısı entegre edildi:
  - Kullanıcı **aşağı veya yukarı fark etmeksizin** aktif olarak sayfayı kaydırdığı (browsing/scroll yaptığı) anda, header ve bottom-nav anında pürüzsüzce ekran dışına kayarak içeriğe %100 dikey alan açar.
  - Kullanıcı **parmağını çektiği/durduğu (scroll durduğu)** anda, sistem milisaniyeler içinde hareketsizliği algılar ve menüleri `400ms` içinde yumuşakça ekran içerisine geri getirir. Sayfanın en üstünde (`scrollY < 20`) ise menüler her zaman görünür kalır.

### feat: Kazanımlar Sayfası A'dan Z'ye Premium Yenileme
- "Kazanımlar" (`kazanimlar/page.tsx`) sayfası tamamen modern ve fonksiyonel bir yapıya kavuşturuldu:
  - **3 Kolonlu İnteraktif Analitik Paneli:** Toplam conversion sayısı, bu takvim ayı içindeki yeni kazanımlar (momentum ivmesi) ve en son katılan adayı kutlayan asil amber, indigo ve emerald kart grupları eklendi.
  - **Liderlik Rozet Unvanı:** Ekibe katılan aday sayısına göre dinamik olarak hesaplanan oyunlaştırılmış rütbeler (Yeni Kaşif, Ekip Kurucu, Grup Lideri ve parıldayan altın neon efektli Master İnşaatçı) ve motive edici liderlik ipuçları yerleştirildi.
  - **Doğrudan Profil Yönlendirme:** Kazanım listesindeki üye kartları Next.js `Link` ile sarmalandı. Tıklanıldığında pürüzsüzce ilgili adayın `/pipeline/[id]` detay sayfasına gitmesi sağlandı.
  - **Bulut Fotoğraf Entegrasyonu:** `parseNote` not ayrıştırıcısı kullanılarak, adayların bulut veri tabanına yüklenmiş profil fotoğrafları otomatik okundu ve listede profil görseli olarak gösterildi (bulut resmi yoksa isim baş harfi şeklinde soft degrade fallback uygulandı).
  - **Anlık WhatsApp Hoş Geldin Kısayolu:** Telefonu olan ekip üyelerinin yanına WhatsApp mesaj butonu eklendi. Tıklandığı anda çift dilli pre-filled hoş geldin şablonuyla WhatsApp sohbetini açarak liderin ekibe yeni katılan kişiyle saniyeler içinde iletişime geçmesini sağlar.

## 2026-05-24 — Akışkan Kaydır-Gizle (Scroll-to-Hide) Mobil Gezinme Deneyimi

### feat: Akışkan Kaydır-Gizle (Scroll-to-Hide) Mobil Menü ve Üst Header
- Mobil cihazlarda ekran alanını maksimuma çıkarmak ve pürüzsüz bir okuma/gezinme deneyimi sunmak amacıyla **Scroll-to-Hide (Kaydırınca Gizlenen)** akışkan gezinti çubuğu yapısı kuruldu.
- **Performans & GPU Hızlandırma:** Layout kaydırma animasyonlarında CPU/Reflow yükü oluşturan border/spacing animasyonları yerine tamamen GPU-accelerated fırça hızı sunan `transition-transform duration-300 ease-in-out` ve Tailwind `transform translate-y` kullanıldı. Bu sayede 60fps/120fps mobil tarayıcılarda ultra akıcı kayma hissi elde edildi.
- **Akıllı Arama Algılaması:** Mobil cihazlarda arama çubuğu açıldığında veya aktif olarak kullanılırken, sayfa arkada kaysa bile header'ın kaybolması engellendi. Bu sayede arama input odağı ve klavye etkileşimi kusursuz şekilde korundu.
- **iOS Elastik Scroll Desteği:** iOS cihazlarındaki bounce (esneme) hareketlerinin getirdiği eksi `window.scrollY` değerleri sıfıra caplenerek herhangi bir titreme veya zıplama sorunu yaşanması engellendi.

## 2026-05-24 — Logo Yönlendirmesi ve Not Çeviri Döngü Hata Çözümü

### feat: Ekip Davet Kodu Telegram Tarzı Spoiler Gizleme
- Ekibim sayfasındaki davet kodunu (`inviteCode`) korumak ve premium bir his katmak amacıyla Telegram tarzı bir **Spoiler Gizleme** bileşeni (`SpoilerCode`) geliştirildi.
- Kod varsayılan olarak hareketli, parıldayan mavi/cyan yıldız pikselleriyle kaplı gece gökyüzü animasyonuyla (HTML5 Canvas tabanlı) gizleniyor.
- Kullanıcı üzerine tıkladığında bulut dağılımı/çözünme animasyonuyla kod açığa çıkıyor. Sayfadan ayrılıp tekrar girildiğinde ise otomatik olarak yeniden kilitleniyor.

### feat: Vaktin Varsa (Eğitim) Sayfası Arama ve Kategori Sekmeleri Yenilenmesi
- Vaktin Varsa (`egitim/page.tsx`) sayfası, "İtirazlara Cevaplar" arayüzü ile birebir aynı modern yapıya kavuşturuldu:
  - Üstte toplam konu, kategori ve tamamlanan okuma sayılarını içeren **Hero bilgi kartı** konumlandırıldı.
  - Sayfa boyunca uzanan, başlık, özet veya içerik maddelerinde kelime bazlı arama yapabilen **tam ekran Arama Barı** eklendi.
  - Yatay kaydırılabilir **kategori sekmeleri** (Tümü, Favoriler ve 8 farklı eğitim kategorisi) eklendi.
  - Eğitim konuları, "İtirazlara Cevaplar" kartlarıyla birebir aynı; favorilere ekleme, okundu/okunmadı işaretleme, içerik kopyalama ve WhatsApp/SMS paylaşım butonları içeren **açılır kapanır premium kartlar** haline getirildi.
  - Sayfalama (Pagination, her sayfada 10 konu olacak şekilde) entegre edildi.

### feat: YZ Mesajı Üret Aday Bilgisi Otomatik Doldurma
- YZ Mesajı Üret sayfasında (`YazarForm.tsx`) bir aday arandığında veya seçildiğinde (ayrıca aday profilinden bu sayfaya yönlenildiğinde), adayın adı, aşaması ve güncel notları **"Ek Bilgi"** kutusuna otomatik olarak `Aday: Adı, Aşama: Durumu, Notlar: Notu` formatında pre-populate edilecek şekilde güncellendi.
- Ek bilgi textarea kutusu controlled component (`context` state) haline getirildi ve boyutu 4 satıra, maksimum karakter sınırı 1500'e çıkarılarak kullanıcının otomatik gelen bilgilerin altına kendi özel notlarını da ekleyebilmesi sağlandı.

### fix: Mobil Alt Menü "İtirazlar" Kelime Güncellemesi
- Mobil bottom navigation menüsünde (`BottomNav.tsx`) daha önce `"İtirazlara Cevaplar"` olarak görünen uzun etiket, mobil ekran tasarım kalitesi ve okunabilirlik açısından yalnızca mobil görünümde **`"İtirazlar"`** / **`"Objections"`** olarak kısaltıldı. Bilgisayar/masaüstü yan menüsü (`Sidebar.tsx`) ise eskisi gibi tam haliyle korundu.

### fix: Ekibim Alıcı Grubu Metin Güncellemesi
- Ekibim sayfasında alt kısımda yer alan alıcı seçimi butonlarındaki `"Tüm Ekip (WhatsApp Grubu)"` / `"Whole Team (WhatsApp Group)"` ifadeleri, her iki sekmede de (Doküman/Link ve Ekibe Mesaj) ortaklaşa güncellenecek şekilde sadeleştirilerek sırasıyla **`"Tüm Ekip"`** / **`"Whole Team"`** olarak revize edildi.

### fix: Kullanıcı Menüsü Popupları Mobil Uyumluluğu
- Kullanıcı menüsündeki **Profil**, **Ayarlar** ve **Bildirimler** modal pencereleri (`ProfileModal.tsx`, `SettingsModal.tsx`, `NotificationsModal.tsx`) mobilde kesilmeyi ve kapatma butonunun ekran dışına taşmasını önlemek amacıyla üstten 16px boşluk kalacak şekilde `top-4` hizalamasına ve maksimum `calc(100dvh - 5.5rem)` yüksekliğe kavuşturuldu.
- Tüm popuplar masaüstü görünümde eskisi gibi dikey ortalanmış (`md:top-1/2 md:-translate-y-1/2`) kalırken, mobilde tam ekran dikey kaydırma (`overflow-y-auto`) desteğiyle kusursuz ve erişilebilir hale getirildi.

### fix: Logo ve Marka İsmi Panoya/Dashboard'a Yönlendirme
- Desktop ve mobil üst header'ındaki NMM logo görseli (`/logo.png`) ile desktop'taki "Network Marketing Master" marka metni, tıklandığında panoya (`/pano`) dönülecek şekilde Next.js `<Link href="/pano">` bileşeni ile sarmalandı.

### fix: Aday Sayfası İngilizce Çeviri & Veritabanı Kısıt (Constraint) Döngü Hatası
- Aday detay sayfasında (`CandidateDetail.tsx`) dil EN olarak seçildiğinde, aday notunun otomatik İngilizceye çevrilmesi ve cache verisinin veritabanına (`update.mutate`) senkronize edilmesi esnasında oluşan `nmm_candidates_note_check` veritabanı constraint hatasından dolayı tetiklenen sonsuz hata toast bildirim döngüsü engellendi.
- Component içine `attemptedUpdates` (`useRef`) eklenerek, sayfa/veri güncellemelerinden bağımsız olarak her aday için veritabanına yazma işleminin bir render cycle'da yalnızca 1 kez tetiklenmesi güvence altına alındı.
- SQL veri tabanı şemasındaki note uzunluk kısıtını (check constraint) 500-1000 karakterden 4000 karaktere çıkaran `006_increase_note_length.sql` migrasyon dosyası oluşturuldu.

## 2026-05-24 — Mobil Uyum (Responsive) ve Fotoğraf Yükleme Hata Çözümleri

### fix: Aday Profil Fotoğrafı Yükleme Hatası (Supabase Storage)
- Aday profil fotoğraflarının Supabase Storage'a yükleme yolu `candidates/` yerine `avatars/candidate_` olarak güncellendi. Bu sayede kişisel profil fotoğrafları için çalışan Supabase Storage yükleme politikası (upload policy) aynen devralındı ve mobilde kaydetme esnasında alınan \"Fotoğraf kaydedilirken hata oluştu\" hatası kökten çözüldü.

### fix: Mobil Menü / BottomNav Üst Üste Binme Sorunu (Duyarlı Tasarım)
- `AddCandidateSheet.tsx`, `EditCandidateSheet.tsx`, `YZKocuSheet.tsx` ve `QuickAddModal.tsx` popup'ları mobilde `top-4` (ekranın 16px altı) konumuna sabitlendi.
- Maksimum yükseklikleri `max-h-[calc(100dvh - 5.5rem)]` olarak ayarlanarak alttaki menü barının (`BottomNav`) altında kalmaları engellendi; böylece \"Kaydet\", \"Ekle\" ve \"İptal\" butonları her zaman menünün üzerinde, tam erişilebilir ve tıklanabilir hale getirildi.

### fix: Hızlı Aday Ekleme (QuickAddModal) Ekran Kayma Sorunu
- Mobilde Zap (kıvılcım) butonuna tıklandığında açılan `QuickAddModal` popup'ındaki `.focus()` çağrısı için `{ preventScroll: true }` parametresi eklendi.
- Popup kapandığında veya eklendiğinde, sayfa bütünlüğünün bozulmaması ve header'ın altına kaymaması için pencere scroll pozisyonunun unmount clean-up aşamasında eski haline getirilmesi (`window.scrollTo`) sağlandı.

## 2026-05-24 — Claude 4.6 Model Güncellemesi ve Kalıcı Bulut Profil Fotoğrafı Depolama Altyapısı

### feat: Claude 4.6 API Yükseltmesi
- AI Mesaj üretimi ve Koç modüllerindeki model `claude-3-5-sonnet-20241022` (404 hatası veren) yerine en güncel ve kararlı **`claude-sonnet-4-6`** modeline yükseltildi.
- Aday notları gönderilmeden önce, AI bağlamının bozulmaması için otomatik olarak dil ve fotoğraf ayraçlarından (`|||`) temizlenerek gönderilmesi sağlandı.

### feat: Kalıcı Bulut Profil Fotoğrafı Altyapısı (Supabase Storage)
- Aday profil fotoğrafları tarayıcının geçici `localStorage` çerezlerinden kurtarılarak Supabase Storage bulutunda (`nmm-avatars/candidates/`) kalıcı olarak saklanacak şekilde yapılandırıldı.
- Herhangi bir veritabanı DDL değişikliği riski almadan, mevcut `note` alanı `Türkçe Not ||| İngilizce Çeviri ||| Aday Fotoğrafı Bulut URL'si` formatında kalıcı olarak saklandı.
- Tüm detay, kart ve arama arayüzleri bu bulut URL'lerini anlık okuyacak şekilde güncellendi.
- **Yeni Aday Ekle** formuna profil fotoğrafı ekleme ve buluta kaydetme özelliği (Düzenle modalı ile birebir uyumlu) entegre edildi.

## 2026-05-24 — Paylaşım Butonları, Sidebar Kalıcılığı, Profil Fotoğrafı, Pipeline Yenileme

### feat: İtirazlara Cevaplar — Kopyala + SMS + WhatsApp Paylaşım Butonları

- Her açılan itiraz cevabının altına 3 buton eklendi: **Cevabı Kopyala** → **SMS İle Gönder** → **WhatsApp İle Gönder**
- Sıralama tam olarak istenen sırayla uygulandı
- SMS: `sms:?body=` deep link, WhatsApp: `api.whatsapp.com/send?text=` URL encode ile

### feat: Vaktin Varsa — Kopyala + SMS + WhatsApp Paylaşım Butonları

- Her konu içeriğinin (madde listesi) altına **Kopyala** → **SMS İle Gönder** → **WhatsApp İle Gönder** butonları eklendi
- İçerik numaralı maddeler newline birleştirilmiş şekilde paylaşılıyor
- heroTitle sonuna ünlem eklendi; heroDesc `sırayla değil` olarak düzeltildi

### fix: Sidebar — Daralt Durumu Sayfa Yenilemede Korunuyor

- `DashboardShell`'deki `collapsed` state `localStorage` (`nmm_sidebar_collapsed`) ile kalıcı hale getirildi
- `useState` initializer'ı SSR güvenli `typeof window !== 'undefined'` kontrolüyle yazıldı
- Toggle butonu her tıklamada localStorage'ı güncelliyor

### feat: Profil Fotoğrafı Yükleme (EditCandidateSheet)

- Düzenle popup'ının en üstüne profil fotoğrafı modülü eklendi: avatar önizleme, kamera ikonu, Fotoğraf Yükle ve Fotoğrafı Kaldır butonları
- Fotoğraflar `FileReader` ile base64'e çevrilerek `localStorage`'da (`nmm_candidate_photo_<id>`) saklanıyor
- `CandidateCard` (liste) ve `CandidateDetail` (detay sayfası) da localStorage'dan fotoğrafı okuyup gösteriyor
- Düzenle modalı kapandığında liste ve detay sayfası fotoğrafı otomatik yeniliyor

### feat: Boru Hattı — Stat Kutuları Tıklanabilir, Renkler Değiştirildi

- **Aktif** kutusu artık yeşil (`#E1F5EE / #0F6E56`), **Sıcak** kutusu turuncu (`#FAEEDA / #854F0B`) — renkler çaprazlama değiştirildi
- Tümü, Aktif ve Sıcak kutularına tıklanınca ilgili aşama filtresi seçiliyor (stat = filter butonu)
- Seçilen kutu ring efektiyle vurgulanıyor

### feat: Boru Hattı — Tüm Aşamalar Sekme Filtresi (StageFilter)

- Sekme filtresi 4 gruptan (Tümü/Aktif/Sıcak/Kaybolanlar) → **11 aşamalı** kaydırılabilir pill listesine dönüştürüldü
- Sıralama: Tümü → Yeni Aday → İletişime Geçildi → Davet Edildi → Sunum Yapıldı → Takipte → Kararsız → Katıldı → İlgilenmedi → Pasif → Kaybedildi
- `CandidateFilter` tipi tüm stage değerlerini de kapsayacak şekilde genişletildi

### feat: Aday Ekle Popup — Başlık ve Buton Güncellendi

- Başlık: `Yeni Kişi Ekle` → **`Yeni Aday Ekle`**
- Buton: `Kişi Ekle` → **`Aday Ekle`**

### feat: Ekibim Sayfası — Metin ve Yapı Güncellemeleri

- `broadcastTitle`: "EKİBE TOPLU GÖNDER" → **"EKİBE GÖNDER"**
- `broadcastSubtitle`: "...motivasyon mesajını..." → kısaltıldı
- `broadcastTypeMotiv`: "Motivasyon Mesajı" → **"Ekibe Mesaj"**
- **Mesaj Önizleme** accordion kutusu kaldırıldı (hem Doküman/Link hem Ekibe Mesaj sekmesinden)

### feat: Aşama İsimleri ve Pasif Aşaması

- `davetli` etiketi: "Toplantıya Davet Edildi" → **"Davet Edildi"** (sistem genelinde)
- `kayboldu` etiketi: "Kayboldu" → **"Kaybedildi"** (sistem genelinde)
- **`pasif`** yeni aşaması eklendi: `CandidateStage` tipi, `stages.ts` STAGE_LABEL/THEME/ORDER, `useDailyActions` STAGE_PRIORITY, TR/EN çeviriler güncellendi

---



### feat: İtirazlara Cevaplar — 34 Madde, Çift Dil, Okundu Takibi, Sayfalama

- 20 mevcut itiraz → 34'e çıkarıldı (NMU seed'lerinden 14 yeni madde: id 21-34)
- Tüm maddeler tam çift dilli (TR/EN): `kategori`, `soru`, `cevap` field'ları
- `nmm_itiraz_read` localStorage ile okundu takibi; header'da `X/34 okundu` sayacı
- Sayfalama: her sayfada 10 madde, altında numaralı sayfa butonları, sayfa değişiminde scroll-to-top
- ID'ler geriye dönük uyumlu: orijinal 20 item'ın ID'si değişmedi (`1-20`), yeniler `21-34`

### feat: Vaktin Varsa (Eğitim) — 30 Madde, 8 Kategori, NMU Seed'leri

- 11 mevcut içerik → 30'a çıkarıldı (NMU akademi seed'lerinden 19 yeni madde)
- Kategoriler: Zihniyet & Temel, İletişim & Takip, Davet & Aday Bulma (yeni), Sunum & Kapanış (yeni), Ekip & Liderlik, Strateji & Büyüme, Uyum & Etik (yeni), Ürün & Şirket (yeni)
- Her madde tam TR ve EN bullet point listeleriyle çift dilli yapıldı

### feat: Ekibim Sayfası — Panel Sıralama + Ekibe Toplu Gönder Modülü

**Yeni panel sırası:**
1. Ekip Performans Paneli (istatistik + üye listesi) — en üste taşındı
2. Ekip Arkadaşı Davet Et (lider için)
3. Bir Liderin Ekibine Katıl (solo lider / üye için)
4. Ekibe Toplu Gönder (yeni modül) — en alta eklendi

**Ekibe Toplu Gönder modülü:**
- İki içerik türü toggle: **Doküman / Link** (URL + ek not) | **Motivasyon Mesajı** (textarea)
- Mesaj önizleme accordion'u (collapsible)
- İki alıcı modu: **Tüm Ekip (WhatsApp Grubu)** → tek "Grupla Paylaş" butonu | **Kişileri Seç** → checkbox listesi
- Kişi seçiminde: "Tümünü Seç" / "Temizle" hızlı kontrolleri, seçilen üyeler yanında bireysel WhatsApp butonu
- Tüm yeni translation key'leri `tr.ts` + `en.ts`'ye eklendi (`broadcastTitle`, `broadcastSubtitle`, `broadcastTypeDoc` vb. — 21 yeni anahtar)

### fix: CandidateDetail — Silme kartı section başlığı "Kişi Sil" / "Delete Candidate"

- Silme card'ının üst `<p>` etiketi `t('common.delete')` → `lang === 'en' ? 'Delete Candidate' : 'Kişi Sil'` olarak güncellendi
- Silme butonu metni değişmedi (hâlâ "Sil" / "Delete")

---

## 2026-05-24 — Tam i18n Geçişi, Bildirim Kalıcılığı ve Migration Düzeltmeleri

### fix: Migration 004 — "Policy Already Exists" Hatası Çözüldü

- **Sorun:** `supabase/migrations/004_member_self_update.sql` dosyası ikinci kez çalıştırıldığında `ERROR: 42710: policy "nmm_member_self_update" already exists` hatası veriyordu.
- **Çözüm:** `CREATE POLICY` satırının önüne `DROP POLICY IF EXISTS` eklendi. Artık SQL güvenle tekrar çalıştırılabilir, hata oluşmaz.

### fix: Bildirimler Yenilemede Sıfırlanıyordu — LocalStorage Kalıcılığı Eklendi

- **Sorun:** Bildirimlerin okundu olarak işaretlenmesi ya da "Tümünü Okundu Yap" ile silinmesi, sayfa yenilendiğinde kayboluyordu; bildirimler her zaman 2 okunmamış olarak geri geliyordu.
- **Çözüm:** `NotificationsModal.tsx` bileşenine iki yeni `localStorage` anahtarı eklendi:
  - `nmm_notif_read_ids` — Okundu olarak işaretlenen bildirim ID'lerini saklar.
  - `nmm_notif_dismissed_ids` — "Tümünü Okundu Yap" ile silinen bildirim ID'lerini saklar.
- **Davranış:** Sayfa yenilendiğinde `loadNotifications()` fonksiyonu bu iki seti okuyarak `DEFAULT_NOTIFICATIONS` üzerinde uygular. Okundu işaretlenenler okundu görünür; silinen bildirimler geri gelmez. Gelecekte eklenen yeni ID'li bildirimler her zaman taze olarak görünür.

### feat: Uygulama Genelinde Tam i18n (Türkçe/İngilizce) Geçişi

Hardcode Türkçe metin içeren tüm bileşenler tespit edilerek `t()` fonksiyonuna geçirildi. Aynı zamanda `tr.ts` ve `en.ts` sözlük dosyalarına 60+ yeni anahtar eklendi.

**Yeni Çeviri Anahtarları — Eklenen Bölümler:**

| Bölüm | Eklenen Anahtarlar |
|---|---|
| `pipeline` | `total`, `active`, `hot`, `aiMessage`, `call`, `noPhone`, `noWhatsApp`, `back`, `selectStage`, `changeStage`, `activityHistory`, `activityCall`, `activityNote`, `activityStageChange`, `candidateNotFound`, `backToPipeline`, `reactivate`, `reactivateTitle`, `presentationMaterials`, `presentationMaterialsDesc`, `presentationWarning`, `presentationCopied`, `presentationMessageTemplate` |
| `nav` | `todayFocus` |
| `today` *(yeni bölüm)* | `allPriorityListed`, `collapse`, `showAll`, `moreLeadsPending` |
| `training` | `allContent`, `favorites`, `noFavorites`, `noFavoritesDesc`, `addToFavorites`, `removeFromFavorites` |
| `team` | `totalCandidates`, `totalMembers`, `funnelDistribution`, `noTeamCandidates`, `inviteTeammate`, `inviteTeammateDesc`, `joinATeam`, `joinATeamDesc`, `joinBtn`, `removeFromTeam`, `performancePanel`, `loadError`, `loadErrorHint`, `soloHint`, `memberHint`, `inviteCopied`, `joinSuccess`, `joinError`, `removeSuccess`, `removeError`, `alreadyInTeam`, `invalidCode`, `removeMemberMsg`, `noSessionError`, `joined` |
| `common` | `you` |

**Güncellenen Bileşenler:**

- **`CandidateDetail.tsx`** — Tüm sabit Türkçe metinler `t()` ile değiştirildi: YZ Mesajı, Ara, WA yok, Tel yok, Sunum Materyalleri (başlık + açıklama + uyarı), SMS/WhatsApp gönder butonları, Aktivite Geçmişi etiketleri, Aşama Seç picker, Geri/Düzenle/Sil etiketleri, sunum mesajı şablonu. `daysSince()` fonksiyonu artık `t()` alıyor (dil-bağımlı çıktı için).
- **`CandidateCard.tsx`** — `daysSince()` `t()` ile çalışıyor; aşama etiketi `t('stages.*')` kullanıyor; "Yeniden Aktif Et" ve "Aşama Seç" çevrildi.
- **`pipeline/page.tsx`** — Toplam/Aktif/Sıcak istatistik etiketleri çevrildi.
- **`PanoContent.tsx`** — "Bugün İlgilen" hızlı erişim karesi `t('nav.todayFocus')` kullanıyor.
- **`IlgilenContent.tsx`** — "Tümünü Gör" / "Kapat" / "+N kişi daha bekliyor" `lang ===` ternary'leri `t('today.*')` anahtarlarıyla değiştirildi.
- **`EkipPanel.tsx`** — `useTranslation` eklendi; tüm JSX etiketleri, toast mesajları ve hata metinleri `t()` kullanıyor. Ekip üyesi rolü, huni dağılım etiketleri (Yeni/Sunum/Takip/Katıldı), davet/katıl kartları, performans paneli başlığı, ipucu metinleri tamamen çevrildi.
- **`egitim/page.tsx`** — "Tüm İçerik" / "Favoriler" sekmeleri, "Henüz Favori Yok" boş durum mesajı ve yıldız tooltip'leri çevrildi.

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
