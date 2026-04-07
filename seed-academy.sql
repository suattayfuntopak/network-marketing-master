-- ============================================================
-- seed-academy.sql
-- 15 Sistem Akademi İçeriği — user_id = NULL (herkes görür)
-- supabase-schema-faz4.sql çalıştırıldıktan sonra çalıştır
-- ============================================================

INSERT INTO nmm_academy_content
  (user_id, type, category, level, title, summary, content, reading_time_minutes, tags, is_system, language)
VALUES

-- ── 1. MİNDSET: Reddedilmenin sırrı ─────────────────────────
(NULL, 'lesson', 'mindset', 'beginner',
 'Reddedilmenin Sırrı: "Hayır" Ne Demek?',
 'Network marketingde en büyük engel reddedilme korkusudur. Bu eğitimde "hayır"ı nasıl yeniden çerçeveleyeceğini öğreneceksin.',
 '## Reddedilmenin Sırrı: "Hayır" Ne Demek?

### Gerçek şu: "Hayır" sana değil, duruma söyleniyor

Birisi teklifini reddettiğinde, seni reddetmiyor. O anki hayatını, koşullarını, zamanını reddediyor. Bu ayrımı anlamak her şeyi değiştirir.

### İstatistik gerçeği

Başarılı distribütörler her 10 "hayır" için 1-2 "evet" alır. Bu demektir ki, 10 reddetme yaşadıysan, evet''e bu kadar yakınsın.

### "Hayır"ı nasıl oku?

- **"Şimdi değil"** → 6 ay sonra tekrar bağlan
- **"Bu şekilde değil"** → Yaklaşımını değiştir
- **"Sen değil"** → Nadiren gerçekleşir, genellikle zamanlama veya konu
- **"Asla"** → Saygıyla kabul et, ilişkiyi koru

### Pratik egzersiz

Bu hafta 5 kişiyle konuş. "Hayır" alsan bile ilişkiyi kesmeden çık. Her "hayır"dan sonra şunu sor: "Peki sana ne zaman tekrar yazabilirim?" — Kapıyı açık bırak.

### Altın kural

Reddedilme korkusu, insanlarla hiç konuşmamaktan daha az zarar verir. Hareketsizlik en büyük başarısızlıktır.',
 5,
 ARRAY['mindset', 'reddetme', 'korku', 'başlangıç'],
 true, 'tr'),

-- ── 2. PROSPECTING: Soğuk liste ──────────────────────────────
(NULL, 'lesson', 'prospecting', 'beginner',
 'Soğuk Listeyi Nasıl Oluşturursun?',
 'Kimi tanıdığını düşündüğünden çok daha fazla kişi var. Bu eğitimde aday listeni sistematik olarak oluşturmayı öğreneceksin.',
 '## Soğuk Listeyi Nasıl Oluşturursun?

### "Kimseyi tanımıyorum" en büyük yanılgı

Bir kağıt al ve şu soruları cevapla:

**İş çevren:**
- Eski iş arkadaşların kimler?
- Müşterilerin, tedarikçilerin?
- Sektördeki tanıdıkların?

**Sosyal çevren:**
- Okul arkadaşların?
- Komşuların, mahalleli?
- Spor/hobi arkadaşların?

**Aile çevren:**
- Uzak akrabalar?
- Eşinin/partnerin ailesi?

**Dijital çevren:**
- Instagram takipçilerin?
- Facebook arkadaşların?
- WhatsApp gruplarındaki isimler?

### Minimum 100 kişilik liste hedefle

Çoğu insan 20-30 isim yazar ve durur. Ama zorlasan 100 kolayca çıkar.

### Önceliklendirme matrisi

Her ismin yanına yaz:
- 🔥 Sıcak: Sana güvenir, açık fikirli
- 🌡️ Ilık: Ara sıra görüşürsünüz
- ❄️ Soğuk: Uzun süre görüşmediniz

Sıcaktan başla, soğuğa doğru ilerle.

### Kritik hata

Listeyi yazmadan önce "bu kişi hayır der" diye zihinsel eleme yapma. Bu senin kararın değil, onların kararı.',
 7,
 ARRAY['prospecting', 'liste', 'aday bulma', 'başlangıç'],
 true, 'tr'),

