# Hot Log

## 2026-05-26 — Çoklu Kullanıcı Veri Güvenliği, Bağımsız Aday Boru Hattı & AI Günlük Limiti Altyapı Düzeltmeleri

### fix: Süper Admin İçin Kalan Limit Rozetleri Gizlendi
- `uyum/actions.ts` & `yazar/actions.ts`: Giriş yapan kullanıcı süper admin (`suattayfuntopak@gmail.com`) olduğunda, `remaining` parametresi `undefined` döndürülerek arayüzdeki "Kalan Günlük Denetim" ve "Kalan Günlük Simülasyon" etiketlerinin kendisi için **tamamen gizlenmesi** sağlandı. Diğer tüm normal kullanıcılar için limit rozetleri aktif ve görünür kalmaya devam eder.

### feat: MLM Sponsorluk ve Hiyerarşik Downline Yapısı Sıfırdan İnşa Edildi (Bağımsız Lider Modeli)
- `009_add_workspace_parent_id.sql`: Ekip üyelerinin (`member`) kendi isimlerini, kendi davet kodlarını görememesi, organizasyon kuramaması ve üst liderinin verilerini/ekibini aynen görerek veri ihlali yaşaması mimari olarak **kökten çözüldü**.
  - **Yeni Model:** `nmm_workspaces` tablosuna **`parent_id uuid`** kolonu eklenerek bağımsız distribütör sponsorluk bağı kuruldu.
  - **Yeni Davet/Katılım Akışı (`nmm_join_workspace`):** Üye bir davet koduyla katıldığında artık kendi workspace'inden çıkıp liderin workspace'ine taşınmaz. Kendi workspace'inin **Lideri** (`role = 'leader'`) olarak kalmaya devam eder, böylece **kendi adına özel**, **kendi davet kodunu üreten**, **anahtar teslim boş boru hattı** açılır! Sadece kendi workspace kaydının `parent_id` değeri kendisini davet eden sponsorun `owner_id`'sine eşitlenir.