-- ── 3. INVITING: Davet sanatı ────────────────────────────────
(NULL, 'lesson', 'inviting', 'beginner',
 'Davet Sanatı: Tekliften Önce Merak',
 'Çoğu distribütör davet ederken direkt teklif yapar ve reddedilir. Merak yaratarak davet etmenin formülünü öğren.',
 '## Davet Sanatı: Tekliften Önce Merak

### Neden çoğu davet başarısız olur?

Çünkü davet değil, satış yapılıyor. "Harika bir fırsat var, bak" ile başlamak, karşı tarafı savunmaya geçirir.

### Merak yaratmanın 3 adımı

**Adım 1: Bağlan**
"Nasılsın?" deyip geçme. Gerçekten ilgilen. Son ne yaptıklarını sor.

**Adım 2: Merak ettir**
"Sana bir şey göstermek istiyorum, ilgin olur mu?" — Bu kadar.

**Adım 3: Düşük baskı**
"Olmayabilir de, sadece bir göz at."

### Script örnekleri

**WhatsApp:**
"Merhaba [Ad]! Uzun zamandır konuşmadık. Nasılsın?
...
Aklına seni takıyor bir şey var, ilgin olur mu bakarsan?"

**Telefon:**
"Seni aramak istedim, 5 dakikan var mı?
...
Sana bir şey göstermek istiyorum, merak eder misin?"

### Asla söyleme

- "Sana harika bir fırsat var"
- "Para kazanmak ister misin?"
- "Hayatın değişecek"

Bu cümleler otomatik "hayır" tetikler.

### Altın prensip

İnsanlar satın almayı sever, ama satılmayı sevmez. Merak yarat, bırak kendileri istesin.',
 6,
 ARRAY['davet', 'inviting', 'merak', 'script'],
 true, 'tr'),

-- ── 4. INVITING: WhatsApp scriptleri ─────────────────────────
(NULL, 'script', 'inviting', 'beginner',
 'WhatsApp İlk Mesaj Scriptleri (5 Farklı Senaryo)',
 'Farklı durumlar için hazır WhatsApp ilk mesaj scriptleri. Kopyala, kişiselleştir, gönder.',
 '## WhatsApp İlk Mesaj Scriptleri

### Senaryo 1: Uzun süredir görüşmediğin biri

"Merhaba [Ad]! Geçen gün aklıma düştün, nasılsın? Neler yapıyorsun?"

*(Karşılık verdikten sonra)*

"Güzel, sevindim. Seni aklıma getiren bir şey var aslında — ilgin olur mu göstermek istiyorum?"

---

### Senaryo 2: Eski iş arkadaşı

"Merhaba [Ad]! [Eski işyeri adı]''dan aklıma geldin. Nasıl gidiyor her şey?"

*(Karşılık sonrası)*

"Güzel. Aslında bir şey üzerinde çalışıyorum, sektörden biri olarak fikrin değerli olurdu. Bir bakabilir misin?"

---

### Senaryo 3: Ek gelir arayan tanıdık

"Merhaba [Ad]! Geçen [zaman] ek gelir aradığından bahsetmiştin. O konu hâlâ gündeminde mi?"

*(Evet ise)*

"Sana gösterebileceğim bir şey var. 10 dakikan olur mu?"

---

### Senaryo 4: Sosyal medyadan aktif biri

"Merhaba [Ad]! Instagram''daki paylaşımlarını takip ediyorum, aktif biri olduğun belli. Sana bir şey sormak istiyorum — ek gelir konusunu hiç düşündün mü?"

---

### Senaryo 5: Ürünü bilen biri

"Merhaba [Ad]! [Ürün adı] kullanıyor musun? Ben başladım, gerçekten fark hissettim. Sana da bahsetmek istedim."

*(İlgi gösterirse)*

"Hem ürün hem de ürünü paylaşarak para kazanma konusunda bir şey göstermek istiyorum — ilgin olur mu?"

---

### Altın kural

Her mesaj kişiye özel hissettirmeli. İsim yaz, ortak bir noktaya değin.',
 8,
 ARRAY['script', 'whatsapp', 'ilk mesaj', 'davet'],
 true, 'tr'),

-- ── 5. PRESENTING: Etkili sunum yapısı ───────────────────────
(NULL, 'lesson', 'presenting', 'intermediate',
 '20 Dakikada Etkili Sunum Yapısı',
 'Saatlerce konuşmak yerine 20 dakikada etki bırakmanın yapısını öğren. Dikkat, merak, karar — üç perdeli sunum.',
 '## 20 Dakikada Etkili Sunum Yapısı

### Neden kısa sunum daha etkili?

İnsanlar uzun anlatımlarda ilgilerini kaybeder. 20 dakika odaklanmış sunum, 2 saatlik dağınık sunumdan çok daha etkilidir.

### 20 dakika yapısı

**0-3 dakika: Bağlantı kur**
- Onların hayatını dinle
- Ortak bir nokta bul
- "Bugün sana neden burada olduğunu anlat" diyerek başla

**3-8 dakika: Sorun / fırsat**
- "Çoğu insan [problem] yaşıyor, sen?"
- Onun durumunu anla, anlattığını göster
- Zorlamadan ortaya koy

**8-15 dakika: Çözüm**
- Ürünü/işi anlat: Basit, somut, ikna edici
- Kendi hikayeni paylaş (hikayeyi sıkıştırma — 2 dakika)
- Sosyal kanıt: Başka örnekler

**15-18 dakika: Soru-cevap**
- "Aklına takılan bir şey var mı?" — Sorularını sorgusuz cevapla

**18-20 dakika: Yönlendir**
- "Bundan sonra ne yapmak istersin?"
- Açık uçlu sor, sıkıştırma

### Yapma listesi

❌ PowerPoint''e bağımlı olma
❌ Rakamları saydırma
❌ "Kaçırma" baskısı yapma
❌ Soru sormadan anlat-anlat',
 8,
 ARRAY['sunum', 'presenting', 'yapı', 'script'],
 true, 'tr'),

-- ── 6. CLOSING: Kapanışın 3 altın kuralı ─────────────────────
(NULL, 'lesson', 'closing', 'intermediate',
 'Kapanışın 3 Altın Kuralı',
 'Kapanış satış baskısı değil, kararı kolaylaştırmaktır. Doğal kapanış teknikleri ve ne söyleyip ne söylemeyeceğin.',
 '## Kapanışın 3 Altın Kuralı

### Kural 1: Karar sormak, baskı değil — kolaylaştırmak

Çoğu distribütör kapanış yerine baskı yapar: "Ne zaman başlıyorsun?" gibi sorular itici olur. Doğru soru:

"Bu konuşmadan sonra nasıl hissediyorsun?"

Bu soru karar verme baskısı yaratmaz ama dürüst bir cevap alırsın.

### Kural 2: Sessizliği boşa harcama

Soruyu sorduğunda bekle. Sessizliği doldurmaya çalışma. İlk konuşan kaybeder — sana düşen sormak, ona düşen cevaplamak.

### Kural 3: "Hayır" kapanış değil, bilgi

"Hayır" derse:
- "Anlıyorum. Seninle bu konuyu burada bırakalım. Başka bir şey var mıydı aklında?"
- İlişkiyi koru, kapıyı açık bırak
- 3-6 ay sonra yeniden dokunuş

### Kapanış cümleleri

✅ "Bundan sonra nasıl devam etmek istersin?"
✅ "Denemeye ne dersin, herhangi bir riski yok."
✅ "Şu an için bilgi mi, başlamak mı — hangisi daha mantıklı sana?"

❌ "Kaçırma, fiyat artacak."
❌ "Son şansın bu."
❌ "Neden hâlâ karar veremedin?"',
 6,
 ARRAY['kapanış', 'closing', 'karar', 'teknik'],
 true, 'tr'),