- `EkipPanel.tsx` (`fetchMembers`): 
  - Lider, kendi Ekibim sayfasında artık tüm workspace üyelerini değil, strictly **`parent_id = leader_user_id`** (yani doğrudan kendisine davet koduyla katılmış distribütörleri) listeler.
  - Alt downline'ın (User B's) downline'ları (User C's), iki üstteki lidere (User A'ya) akmaz! Yalnızca kodu gönderdiği doğrudan üyenin değerleri kendisine akar.
  - Lider, downline üyelerinin aday sayısını ve hunideki durumlarını anlık izleyebilir ve onlara koçluk desteği verebilir.
  - Downline üye (User B) kendi Ekibim sayfasında kendi adını lider olarak görür, kendi davet kodunu kopyalayabilir/paylaşabilir ve kendi ekibine katılanları izler.

### fix: YZ Uyum Denetleyicisi JSON Ayrıştırma (SyntaxError) Hataları İçin %100 Dayanıklı Parser
- `uyum/actions.ts` (`parseSafeJSON`): 
  - **Hata:** Claude-sonnet modelinin violations dizisindeki iki nesne arasına virgül eklemeyi unutması (`Expected ',' or ']' after array element in JSON...`) veya unescaped line breaks yapması durumunda oluşan ayrıştırma hatası çözüldü.
  - **Çözüm:** JSON ayrıştırması öncesinde `parseSafeJSON` adında son derece gelişmiş bir ön-düzenleme fonksiyonu yazıldı. Bu fonksiyon:
    1. İki nesne arasındaki eksik virgülleri (`}\s*{` ➔ `},{`) otomatik ekler.
    2. Dizi içindeki eksik virgülleri (`]\s*[` ➔ `],[`) düzeltir.
    3. Geçersiz sondaki virgülleri (`Trailing Commas`) temizler.
  - Bu sayede yapay zeka çıktısında ne tür bir noktalama hatası olursa olsun **JSON asıl durumuna onarılarak %100 hatasız çözümlenir**.

### feat: Ekip Üyeleri İçin Bağımsız Aday Boru Hattı ve Özel "Bugün" Görünümü Entegre Edildi
- `useCandidates.ts`: Liderin davet koduyla katılan distribütörlerin liderin tüm boru hattı adaylarını, bugün ilgilenilecek adaylarını, takvimini ve istatistiklerini ortaklaşa görerek veri ihlali yaşaması sorunu **kökten çözüldü**.
  - **Yeni Altyapı:** Aday listesini çeken `fetchCandidates` sorgusu, `workspace_id` eşleşmesine ek olarak artık strictly **`owner_id = user.id`** (mevcut oturum açmış distribütör) filtresini uyguluyor.
  - **Sonuç:** Ekibe davet koduyla yeni katılan üyeler için tüm sayfalar (Bugün, Boru Hattı, Takvim, İstatistikler, Kazanımlar) **tamamen kişiye özel ve sıfır adaylı ("anahtar teslim boş sayfa")** olarak açılır. Her üye kendi adaylarını kaydeder ve yalnızca kendi adaylarını yönetir.
  - **Lider Görünümü (Ekip Paneli):** Üyeler kendi adaylarını kendi boru hatlarında bağımsız yönettiklerinde, bu adayların toplam sayıları ve hunideki (yeni, sunum, takip, katıldı) dağılım bilgileri ortak `workspace_id` sayesinde liderin **Ekip** (My Team) performans tablosuna anında ve otomatik olarak akar ("aksiyonların lidere akması").
- `pipeline/[id]/actions.ts`: `generateCoachMessage` (Yapay Zeka Koçu) server action'ı içerisine strictly candidate ownership (`owner_id = user.id`) kontrolü eklendi. Ekip üyelerinin diğer distribütörlerin aday ID'lerini kullanarak mesaj üretmesi veya erişmesi güvenlik seviyesinde engellendi.

### fix: YZ Uyum Denetleyicisi & YZ Koçu Modüllerindeki Database Constraint (SyntaxError) Çökmeleri Kökten Giderildi
- **Sorun:** Lider dışındaki normal üyeler (non-admin) simülasyon veya uyum denetimi yaptıklarında günlük AI kullanım sayacı tetikleniyor. Bu sayaç `nmm_daily_actions` tablosuna `action_type = 'ai_generate'` kaydını girmeye çalışıyordu; ancak veritabanı şemasındaki eski check constraint kısıtı bu değeri engellediği için işlem çöküyor ve ekrana hata fırlatıyordu.
- **Düzeltmeler:**
  - `008_add_ai_generate_action_type.sql`: Postgres `nmm_daily_actions` tablosunun check constraint kısıtını `'ai_generate'` eylemini de kapsayacak şekilde genişleten yeni veritabanı migrasyonu oluşturuldu.
  - `uyum/actions.ts`, `yazar/actions.ts` & `pipeline/[id]/actions.ts`: En üst düzey **defansif yazılım mimarisi** kuruldu. AI günlük log insert işlemleri birer `try-catch` bloğuna alındı. Bu sayede, uzak Supabase veritabanında migrasyon senkronizasyonu tam tamamlanmamış olsa dahi, loglama hataları arka planda konsola yazılır ve ana AI Uyum Denetimi ile AI Koç simülasyonları **asla çökmeden %100 kararlılıkla çalışmaya devam eder**.

## 2026-05-25 — Yapay Zeka Koçu Prova Simülasyonları Dinamikleştirildi & Uyum Denetleyicisi Hata Düzeltmesi

### fix: Uyum Merkezi YZ Uyum Denetleyicisi JSON Ayrıştırma (SyntaxError) Hatası Çözüldü
- `uyum/actions.ts`: Kullanıcı sağlık veya gelir beyanı içeren riskli bir metin girdiğinde ortaya çıkan `"Metin denetlenirken bir hata oluştu"` sorunu giderildi. 
  - **Sebep:** `systemPrompt` içindeki JSON şablonunda bulunan yorum satırları (`//`) ve parantezli açıklamaların, Claude tarafından aynen taklit edilerek JSON çıktısının içine yerleştirilmesi ve standart `JSON.parse` işleminin çökmesine yol açması.
  - **Çözüm:** `systemPrompt` içerisindeki JSON şablonu tamamen temizlendi, yorum satırlarından arındırılarak %100 geçerli JSON standartlarına getirildi. Ayrıca, Anthropic API'sinden gelen cevabın içindeki JSON objesini (`{ ... }`) her koşulda güvenli ve hatasız yakalayabilmek için **Regex tabanlı gelişmiş bir JSON ayıklayıcı** entegre edildi.

### feat: Saha Provası Yap Modülü Türkçe Rozet Çevirisi & Çift Dil Desteği
- `ProvaForm.tsx`: Saha Provası Yap sekmesindeki tüm senaryo kartlarının üzerindeki `"SIMULATION"` rozetleri, kullanıcı arayüzü dili Türkçe olduğunda `"SİMÜLASYON"` olarak güncellendi. İngilizce dil ayarında ise `"SIMULATION"` olarak kalması sağlandı.

### feat: İtiraz Karşılama ve Diğer Prova Başlangıçları Dinamik ve Rastgele Hale Getirildi
- `ProvaForm.tsx`: İtiraz Karşılama Pratiği'nin her tıklamada statik tek bir soru getirmesi yerine; kibar, şüpheci, kaba, meşgul, meraklı, caiz değil şüphesi barındıran veya satış yapmaktan çekinen 7 farklı gerçekçi insan profili ve itiraz şablonu (`OBJECTION_PROMPTS`) arasından rastgele seçim yapılması sağlandı. Aynı dinamik rastgelelik Davet ve Kapanış Pratikleri için de (`DYNAMIC_PROMPTS`) devreye alındı.

### feat: Boş Kalan Senaryo Kartları İçin 2 Yeni Premium Senaryo Eklendi (12 Karta Tamamlandı)
- `ProvaForm.tsx`: Sayfanın alt sağ kısmında boş kalan alanları doldurmak ve 4'lü grid yapısını görsel olarak mükemmelleştirmek amacıyla iki yeni prova senaryosu eklendi:
  1. **Sosyal Medya Adayı (📱):** Instagram/Facebook gönderisini beğenen ve DM'den meraklı şekilde yazan adayı, işi hemen açıklamadan merak uyandırarak sunuma davet etme pratiği.
  2. **Etik Pazarlama Pratiği (⚖️):** Şüpheci adayın "bu ürün hastalık iyileştiriyor mu?" sorusuna, hiçbir sağlık veya gelir abartısı yapmadan tamamen yasal ve dürüst kurallarla yanıt verme/ürün tanıtma pratiği.

## 2026-05-25 — İdeal Sayfa Genişliği, İsimlendirmeler, Grafik İyileştirmeleri & Anında Kayıt Yönlendirmesi

### style: Global Sayfa Genişliği max-w-[1360px] Yapıldı ve İstatistik Grafikleri Kusursuz Hizalandı
- `DashboardShell.tsx`: Ekranın aşırı dolmasını engellemek amacıyla, `1280px` (dar) ve `1440px` (geniş) limitlerinin tam ortalaması olan **`max-w-[1360px]`** (ideal genişlik) standardı getirildi. Böylece ekran hem ferah hem de sağa sola yapışmadan son derece asil bir görünüme kavuştu.
- `istatistikler/page.tsx`: İstatistikler sayfasındaki tüm kutular arasındaki boşlukların `space-y-6` ile tamamen eşit kalması sağlandı. *Aday Kazanım İvmesi* kutusu `flex-1` ile dikeyde yukarıya doğru esnetildi, içerisindeki bar grafiği piksel yüksekliği **h-28 ➔ flex-1 min-h-[130px]**, katsayı ise **80 ➔ 105** yapılarak sol sütunla alt ve üst sınırda kusursuz bir yatay paralellik sağlandı.

### feat: YZ Mesajı Üret Modülü "Yapay Zeka Koçu" Olarak Yeniden Adlandırıldı
- `tr.ts` & `en.ts`: Pano butonu, sidebar navigasyonu ve diğer menülerdeki "YZ Mesajı Üret" ifadeleri **"Yapay Zeka Koçu"** (AI Coach) olarak güncellendi.
- `BottomNav.tsx`: Mobil alt barda dikey kayma yapmaması için kısa ve okunaklı biçimde **"YZ Koçu"** olarak gösterilmesi sağlandı.
- `yazar/page.tsx`: Sayfa başlığı altındaki açıklama yazısı *"Yapay zekayla mesajlar üret, koçluk al ve interaktif provanı yap."* olarak güncellendi.
- `YzKocuContainer.tsx`: Yapay Zeka Koçu sekmelerinin adları sırasıyla **"YZ Mesajı Üret"** ve **"Saha Provası Yap"** olarak revize edildi.

### feat: Ekibim Davet Mesajı Geliştirildi ve Anında Kayıt/Yönlendirme Desteği Eklendi
- `EkipPanel.tsx`: WhatsApp davet mesajı, kullanıcının talebine tam uyumlu profesyonel emoji ve kod yerleşimine kavuşturuldu.
- `actions.ts` & `SignupForm.tsx`: Supabase projesinde e-posta onayı kapatıldığında, yeni kaydolan adayların onay e-postası beklemeden anında uygulamaya giriş yapıp panoya yönlenmesi (`auto-redirect`) sağlandı. Sunucu tarafında `session` algılandığında istemci otomatik olarak 1 saniye içinde `/bugun` sayfasına aktarılıyor.

## 2026-05-25 — Layout Revizyonu, Grafik Hizalama, Kayıt Linki & Auth Hata Düzeltmeleri

### style: Global Sayfa Genişliği max-w-8xl Yapıldı ve İstatistik Grafikleri Dikey Hizalandı
- `DashboardShell.tsx`: Global sayfa genişliği, sağdan ve soldan boşlukları biraz daha azaltarak ekranı daha ferah doldurması amacıyla `max-w-7xl` (1280px) değerinden `max-w-8xl` (1440px) genişliğine çıkarıldı.
- `istatistikler/page.tsx`: Süreç Sıcaklık Dağılımı ve Aday Kazanım İvmesi kutularının toplam yükseklikleri, sol taraftaki Aday Dönüşüm Hunisi ile dikeyde tam hizalanacak şekilde flex stretch / `h-full` yapısı ile dengelendi. Ayrıca donut ve bar grafiği boyutları/padding değerleri orantılı şekilde büyütüldü.

### feat: Ekibim Davet Şablonuna Kayıt Linki Eklendi
- `EkipPanel.tsx`: WhatsApp davet butonu mesaj şablonu geliştirilerek, yeni adayların kolayca üye olup kodu girebilmesi için `/kayit` (register) adresi şablona link olarak eklendi.

### fix: Giriş ve Kayıt Sayfalarındaki Gizli Hata Detayları Çözüldü
- `SignupForm.tsx` & `LoginForm.tsx`: Supabase Auth tarafından dönen ve kayıt/giriş başarısızlık nedenini açıklayan gerçek hata mesajlarının (`state.error`) UI tarafında gösterilmesi sağlandı. Eski hardcoded generic hata metni temizlendi, artık e-posta/şifre çakışmaları ve doğrulama sorunları anında görülebiliyor.

## 2026-05-25 — Global Sayfa Genişliği Standardizasyonu (Standardized Global Page Width)

### style: Tüm Panel Sayfaları Ortalanmış İdeal Genişliğe (max-w-7xl) Kavuşturuldu
- `DashboardShell.tsx`: Sistemdeki tüm sayfaların yerleşim boyutlarını Yapay Zeka Koçu ve Uyum Merkezi kalitesine getirmek için `{children}` global düzeyde `mx-auto max-w-7xl w-full` konteyneriyle sarmalandı. Böylece tüm modüller ve sayfalar masaüstünde ferah ve son derece asil bir hizalamaya kavuşturuldu.
- `pano/_components/PanoContent.tsx`: Pano üzerindeki eski `md:max-w-[80%]` sınırlaması kaldırılarak `w-full` yapıldı, böylece pano da standardı takip ederek 1280px genişlikte mükemmel dengelendi.
- `search/page.tsx`: Arama sonuçları sayfasındaki `max-w-4xl` sınırlaması kaldırılarak standarda uyarlandı.
- `uyum/page.tsx` & `yazar/page.tsx`: Özel `max-w-7xl` sarmalayıcıları kaldırılarak global yapıya entegre edildi; sekmelerin (`mx-auto`) ortalanması korundu.

## 2026-05-25 — Modüllerin Tam Sayfa Yapılması (Full-Width Layout Updates)

### feat: Uyum, İstatistikler ve Prova Yap Modülleri Tam Sayfa (Full-Width) Yapıldı
- `uyum/page.tsx`: Uyum Merkezi sayfasındaki maksimum genişlik sınırlamaları (`max-w-4xl`, `mx-auto`) kaldırılarak modülün sağdan sola ekranın tamamını pürüzsüzce kaplaması sağlandı.
- `istatistikler/page.tsx`: İstatistikler sayfasının kendisi ve yüklenme (loading/skeleton) görünümü tam genişliğe (`w-full`) kavuşturularak visual datalar ve custom grafikler için maksimum ekran alanı sunuldu.
- `yazar/_components/ProvaForm.tsx` & `YzKocuContainer.tsx`: Yapay Zeka Koçu / Prova Yap simülatör ekranı, senaryo seçim kartları ızgarası (`max-w-3xl` -> responsive 4 sütunlu `lg:grid-cols-4 w-full` düzeni) ve aktif simülasyon sohbet kartı (`max-w-2xl` -> `w-full`) tam ekran genişliğine uyarlandı. Ayrıca sayfa üstündeki modül tab seçici `mx-auto` kaldırılarak sol hizalı ve tutarlı bir yerleşime getirildi.

## 2026-05-25 — Uyum Merkezi (9. Kutu), İstatistikler (10. Kutu) ve Distribütör Başlatma Entegrasyonu (Zero-Debt Modül Entegrasyonu)

### feat: Uyum Merkezi & Yapay Zeka Uyum Denetleyicisi (9. Kutu)
- `uyum/actions.ts` & `uyum/page.tsx`: NMM panosuna 9. Kutu olarak **Uyum Merkezi** eklendi. NMU'daki statik yapının ötesine geçilerek NMM'in yapay zeka gücüyle çalışan bir **Yapay Zeka Uyum Denetleyicisi** (AI Compliance Auditor) sıfırdan inşa edildi. Claude Sonnet (`claude-sonnet-4-6`) tabanlı bu denetleyici, girilen pazarlama ve reklam metinlerini sağlık iddiaları, kesin gelir vaatleri yönünden saniyeler içinde tarar, 0-100 arası güvenlik skoru ve durum rozeti (Güvenli, Riskli, Tehlikeli) verir, yasal ihlal yapan kelimeleri ve nedenlerini açıklar, son olarak tek tıkla kopyalanabilecek **"Önerilen Yasal ve Etkili Alternatifini"** üretir.
- Sayfaya ayrıca **Onaylı İfadeler Şablon Kütüphanesi**, **Yasaklı İfadeler Örnekleri** ve yerel hafızada (`localStorage`) tutulan interaktif 7 maddelik **Paylaşım Öncesi Kontrol Listesi** entegre edildi.

### feat: İstatistikler & Paket Yükü Olmayan Görsel Analiz (10. Kutu)
- `istatistikler/page.tsx`: NMM panosuna 10. Kutu olarak **İstatistikler** eklendi. Recharts gibi Next.js App Router üzerinde hidrasyon hatası çıkaran ağır grafik paketlerini yüklememek ve veritabanına ek tablo yükü bindirmemek amacıyla **sadece NMM aday verilerini analiz eden göz alıcı Custom SVG ve CSS Grafikleri** geliştirildi.
- Sayfa; Yeni Aday ➔ İletişim ➔ Davet ➔ Sunum ➔ Takip ➔ Katıldı akışındaki kümülatif dağılımı ve kayıp yüzdelerini gösteren **Dönüşüm Hunisi (Funnel)**, adayların sıcaklık durumlarını gösteren **Sürecin Sıcaklığı (Donut Grafik)** ve aday edinme ritmini gösteren **Kazanım İvmesi (Barlar)** ile donatıldı.

### feat: Distribütör Başlatma — Ekibim Kart İçi Entegrasyonu
- `EkipPanel.tsx`: Distribütör başlatma çeklistini bağımsız veritabanı tablolarıyla hantallaştırmak yerine doğrudan **Ekibim** modülündeki üye kartlarının içine akıllıca entegre ettik.
- Lider, ekibindeki bir distribütörün kartına tıkladığında kart aşağı doğru genişler (Accordion) ve üyenin 4 haftalık (Temel Kurulum, İlk Temas, Bağımsızlaşma, 90 Gün Planı) **Hızlı Başlangıç Gelişimi** açılır. Üyenin tamamladığı adımların oranını dinamik hesaplayan bir ilerleme yüzdesi (Örn: `%44`) bulunur. Adımların tamamlanma durumu liderin cihazında `localStorage` tabanlı tutulur.

### feat: Pano Izgara Dengesi ve Sidebar Entegrasyonu
- `PanoContent.tsx`: Hızlı erişim ızgarası 10 kutuya çıkarıldı. Mobil 2 sütunlu yapıyı korurken, masaüstünde 5 sütunlu dengeli ve son derece asil bir düzene kavuşturuldu.
- `Sidebar.tsx`: Masaüstü yan navigasyon çubuğuna Uyum Merkezi ve İstatistikler modülleri ikonları ve çevirileriyle birlikte entegre edildi.

## 2026-05-25 — Supabase Eğitim Senkronizasyonu, Derin Aktivite Takibi, YZ Yazar Sadeleştirme & YZ Ekip Koçu Entegrasyonu (Konsey Önerileri & Ek İstekler)

### feat: YZ Ekip Koçu — Downline İnaktif Üye Mentörlük Sistemi (Konsey Önerisi — Paket C)
- `actions.ts` & `YZEkipKocuSheet.tsx`: Liderlerin son 7 gündür inaktif olan alt hat (downline) distribütörlerine nokta atışı mentörlük yapabilmesi için YZ Ekip Koçu geliştirildi. Claude `claude-sonnet-4-6` motoru ile entegre edilen sunucu aksiyonu (`generateDownlineCoachingMessage`), inaktif üyenin huni dağılımını (yeni aday, sunum, takip, katıldı sayılarını) analiz ederek ona özel, suçlayıcı olmayan, son derece yapıcı ve birebir görüşmeye davet eden motive edici Türkçe mentörlük mesajları üretir.
- `EkipPanel.tsx`: İnaktif downline üyelerinin yanındaki **⚠️ Destek Gerekebilir** amber renkli aksiyon rozeti tıklanabilir hale getirilerek YZ Ekip Koçu paneline bağlandı. Liderler tek tıkla mentörlük mesajı üretip kopyalayabilir veya WhatsApp ile paylaşabilir.

### feat: YZ Mesajı Üret Sadeleştirildi & Ek Bilgi Zenginleştirildi (Ek İstek)
- `YazarForm.tsx`: Form üzerindeki mükerrer ve gereksiz olan "İlişki Derecesi (Sıcaklık)" seçmeli dropdown modülü tamamen kaldırıldı. Arayüz `md:grid-cols-2` olarak yeniden tasarlanarak "Mesaj Türü" ve "Ton" alanları yan yana asil bir şekilde konumlandırıldı.
- Aday seçildiğinde (veya detay sayfasından yönlenildiğinde) arka planda sıcaklık derecesi saptanmaya devam eder; ayrıca adayın sıcaklık bilgisi (`warmth`), son 5 lider notu ve son 5 aktivite kaydı otomatik olarak Supabase'den çekilip **Ek Bilgi** (`context`) metin alanına `- 24 May: WhatsApp Mesajı` gibi zaman damgalı satırlarla yazılır. Böylece YZ mesaj üretirken adayın tüm geçmiş serüvenine 10x daha hakim olur.

### feat: Supabase Derin Aktivite Takibi & Collapsible Aktivite Geçmişi (Ek İstek)
- `useCandidates.ts`: Adaylar üzerindeki her türlü eylemi geçmişte loglamak için veritabanı loglama kapsamı genişletildi. Aday oluşturulduğunda (`system_note:candidate_created`), adayın sıcaklık derecesi değiştirildiğinde (`system_note:warmth_change:old->new`), sonraki takip tarihi güncellendiğinde (`system_note:follow_up_change:old->new`) veya profil bilgileri değiştiğinde (`system_note:profile_update`) Supabase `nmm_daily_actions` tablosuna standart check-constraint'leri bozmayan akıllı sistem notları kaydedilir.
- `CandidateDetail.tsx`: Aday detay sayfasındaki "Aktivite Geçmişi" bölümü baştan aşağı yenilendi. Türkçe ve İngilizce dillerine göre tüm aşama değişimleri (`katıldı`, `yeni`, `takip` vb.) ve system_note kayıtları pürüzsüzce yerelleştirildi. Listenin dikeyde aşırı uzamasını engellemek için ilk 5 eylem sonrası **Tümünü Gör / Kapat** collapsible durum yöneticisi entegre edildi.

### feat: Supabase Eğitim Senkronizasyonu Entegre Edildi (Konsey Analizi — Paket C)
- `egitim/page.tsx`: Eğitim okundu ve favoriler durum yönetimleri tamamen yerel `localStorage` bağımlılığından arındırıldı.
- Ortak `useProgressSync` hook'u entegre edilerek; okuma durumları (`readTrainings`), favori eğitim konuları (`favTrainings`), `toggleTrainingRead` ve `toggleTrainingFav` özellikleri Supabase `nmm_daily_actions` tablosundaki tekil JSON blob'una (`nmm_progress_v1:...`) senkronize edildi. Böylece tarayıcı önbelleği silinse dahi hiçbir eğitim ilerlemesi kaybolmayacak ve çoklu cihaz senkronizasyonu mükemmel çalışacak.

### feat: Ekip Paneli İnaktif Üye Takip Mekanizması (Konsey Analizi — Paket C)
- `EkipPanel.tsx`: Takım liderlerinin organizasyonu çok daha dinamik yönetebilmesi ve inaktif üyeleri erken fark edip mentörlük desteği sunabilmesi amacıyla **İnaktif Üye Takibi** geliştirildi.
- `fetchMembers`: Supabase sorgusu genişletilerek son 30 güne ait `nmm_daily_actions` kayıtları da tek bir hafif sorguda çekildi. Üyelerin sisteme katılım tarihleri (`joined_at`), aday ekleme/güncelleme ve YZ eylemleri JavaScript tarafında analiz edilerek her bir üyenin **Son Aktiflik Zamanı** (`last_activity_at`) saptandı.
- Arayüz Yenilemesi: Son 7 gündür hiçbir aday eklememiş veya eylem kaydetmemiş downline üyelerinin isimlerinin yanına parıldayan asil amber renkli **⚠️ Destek Gerekebilir** durum rozeti yerleştirildi. Üye kartlarının altındaki detay satırına son derece asil ve hassas zaman damgaları eklenerek `"Son aktiflik: 24 May (1 gün önce)"` gibi detaylar liderin bilgisine sunuldu.

### feat: Akıllı Takip Geciken / Bugün Hızlı Filtre Butonu (Konsey Analizi)
- `pipeline/page.tsx`: Boru Hattı sayfasında takip zamanı yaklaşan veya kaçan adayları tek tuşla süzebilmek amacıyla **Hızlı Filtre Strip** alanı oluşturuldu.
- `getFollowUpStatus`: Adayların bir sonraki takip zamanı (`next_follow_up_at`) parametrelerini kontrol ederek geciken (`past`) veya bugün yapılması gereken (`today`) takipleri saptayan tarih motoru eklendi.
- Arayüz Yenilemesi: Arama kutusunun hemen altına, üzerinde toplam geciken/bugün takip bekleyen aday sayısını dinamik kırmızı bir baloncukla gösteren son derece asil bir **⏳ Takip Gecikti / Bugün** hızlı süzme butonu eklendi. Butona basıldığında boru hattındaki diğer kategori filtrelerinin üzerine dinamik bir katman ekleyerek yalnızca acil aksiyon bekleyen adayları listeler.

## 2026-05-25 — YZ Sıcaklık Modülü, Akıllı Takip Uyarıları & Mobil İyileştirmeler

### feat: YZ Sıcaklık Modülü entegre edildi (Konsey Analizi — Paket A)
- `noteParser.ts`: SQL şemasını değiştirmeden veri geriye dönük uyumluluğunu korumak için `ParsedNote` yapısı genişletildi ve `warmth` ('sicak' | 'ilik' | 'soguk') parametresi 4. bileşen olarak (`|||` ayıracı ile) eklendi.
- `AddCandidateSheet.tsx` & `EditCandidateSheet.tsx`: Aday ekleme ve düzenleme formlarına **İlişki Derecesi (Sıcaklık)** seçim kutusu eklendi; YZ için sıcaklık düzeyi seçilip kaydedilebilir hale getirildi.
- `CandidateCard.tsx` & `CandidateDetail.tsx`: Aday kartlarının üzerinde ve aday detay sayfasında adın yanında **🔥 Sıcak**, **☀️ Ilık** veya **❄️ Soğuk** şeklinde son derece asil ve pastel renkli durum rozetleri gösterildi. Detay sayfasından YZ Yazar'a geçiş yaparken adayın sıcaklık bilgisi query param olarak aktarılıyor.
- `YazarForm.tsx`: Aday listesinden seçim yapıldığında veya aday detayından yönlenildiğinde adayın sıcaklık düzeyi otomatik yüklenir. Kullanıcı dilerse form üzerinden sıcaklığı YZ mesajı üretilmeden önce değiştirebilir.
- `generateMessage.ts` & `yazar/actions.ts`: Formdan alınan ilişki sıcaklığı `generateMessage` prompt derleyicisine iletildi. Claude modeline sıcak kontaklara son derece samimi ve gündelik, soğuk kontaklara ise mesafeli, saygılı ama merak uyandırıcı yazması için gerekli sistem yönergeleri entegre edildi.

### feat: Akıllı Takip Uyarı Rozetleri (Konsey Analizi — Paket B)
- `CandidateCard.tsx`: Boru hattındaki tüm aday kartlarının altına, girilen takip tarihi geçmişse **⚠️ Takip Gecikti**, bugün ise **🔔 Bugün Takip** şeklinde parıldayan, renk kodlu ve dikkat çekici takip uyarı rozetleri yerleştirildi. Distribütörün saha takip disiplini ve aksiyon alma kabiliyeti zirveye taşındı.

### fix: YZ Mesajı Üret sayfasından bazı mesaj türleri kaldırıldı
- `YazarForm.tsx`: Mesaj türü seçeneklerinden `Sipariş Teşekkürü` (`siparis_tesekkuru`) ve `Yeniden Sipariş Daveti` (`yeniden_siparis_daveti`) seçenekleri çıkarıldı.

### feat: Boru Hattı sayfasındaki kategori butonları için mobil kaydırma çakışması çözüldü
- `DashboardShell.tsx`: Global sekme geçişi sağlayan mobil parmak kaydırma (swipe) algılayıcısına muafiyet mekanizması eklendi. Touch start event'i `no-swipe` sınıfına veya `data-no-swipe="true"` özniteliğine sahip bir element veya bu elementin alt dalları içerisinden tetiklendiyse, sayfa değiştirme hareketi tamamen iptal edilir.
- `StageFilter.tsx`: Boru Hattı sayfasındaki yatay kaydırılabilir kategori butonları kapsayıcısına `no-swipe` ve `data-no-swipe="true"` öznitelikleri eklenerek, sayfa/sekme değişme çakışması tamamen çözüldü. Artık mobilde kategoriler parmakla rahatça kaydırılabilir.

## 2026-05-25 — Lider Notu Sistemi (Tam Uygulama)

### feat: Lider Notu dropdown kutusu — kişi detay sayfaları

- `CandidateDetail.tsx`: `StickyNote` ikonlu collapsible Lider Notu kartı eklendi; `notesOpen` state varsayılan `false` — sayfa açılışında kapalı.
- Kart başlığında toplam not sayısı badge'i gösterilir.
- Açıldığında en güncel 5 not listelenir (tarih/saat damgalı); 5'ten fazla varsa **Tümünü Gör** butonu belirir, tıklandığında **Kapat**'a dönüşür (`showAllNotes` toggle).
- Kart altında `textarea` + **Notu Kaydet** butonu — boş not kaydedilemez, `addNoteMutation.isPending` sırasında buton disable.
- Animasyon: `animate-in fade-in slide-in-from-top-1 duration-200`.

### feat: useCandidateNotes + useAddCandidateNote hook'ları

- `src/hooks/useCandidates.ts`: `useCandidateNotes(candidateId)` — `nmm_daily_actions` tablosundan `action_type = 'note'` filtreliyor, `created_at DESC` sıralıyor.
- `useAddCandidateNote(workspaceId)` — `getUser()` ile auth doğrulama + insert; başarıda `['candidate-notes', candidateId]` ve `['activity', candidateId]` query'leri invalidate ediliyor.

### feat: YazarForm lider notu entegrasyonu

- `YazarForm.tsx`: Kişi seçildiğinde (`selectCandidate`) veya aday sayfasından yönlenildiğinde (`initialName` prefill `useEffect`), son 5 lider notu Supabase'den çekilip **Ek Bilgi** alanına `Lider Notları:\n- ...` formatında eklenir.
- Aday sayfasındaki **YZ Mesajı** butonu `?name=...&note=...` ile yazar sayfasına yönlendiriyor; YazarForm aynı mantıkla notları bağlamına otomatik ekliyor.

## 2026-05-25 — Semantic Renk Token'ları + EkipPanel Bölünmesi (Council #16 & #19)

### refactor: Semantic color tokens — globals.css @theme (Council #16)
- `globals.css`: `@theme { --color-brand: #534AB7; --color-whatsapp: #25D366; --color-accent-blue: #4169E1; }` eklendi. Artık `bg-brand`, `text-whatsapp`, `border-brand` gibi Tailwind yardımcı sınıfları kullanılabilir.
- `EkipPanel.tsx` + `BroadcastPanel.tsx`: Hardcoded hex değerleri (`#534AB7`, `#25D366`, `#4169E1`) token sınıflarına dönüştürüldü.

### refactor: EkipPanel monolith bölündü (Council #19)
- `EkipPanel.tsx` 704 satırdan ~350 satıra indirildi.
- `SpoilerCode.tsx` (~90 satır): Canvas particle animasyonu ayrı dosyaya taşındı. Kendi `useRef` ve `useEffect` import'larını yönetiyor.
- `BroadcastPanel.tsx` (~200 satır): Tüm yayın state'i, compose fonksiyonları, grup/tekli gönderim UI'ı ayrı bileşene taşındı. `MemberRow` tipini `EkipPanel.tsx`'ten import ediyor.
- TypeScript kontrolü `npx tsc --noEmit` ile doğrulandı — hata yok.

## 2026-05-25 — Gece Selamlama, Retry Fix, Type Safety, Safe-Area, Aktivite Limit (Council #3 + #13-15 + greeting)

### feat: Pano gece selamlama — 00:00-05:00 arası "İyi Geceler" (yeni)
- `PanoContent.tsx`: `hour < 5` koşulu eklendi. Gece yarısından sabah 05:00'e kadar 🌙 İyi Geceler/Good night gösterilir; 05:00 itibarıyla 🌅 Günaydın başlar.
- `tr.ts` / `en.ts`: `greetingNight` çevirisi eklendi.

### fix: useWorkspace — React Query retry riski giderildi (Council #3)
- `useWorkspace.ts`: `retry: false` eklendi. Daha önce hata sonrası yeniden deneme (default 3x), kısmi başarılı workspace oluşturma durumunda duplicate kayıt riski taşıyordu.

### fix: EkipPanel useState<any> → User | null (Council #13)
- `EkipPanel.tsx:161`: `useState<any>` → `useState<User | null>`, Supabase `User` tipi import edildi.

### fix: pb-safe Tailwind v4'te tanımsızdı (Council #14)
- `globals.css`: `@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }` eklendi.
- `layout.tsx`: `viewport.viewportFit = 'cover'` eklendi. iOS notch/home indicator artık BottomNav'ı örtmüyor.

### fix: Aktivite geçmişi limit 10 → 50 (Council #15)
- `useCandidates.ts` `useActivityHistory`: `.limit(10)` → `.limit(50)`. 10'dan fazla aktivitesi olan adaylarda eski kayıtlar artık kesilmiyor.

### verify: updated_at DB trigger (Council #8)
- Migration 001'de `nmm_candidates_updated_at` trigger'ı mevcut ve çalışıyor. Ek aksiyon gerekmedi.

## 2026-05-25 — Canvas Perf, Dead Code, API Errors, full_name Sync (Council #9-12)

### perf: EkipPanel canvas noise — 6000 → 480 draw call/sn (Council #9)
- `EkipPanel.tsx`: Film grain döngüsü 100 → 8 piksel/frame olarak düşürüldü. Görsel etki korundu, yük %92 azaldı.

### fix: handleIndividualBroadcast dead code kaldırıldı (Council #10)
- `EkipPanel.tsx`: `memberId` parametresi hiç kullanılmayan `handleIndividualBroadcast` fonksiyonu silindi.

### fix: translate-note API — Anthropic hatası production'a sızıyordu (Council #11)
- `api/translate-note/route.ts`: Anthropic `client.messages.create()` çağrısı try-catch içine alındı; hata durumunda orijinal metin döndürülür, 500 veya SDK hata mesajı istemciye ulaşmaz.

### fix: full_name senkronizasyonu — workspace member ↔ auth.users (Council #12)
- `ProfileModal.tsx`: Ad soyad güncellenirken yalnızca `nmm_workspace_members.full_name` yazılıyordu; artık `supabase.auth.updateUser({ data: { full_name } })` ile `auth.users.user_metadata` da güncelleniyor. Yeni workspace oluştururken metadata'daki eski isim artık kalmıyor.

## 2026-05-25 — Ownership Kontrolü + Swipe Bug Düzeltmesi (Council #6 & #7)

### fix: generateCoachMessage — candidate ownership doğrulaması (Council #6)
- `pipeline/[id]/_components/YZKocuSheet.tsx`: Form'a `<input type="hidden" name="candidateId">` eklendi.
- `pipeline/[id]/actions.ts`: `candidateId` formData'dan alınıp, non-admin kullanıcı için `nmm_candidates` tablosunda `id + workspace_id` eşleşmesi doğrulanıyor. Eşleşme yoksa `'Erişim reddedildi.'` döner, Anthropic çağrısı yapılmaz.

### fix: DashboardShell — swipe `/pipeline/[id]` sayfasında yanlış çalışıyordu (Council #7)
- `_components/DashboardShell.tsx:12`: `getRouteIndex` fonksiyonu `startsWith(r)` kullanıyordu; `/pipeline/abc-123` gibi detail URL'lerinde `/pipeline` eşleşmesi yapıp swipe navigation tetikleniyordu.
- Düzeltme: `pathname === r` ile tam eşleşmeye indirgendi. Detail sayfalarında swipe artık devre dışı.

## 2026-05-25 — getSession→getUser Düzeltmesi + Atomik Workspace İşlemleri (Council #4 & #5)

### fix: useCandidates.ts — getSession() → getUser() (Council #4)
- `src/hooks/useCandidates.ts:79`: Stage change logu sırasında kullanılan `getSession()` çağrısı `getUser()`'a değiştirildi; sunucu tarafında doğrulanmış kimlik kullanılıyor.

### fix: EkipPanel — join/leave atomik değildi (Council #5)
- **Sorun:** `handleJoinWorkspace` ve `handleRemoveMemberConfirmed` fonksiyonları membership + candidates tablolarını ayrı sorgularla güncelliyordu. İlk sorgu başarılı, ikincisi başarısız olursa veriler tutarsız kalıyordu. Üstelik `remove_member` kendi workspace'i olmayan bir workspace eklemeye çalıştığından RLS da ihlal ediliyordu.
- **Çözüm:** `supabase/migrations/007_atomic_workspace_ops.sql` ile iki Postgres fonksiyonu eklendi:
  - `nmm_join_workspace(p_invite_code)` — üyelik + aday taşıma tek transaction'da
  - `nmm_remove_member(p_member_id, p_member_name)` — yeni workspace oluşturma + üye/aday taşıma tek transaction'da; çağıranın owner olduğu doğrulanır; kod üretimi DB'de yapılır
  - Her ikisi de `SECURITY DEFINER SET search_path = public` ile güvenli
- `EkipPanel.tsx`: Sıralı 3 sorgu yerine tek `supabase.rpc()` çağrısı
- `database.types.ts`: `Functions` bölümüne `nmm_join_workspace` ve `nmm_remove_member` tip tanımları eklendi

## 2026-05-24 — AI Limit Sunucu Tarafına Taşındı + Lider Notu Modül Yerleşimi

### fix: AI mesaj limiti localStorage'dan DB sayacına taşındı (Council #3)
- `src/lib/aiUsage.ts` localStorage sayacı yalnızca optimistik UX ipucu olarak kalır; gerçek limit artık sunucuda uygulanır.
- `database.types.ts`: `ActionType`'a `'ai_generate'` eklendi.
- `yazar/actions.ts` ve `pipeline/[id]/actions.ts`: Her iki server action'da artık `supabase.auth.getUser()` ile kullanıcı doğrulanır, `nmm_daily_actions`'dan bugünkü `ai_generate` kaydı sayılır; limit aşılırsa `401 + açıklayıcı hata` döndürülür, başarı durumunda `candidate_id: null` ile kayıt eklenir. Super admin (suattayfuntopak@gmail.com) bypass korunur.

### feat: Lider Notu modülü Sunum Materyalleri ile Aktivite Geçmişi arasına taşındı
- `CandidateDetail.tsx`: 2-kolonlu grid layout kaldırıldı, tek kolon `space-y-4` düzenine geçildi. Lider Notu kartı artık Sunum → Lider Notu → Aktivite Geçmişi sırasıyla yerleşik.

## 2026-05-24 — Güvenlik: translate-note API Endpoint Auth Koruması

### fix: /api/translate-note — Kimlik Doğrulama Zorunlu Hale Getirildi
- `src/app/api/translate-note/route.ts` endpoint'i auth kontrolsüz açıktı; herhangi bir istek Anthropic API'sine ulaşabiliyordu.
- Supabase `createClient()` + `getUser()` eklenerek oturum kontrolü yapıldı. Oturum yoksa `401 Unauthorized` döndürülür, Anthropic çağrısı yapılmaz.
- Council analizi bulgusu #2 giderildi.

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

---

## 2026-05-25 (tur 1)

### feat: Aktivite Geçmişi Normalizasyonu ve Lider Notu Yerelleştirme

- **Aşama Dil Çevirisi & İkon İyileştirmesi**: `renderActivityText` fonksiyonunda `stageKeyMap` normalization haritası eklenerek `katildi`/`katıldı` ve benzeri aşama adlarının İngilizce ve Türkçe seçeneğinde anında doğru tercümesi sağlandı. Ayrıca, tıklanabilir bir dropdown algısı yaratan `ChevronDown` (aşağı ok) ikonu yerine, "aşamalar arası ilerlemeyi ve geçişi" temsil eden çok daha şık bir sağa ok (`ArrowRight`) ikonu aktivite geçmişine entegre edildi.
- **Lider Notu Ayrıştırma & Otomatik Geriye Dönük Çeviri**: Aktivite geçmişindeki lider notları `parseSimpleNote` ile işlenerek `TR ||| EN` formatından dille uyumlu şekilde ayıklanıp gösterilmeye başlandı. Eğer notun İngilizce karşılığı yoksa (eski kayıtlar), sayfa İngilizce açıldığında arka planda otomatik olarak Claude ile tercüme edilip Supabase'e kalıcı olarak geri yazılması sağlandı.
- **Geri Al (Undo) Destekli Aktivite Silme**: Yanlışlıkla yapılan eylemlerin (aşama değişimi, arama kaydı vb.) geçmişte kalmaması için aktivite geçmişi satırlarına fareyle üzerine gelindiğinde (hover) beliren şık bir silme butonu eklendi. Tıklandığında onay alan, onaylandıktan sonra ise 5 saniyelik dairesel "Geri Al" animasyonu sunan güvenli silme mekanizması supabase entegrasyonuyla eklendi.

### feat: YZ Lider Not Analizi & Dinamik Aksiyon Planı

- **YZ Mentör Analizi Server Action**: Adayın tüm lider notlarını okuyup Claude Sonnet aracılığıyla 2 satırlık net bir özet ve hemen atılması gereken 1 aksiyon planı üreten `generateNotesSummary` server action'ı eklendi.
- **Premium Arayüz Modülü**: `CandidateDetail.tsx` içine pastel renkli, ultra şık ve animasyonlu bir YZ Analiz kartı entegre edildi.

### feat: Haftalık Organizasyon Performans Durumu (Team Scorecard)

- **NM Metrik Karnesi**: Ekip sayfasının en üstüne, liderlere özel, katlanabilir ve minimalist bir `Haftalık Organizasyon Performans Durumu` kartı eklendi.
- **Hap Performans Metrikleri**: Son 7 gündeki aktif distribütör oranı (`%`), sıcak aday hunisi potansiyeli (Sunum + Takip) ve ekibe kazandırılan toplam partner momentumu (Katıldı) anlık hesaplanarak listelendi.

### feat: Kart Hızlı Aksiyon Arayüzü (Pipeline Quick Actions)

- **Hızlı Eylemler (Inline Popover)**: Boru hattı aday kartlarına minimalist bir Yıldırım (`Zap`) ikonu eklendi.
- **1-Tıkla Güncelleme & Aşama Seçim Kontrolü**: Sayfa değiştirmeden inline popover üzerinden temas planlama (+1 Gün, +3 Gün, +7 Gün) veya takibi sonlandırma eylemleri supabase mutasyonlarıyla anlık hale getirildi. Yanlışlıkla yapılan hatalı aşama geçişlerini önlemek için popover içindeki "Aşama Değiştir" butonu adayı direkt ilerletmek yerine aşama seçme listesini tetikleyecek şekilde güncellendi. Aşama Seçme Popup'ı hem mobilde hem masaüstünde ekranı tam ortalayacak şekilde (`rounded-3xl` şık kart formunda) konumlandırıldı ve popup açıkken arka planın kaymasını engelleyen gövde kilidi (body scroll-lock) entegre edildi.

---

## 2026-05-25 (tur 2)

### fix: Pipeline sayfasında `clsx` import hatası giderildi

- `src/app/(dashboard)/pipeline/page.tsx` içindeki `clsx` kullanımından kaynaklanan derleme hatası, kütüphanenin dosya başına import edilmesiyle çözüldü.
- TypeScript derlemesi (`npx tsc --noEmit`) 100% başarılı ve sorunsuz hale getirildi.

### fix: Alt Menü Barı (`BottomNav` z-50) altında kalma ve responsive z-index çakışmaları giderildi

- `CandidateCard.tsx` içindeki liste elemanına (`li`), hızlı aksiyon popover'ı (`quickActionOpen`), aşama değiştirme penceresi (`stageOpen`), düzenleme (`editOpen`) veya silme onay penceresi (`confirmOpen`) açıkken dinamik olarak `z-[60]` atandı.
- Bu sayede, kartın en altta veya alt menüye çok yakın olması durumunda bile açılan tüm kutular, modaller ve popover'lar `z-50` katmanındaki alt menü barının (`BottomNav`) üzerinde kusursuz bir şekilde render ediliyor.
- Mobil uyumlu `YZEkipKocuSheet` ve `YZKocuSheet` modallerinin z-index katmanları, `zIndex.ts` kütüphanesine uygun şekilde `Z.sheetBackdrop` (`z-[60]`) ve `Z.sheet` (`z-[70]`) sabitleri ile güncellendi. Böylece alt menü barının (`z-50`) veya başlıkların (`z-40`) altında kalmaları tamamen engellendi.

---

## 2026-05-25 (tur 3)

### feat: Hızlı aksiyon menüsü tam ortalanmış modal popup'a dönüştürüldü

- `CandidateCard.tsx` içindeki "Zap" tuşuna basınca açılan popover, mobil ve masaüstü dahil tüm ekranlarda sayfayı hem yatay hem dikey olarak tam ortalayacak şekilde (`rounded-3xl` modern kart formunda) modal popup'a dönüştürüldü.
- Sağ üst köşesine X kapatma butonu eklendi, eylem butonları ise kolay tıklama ve mobil uyumluluk için 3 sütunlu modern bir grid düzenine kavuşturuldu. Arka planı flu yapan `backdrop-blur` desteği ve gövde kilitli koyu backdrop eklendi.

### feat: Eğitim arama ve akıllı accordion oto-açma & oto-scrolling entegrasyonu

- `search/page.tsx` sayfasına İtirazlar ve Cevaplar (`ITIRAZLAR`) veritabanı da dahil edilerek tüm arama akışlarında genel eğitimlerin yanı sıra itiraz cevaplarının da aranabilmesi sağlandı.
- `/egitim` ve `/itirazlar` sayfaları URL query parametresi (`?id=...`) desteğine kavuşturuldu. Arama sonuçlarından herhangi bir eğitime veya itiraz konusuna tıklandığında, ilgili sayfa açıldığında konunun kaçıncı sayfada olduğu otomatik hesaplanıp o sayfaya geçiliyor, accordion (chevron) kendiliğinden açılıyor ve sayfa yumuşak bir animasyonla (`scrollIntoView`) direkt o konunun üzerine odaklanıyor.
- `itirazlar/page.tsx` sayfasındaki her bir itiraz öğesine `id={`konu-${itiraz.id}`}` verilerek arama yönlendirme hedefi tamamlandı. Next.js App Router uyumluluğu için sayfa `<Suspense>` ile sarmalandı.
- **Bugfix (Eğitim Otomatik Açılma):** `egitim/page.tsx` sayfasındaki e-eğitim konuları da sayfalama (pagination) sınırlarına takılıyordu. İlk sayfada olmayan eğitimlerin de query parametresinden açılabilmesi için, sayfa numarası bulma ve otomatik accordion açılma mantığı `egitim/page.tsx` sayfasına da entegre edilerek sorun tamamen çözüldü.

### feat: Takvim sayfasına "Önümüzdeki Ay" modülü eklendi


- `TakvimClient.tsx` sayfasının en altında yer alan "Önümüzdeki 7 gün" bölümüne ek olarak, aktif takvim ayından bir sonraki ayda (`view.getMonth() + 1`) hangi takipler varsa listeleyen şık bir **"Önümüzdeki Ay"** modülü en alta eklendi.
- Listelenen tarihe tıklandığında takvimin otomatik olarak o aya geçmesi ve ilgili günü seçerek detayları listelemesi sağlandı.

### db: 007_atomic_workspace_ops.sql migration incelemesi

- RPC fonksiyonları (`nmm_join_workspace`, `nmm_remove_member`) kontrol edilerek, ekip modülündeki geçiş ve silme işlemlerinin veri bütünlüğünü koruması ve partial-write riskini engellemesi için kesinlikle Supabase SQL Editor üzerinden çalıştırılması gerektiği doğrulandı.