-- ── 7. FOLLOW-UP: 48 saat kuralı ─────────────────────────────
(NULL, 'lesson', 'follow_up', 'beginner',
 '48 Saat Kuralı: Sunum Sonrası Takip',
 'Sunumdan sonra ilk 48 saat kritiktir. Ne zaman, nasıl ve ne söyleyerek takip edeceğini öğren.',
 '## 48 Saat Kuralı: Sunum Sonrası Takip

### Neden 48 saat?

Sunum sonrası ilk 48 saat, kişi hâlâ sıcakken geçer. Bu süre içinde takip etmezsen hava soğur, başka öncelikler devreye girer.

### Takip zamanlaması

- **2-4 saat sonra:** Kısa bir mesaj ("Görüşmemizi düşündüm, soru var mı?")
- **24 saat sonra:** Hafif dokunuş ("Aklına bir şey takıldı mı?")
- **48 saat sonra:** Net bir adım ("Ne düşünüyorsun, paylaşır mısın?")

### 48 saat sonrası mesajı

"[Ad], geçen görüşmemizden sonra bir şeyler düşündün mü?
Merak ettim, soru veya tereddüt varsa birlikte bakmak isterim."

### Takip yaparken asla

❌ "Karar verdin mi?" ile başlama
❌ Her gün mesaj atma
❌ "Arkadaşın benden önce başladı" baskısı

### Devam eden takip ritmi

- 1. hafta: 1-2 mesaj
- 2. hafta: 1 mesaj
- 1. ay sonunda: "Hayatında ne değişti, nasılsın?" ile yeniden bağlan',
 5,
 ARRAY['takip', 'follow-up', '48 saat', 'timing'],
 true, 'tr'),

-- ── 8. FOLLOW-UP: "Düşüneceğim" diyene ──────────────────────
(NULL, 'script', 'follow_up', 'beginner',
 '"Düşüneceğim" Diyene Ne Yazacaksın?',
 '"Düşüneceğim" genellikle bir soru işaretinin arkasına saklanır. Bu scriptlerle gerçek endişeyi ortaya çıkar.',
 '## "Düşüneceğim" Diyene Ne Yazacaksın?

### "Düşüneceğim" ne anlama gelir?

Çoğu zaman şunlardan biri:
- Gerçek bir sorusu var ama sormaktan çekiniyor
- Para konusunda emin değil
- Aile/eş ile konuşmak istiyor
- Henüz güvenmedi

### Ortaya çıkarma mesajı

"[Ad], düşüneceğini söyledin, bu tamamen normal. Sana bir şey sormak istiyorum: Düşünürken en çok ne takılıyor aklına? Para mı, zaman mı, yoksa başka bir şey mi? Bilsem tam ihtiyacın olan bilgiyi verebilirim."

### Yanıtlarına göre devam

**"Para konusunda emin değilim"**
→ Finansal gereksinimleri ve başlangıç seçeneklerini anlat

**"Eşimle konuşmam lazım"**
→ "Harika bir karar, hatta ikinizi birlikte bilgilendirmek ister misin?"

**"Biraz daha zaman istiyorum"**
→ "Tamamen anlıyorum. Ne zaman tekrar konuşabiliriz?" — Tarih koy.

**"Bir sorunum yok, sadece düşünüyorum"**
→ Bırak. "Peki, hazır olduğunda yazabilirsin." — Baskı olmadan çık.

### Kapanış mesajı (3 gün sonra)

"[Ad], sadece sormak istedim — bir fikrin oluştu mu? Eğer hâlâ zamanın varsa 10 dakika konuşabiliriz, yoksa devam ederiz."',
 5,
 ARRAY['takip', 'düşüneceğim', 'script', 'itiraz'],
 true, 'tr'),

-- ── 9. TEAM BUILDING: İlk 5 ekip üyesi ──────────────────────
(NULL, 'lesson', 'team_building', 'intermediate',
 'İlk 5 Ekip Üyeni Nasıl Seçersin',
 'Ekip kalitesi nicelikten önce gelir. Doğru 5 kişiyi bulmak yanlış 50 kişiden daha değerlidir.',
 '## İlk 5 Ekip Üyeni Nasıl Seçersin

### Neden 5 sayısı?

İlk 5 ekip üyen temelini oluşturur. Bu 5 kişi büyürse, sen büyürsün. Bu 5 kişi motivasyonunu kaybederse, sen de kaybedersin.

### İdeal ekip üyesi profili

**Değerlendirme kriterleri:**
- Öğrenmeye açık mı?
- Tutarlı mı? (Söylediğini yapıyor mu?)
- Sosyal mi? (İnsanlarla iletişim kurabiliyor mu?)
- Motivasyonu içeriden mi geliyor?

### Kaçınılması gerekenler

❌ Sadece "para kazanmak istiyorum" diyenler — motivasyon sürdürülebilir olmayabilir
❌ Sürekli şikayetçi olanlar — enerjiyi düşürür
❌ Seni çok fazla sorgulayan, güvenmeyen kişiler

### İlk 30 gün desteği

İlk 5 kişini bulduktan sonra:
1. Haftada bir "check-in" görüşmesi yap
2. İlk satış/davette yanlarında ol
3. Başarıları kutla, küçük de olsa
4. Sisteme alıştır — araçları öğret

### Düşünce tuzağı

"Ben büyük ekip kurayım, sonra işe yarar." Yanlış. 5 bağlı kişi, 50 ilgisiz kişiden güçlüdür.',
 7,
 ARRAY['ekip', 'team building', 'liderlik', 'seçim'],
 true, 'tr'),

-- ── 10. LEADERSHIP: Duplikasyon sistemi ──────────────────────
(NULL, 'lesson', 'leadership', 'advanced',
 'Duplikasyon Sistemi Nedir?',
 'Network marketingin büyüsü: Öğrettiğini öğretenler yaratmak. Duplikasyon olmadan büyüme durur.',
 '## Duplikasyon Sistemi Nedir?

### Duplikasyon neden her şeyden önemli?

Eğer sadece sen çalışıyorsan, kazancın zamanınla sınırlıdır. Ama ekibindekiler de seni kopyalayabilirse, kazancın zamanının ötesine geçer.

### Duplikasyon formülü

**Öğren → Uygula → Öğret → İzle**

1. Bir tekniği öğren
2. Kendin uygula
3. Ekip üyene öğret
4. Onun öğretmesini izle

### Duplikasyonu engelleyen hatalar

❌ "Ben yaparım daha iyi" — Ekip üyeni devre dışı bırakırsın
❌ Sistemi karmaşık tutmak — Basit olan kopyalanır
❌ Sadece sözlü anlatmak — Yaz, göster, birlikte yap, bırak yapsın

### Simplifiye et

Ekibindeki herkes şunu yapabilmeli:
- Kontak listesi oluşturmak
- Davet mesajı yazmak
- Basit bir sunum yapmak
- Takip etmek

Bunları yapabiliyorlarsa, onlar da başkalarına öğretebilir.

### Altın soru

"Ekibim benim olmadan da devam edebilir mi?"
Bu sorunun cevabı "evet" ise, duplikasyon çalışıyor demektir.',
 8,
 ARRAY['duplikasyon', 'liderlik', 'sistem', 'ekip büyütme'],
 true, 'tr'),

-- ── 11. SOCIAL MEDIA: Instagram kişisel marka ────────────────
(NULL, 'lesson', 'social_media', 'intermediate',
 'Instagram''da Kişisel Marka Kurmak',
 'Instagram''ı doğru kullanmak, sana gelen sıcak adaylar yaratır. Spam değil, çekim merkezi ol.',
 '## Instagram''da Kişisel Marka Kurmak

### Temel prensip: Çek, itme

İnsanlara ürün/iş pompalamak iterim. Değerli içerik paylaşmak çeker.

### Profil optimizasyonu

- **Bio:** Kim olduğun + ne yaptığın + CTA (iletişim için DM)
- **Profil fotoğrafı:** Net, gülümseyen, profesyonel
- **Highlight''lar:** Ürün sonuçları, günlük yaşam, ekip

### İçerik karması (3-2-1 kuralı)

- **3 eğitici/değerli paylaşım:** İpuçları, motivasyon, bilgi
- **2 kişisel paylaşım:** Hayatın, ailenle, hobilerle
- **1 iş/ürün paylaşımı:** Sonuç, hikaye, sunum

### Ne paylaşma

❌ "Büyük fırsat kaçırmayın!"
❌ Ürün fotoğrafı + fiyat
❌ "DM at kazansın!" tarzdı paylaşımlar

### Story kullanımı

Storyde olmak = görünür olmak. Günde 1-3 story:
- Sabah rutinini göster
- Bir ipucu paylaş
- Soru sor (polls, slider)

### DM stratejisi

Takipçilerle organik konuşmalar başlat. Önce story''lerini yorumla, sonra konuşmaya geç. Asla direkt link gönderme.',
 7,
 ARRAY['instagram', 'sosyal medya', 'marka', 'içerik'],
 true, 'tr'),

-- ── 12. SOCIAL MEDIA: Yapılmayacaklar ────────────────────────
(NULL, 'cheat_sheet', 'social_media', 'beginner',
 'Sosyal Medyada YAPILMAYACAKLAR',
 'Hızlı referans: Sosyal medyada seni yakacak 10 hata ve alternatifi.',
 '## Sosyal Medyada YAPILMAYACAKLAR — Hızlı Referans

### ❌ 1. Spam DM atmak
"Harika bir fırsat var, bak" mesajı → Direkt blok
✅ Önce ilişki kur, sonra paylaş

### ❌ 2. Sadece ürün postalamak
Her paylaşım = ürün fotoğrafı + fiyat
✅ %70 değer, %30 ürün/iş içeriği

### ❌ 3. Abartılı kazanç paylaşımları
"Ayda 50.000 TL kazanıyorum!" ekranı
✅ Gerçek, mütevazı ilerleme hikayeleri paylaş

### ❌ 4. Şirket logosunu profil fotoğrafı yapmak
Şirket dağıtıcısı gibi görünürsün
✅ Sen olduğunu göster, insan ol

### ❌ 5. Tanımadığın insanları gruba eklemek
İzinsiz gruba ekleme = güvensizlik
✅ İzin al, sonra davet et

### ❌ 6. Her paylaşımda CTA (harekete geçirme çağrısı)
"DM at, bilgi al, hemen başla" her paylaşımda
✅ Her 5 paylaşımda bir CTA yeterli

### ❌ 7. Başkalarının içeriğini kopyalamak
Şirket materyallerini kopyala-yapıştır
✅ Kendi sözlerinle, kendi deneyimini anlat

### ❌ 8. Olumsuz yorumlarla tartışmak
"Bu ponzi" yorumuna sinirli cevap
✅ Saygılı, kısa cevap ver veya cevap verme

### ❌ 9. Arkadaşlık isteği spam''ı
Her gün 50 yabancıya istek atmak
✅ Günde 5-10, ortak bağlantısı olan kişilerle

### ❌ 10. Takipçi satın almak
Sahte kalabalık = güvensizlik
✅ Organik büyü, yavaş ama kalıcı',
 4,
 ARRAY['sosyal medya', 'hatalar', 'cheat sheet', 'başlangıç'],
 true, 'tr'),

-- ── 13. COMPLIANCE: Türkiye NM yasal çerçevesi ───────────────
(NULL, 'lesson', 'compliance', 'beginner',
 'Türkiye''de NM Yasal Çerçevesi (TİTCK)',
 'Yasal sınırları bilmek seni hem korur hem güvenilir yapar. TİTCK, MLM yasası ve satış sözleşmesi hakkında temel bilgiler.',
 '## Türkiye''de NM Yasal Çerçevesi

### Yasal dayanak

Türkiye''de doğrudan satış ve network marketing faaliyetleri **6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun** ve **Doğrudan Satış Yönetmeliği** kapsamında düzenlenmektedir.

### TİTCK nedir?

Türkiye İlaç ve Tıbbi Cihaz Kurumu — sağlık ürünleri için lisans ve denetim mercii. Şirketin TİTCK denetiminden geçmesi yasal güvencedir.

### Meşru NM vs. Piramit şeması farkı

**Meşru NM:**
- Gerçek ürün satışı var
- Gelir, ürün satışından geliyor
- Stok zorunluluğu yok (veya makul)
- Cayma hakkı var

**Yasadışı piramit:**
- Ürün yok veya sembolik
- Gelir, yeni üye getirmekten geliyor
- Giriş ücreti yüksek ve iade edilmez

### Satışçı olarak haklarını bil

- Abartılı sağlık iddiası yapma (yasal suç olabilir)
- "Bu ürün hastalığı iyileştirir" deme
- Cayma hakkını müşterine anlat
- Sözlü değil, yazılı sözleşme kullan

### Pratik kural

Ürün hakkında söyleyebileceklerin: Şirketin onayladığı ifadeler.
Söyleyemeyeceklerin: Tıbbi iddialar, garanti verilen kazanç rakamları.',
 8,
 ARRAY['yasal', 'compliance', 'TİTCK', 'Türkiye'],
 true, 'tr'),

-- ── 14. COMPLIANCE: Sağlık ürünleri söylem ───────────────────
(NULL, 'cheat_sheet', 'compliance', 'beginner',
 'Sağlık Ürünleri İçin Söylenebilen/Söylenemeyen Şeyler',
 'Yasal açıdan güvende kalmak için hızlı referans. Hangi cümleleri kullanabilirsin, hangileri risk yaratır?',
 '## Sağlık Ürünleri: Söylenebilen vs. Söylenemeyen

### ✅ Söylenebilen ifadeler

- "Bu ürün bende şu etkiyi yaptı..."
- "Kullandıktan sonra kendimi daha enerjik hissettim"
- "Ürün [sertifika/onay]''a sahip"
- "Bileşenler hakkında bilgi verebilirim"
- "Deneyen arkadaşlarımın geri bildirimleri..."
- "Bu besleyici/destekleyici bir üründür"

### ❌ Söylenemeyen ifadeler

- "Bu ürün [hastalık]''ı iyileştirir / tedavi eder"
- "Doktor onaylı" (eğer belgeleyemiyorsan)
- "Kesinlikle işe yarar, garanti"
- "İlaç yerine kullanabilirsiniz"
- "Bu ürünü kullananlar [hastalık]''dan kurtuldu"
- "Yan etkisi kesinlikle yok"

### Güvenli anlatım kalıbı

"Ben [ürünü] kullandım ve [kişisel deneyim] yaşadım. Benim için işe yaradı, ama herkesin vücudu farklı. Sağlıkla ilgili kararlarında doktoruna danışmanı öneririm."

### Neden önemli?

Yanlış sağlık iddiası:
- Tüketici şikayeti alabilirsin
- Şirket sorumluluk kabul etmez
- Yasal ceza riski

Güvenli sat, güvenilir ol.',
 4,
 ARRAY['sağlık', 'yasal', 'söylem', 'compliance'],
 true, 'tr'),

-- ── 15. MINDSET: Motivasyon düştüğünde ───────────────────────
(NULL, 'lesson', 'mindset', 'beginner',
 'Motivasyon Düştüğünde Ne Yaparsın?',
 'Motivasyon dalgalanır — bu normaldir. Düşük enerji dönemlerinde seni ayakta tutacak pratik araçlar.',
 '## Motivasyon Düştüğünde Ne Yaparsın?

### Gerçek şu: Motivasyon gelmez, üretilir

Motivasyonu beklersen gelmiyor. Harekete geçtiğinde geliyor.

### 5 pratik araç

**1. "Neden" listenizi yenile**
Kağıda yaz: Bu işi neden yapıyorsun? Ailem, özgürlük, ev, tatil — somut hedefler. Düşük anlarda listeni oku.

**2. Küçük bir başarı yarat**
Büyük hedef yerine bugün yapabileceğin küçük bir şey seç. 1 mesaj at, 1 kişiyle konuş. Küçük başarı momentum yaratır.

**3. Mentoruna ulaş**
Yalnız taşıma. Bir üst sıraya ya da deneyimli birine yaz. "Enerjim düştü" diyebilmek zayıflık değil, sistemin doğru kullanımı.

**4. Başarı hikayelerini oku**
Bu sayfadaki başarı hikayeleri ve akademi içerikleri için burada.

**5. Fiziksel hareket**
Yürüyüş, egzersiz veya sadece dışarı çıkmak. Beden hareket edince zihin de döner.

### Kaçınılacak tuzak

Motivasyon düşünce "bu işte değilim" sonucuna atlama. Her profesyonel düşük dönemler yaşar. Fark: Devam edenler ile bırakanlar.

### 24 saat kuralı

Çok kötü hissediyorsan, bugün büyük karar alma. 24 saat bekle, bir şey yap, sonra değerlendir.',
 5,
 ARRAY['mindset', 'motivasyon', 'düşük enerji', 'başlangıç'],
 true, 'tr');
