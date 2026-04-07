-- ============================================================
-- seed-objections.sql
-- 20 Sistem İtirazı — user_id = NULL (herkes görür)
-- supabase-schema-faz4.sql çalıştırıldıktan sonra çalıştır
-- ============================================================

INSERT INTO nmm_objections
  (user_id, category, objection_text, short_label, response_text, response_short, approach, example_dialog, is_system, language)
VALUES

-- ── 1. PARA YOK ───────────────────────────────────────────────
(NULL, 'money',
 'Şu an param yok, başlayamam.',
 'Param yok',
 'Anlıyorum, bu çok yaygın bir endişe. Aslında ben de aynı durumda başladım. Önemli olan büyük yatırım değil, küçük adımlar. Bu işin güzel yanı, başlangıçta ürünleri kendin kullanarak başlayabilmen — yani harcadığın para zaten ihtiyacın olan şeylere gidiyor. İstersen, yatırım gerektirmeden başlayabileceğin yolları sana göstereyim, sonra karar verirsin. Sadece bilgi, baskı yok.',
 'Para gerektiren başlangıç değil, küçük ürün denemesi. Kararın senin.',
 'Empati + ortak deneyim + alternatif yol + baskısız çıkış',
 'A: Param yok şu an.
B: Anlıyorum, ben de aynı yerden başladım. Aslında başlangıçta zaten kullandığın ürünleri seçerek girebiliyorsun. Yani harcamak değil, yönlendirmek oluyor. İstersen 5 dakika anlatayım, sonra "bu bana göre değil" dersen tamamen normal.',
 true, 'tr'),

-- ── 2. PONZİ / PİRAMİT ───────────────────────────────────────
(NULL, 'pyramid',
 'Bu Ponzi şeması mı? Saadet zinciri mi?',
 'Ponzi/Piramit',
 'Bu çok yerinde bir soru, sormaya hakkın var. Aslında network marketing ile piramit/Ponzi arasında çok net farklar var. Ponzi şemasında ürün yok, sadece para dolaşımı var. Network marketingde ise gerçek bir ürün var, müşteriye satılıyor, gelir oradan geliyor. Şirket yıllardır Türkiye''de yasal olarak faaliyette ve TİTCK denetiminden geçiyor. İstersen ürünleri sana göstereyim, kendin değerlendirirsin.',
 'Ponzi ürünsüzdür, NM gerçek ürünle yapılır. Şirket yasaldır, denetlenir.',
 'Soruya saygı + net bilgi + somut kanıt + ürün önerisi',
 'A: Bu Ponzi mi yani?
B: Çok haklısın sormaya hakkın var. Ponzi''de ürün yok, sadece para dolaşır. Bizde gerçek ürünler var, ben bile aile için kullanıyorum. Şirket de Türkiye''de TİTCK denetimli. İstersen göstereyim, sen karar ver.',
 true, 'tr'),

-- ── 3. ZAMANIM YOK ───────────────────────────────────────────
(NULL, 'time',
 'Çok meşgulüm, zamanım yok bu işlere.',
 'Zamanım yok',
 'Tamamen anlıyorum, çoğu insan ilk başta aynı şeyi söylüyor. Ben de aynı durumdaydım. İşin güzel yanı, bu tam zamanlı bir iş değil — günde 1-2 saat ayırarak başlayabiliyorsun, kendi temponda. Aslında zamanı olmayan insanlar için tasarlanmış bir sistem. Sana bir teklifim var: 15 dakikalık bir konuşma yapalım, sonra "bana göre değil" dersen sıfır baskı, normal devam ederiz.',
 'Tam zamanlı değil, günde 1-2 saat. 15 dk dinle, sonra karar ver.',
 'Empati + zaman beklentisini düşür + küçük commitment iste',
 'A: Boş zamanım yok ki.
B: Anlıyorum, ben de öyle başladım. Aslında bu işin güzelliği günde 1 saat de yapılabilmesi. Sana 15 dakika ayır, dinle, sonra "bana göre değil" dersen tamamen normal.',
 true, 'tr'),

-- ── 4. AİLEM İZİN VERMİYOR ───────────────────────────────────
(NULL, 'family',
 'Eşim/ailem izin vermiyor.',
 'Aile izin vermiyor',
 'Bu gerçekten önemli bir endişe, ailenin desteği bu işte çok değerli. Genellikle ailelerin itirazı, bu konuyu tam anlamamaktan geliyor. Yanlış bir şey değil, çoğu aile ilk başta şüpheyle bakar. Sana şu öneriyi yapayım: Önce kendin iyice tanı, sonra eşini/aileni de kısa bir bilgilendirmeye davet et. Konuyu birlikte değerlendirmeniz çok daha sağlıklı bir karar vermenizi sağlar. Ailenin soruları varsa, birlikte cevaplayabiliriz.',
 'Ailenin şüphesi normaldir; onu da bilgilendirmeye davet et.',
 'Empati + ailenin korkusunu normalize et + birlikte karar',
 'A: Eşim istemez bu işleri.
B: Anlıyorum, çoğu aile ilk başta aynı şeyi söylüyor. Çünkü tam bilgileri yok. İstersen eşini de dahil edelim, kısa bir tanıtım yapalım, sorularını cevaplayalım. Sonra birlikte karar verin, baskı yok.',
 true, 'tr'),

-- ── 5. SATIŞÇI DEĞİLİM ───────────────────────────────────────
(NULL, 'fear',
 'Ben satışçı değilim, satış yapamam.',
 'Satışçı değilim',
 'Bu işin en güzel yanı: satışçı olmak zorunda değilsin. Aslında en iyi network marketingciler, satış yapmayan ama paylaşan insanlardır. Ürünü kendin kullanıyorsun, işe yarıyorsa bunu arkadaşlarınla paylaşıyorsun — bu satış değil, tavsiye. Hangimiiz arkadaşımıza iyi bir restoran, film veya ürün tavsiye etmeyiz? İşte bu o.',
 'NM satış değil, tavsiyle. Zaten yapıyor olduğun şeyi para kazanarak yapıyorsun.',
 'Yeniden çerçeveleme + günlük hayattan örnek + baskısız',
 'A: Satış yapamam, satışçı değilim.
B: Ben de satışçı değilim! Bu işi satış gibi görmüyorum. Ürünü kullanıyorum, işe yarıyor, arkadaşlarıma söylüyorum. Bir restoran tavsiye etmekten farkı yok, sadece para kazanıyorum buna.',
 true, 'tr'),

-- ── 6. DAHA ÖNCE DENEDİM, OLMADI ────────────────────────────
(NULL, 'experience',
 'Daha önce denedim, para kaybettim.',
 'Daha önce olmadı',
 'Bu gerçekten üzücü ve seni duyuyorum. Maalesef sektörde iyi çalışılmayan veya desteksiz bırakılan örnekler var. Benimle fark şu: Seni başlatıp bırakmıyorum. Bir yol haritamız var, ilk 90 günde adım adım gidiyoruz. Yine de seni zorlamak istemiyorum — sadece şunu sormak isterim: Daha önce hangi adımları attın, nerede takıldın? Belki orada ne farklı yapabileceğimizi birlikte görebiliriz.',
 'Önceki deneyim değerli; bu sefer destek ve sistem var. Neyi farklı yapabiliriz?',
 'Empati + fark yaratacak unsuru göster + soru ile devam',
 'A: Ben bu işi bir kez denedim, para kaybettim.
B: Seni duyuyorum, bu gerçekten zor. Sana sorabilir miyim, o zaman seni destekleyen biri var mıydı? Çünkü bu iş yalnız zor. Seninle birlikte bir yol haritası çıkarsak, 30 gün sonra nerede olacağını görmek ister misin?',
 true, 'tr'),

-- ── 7. ÜRÜNE İNANMIYORUM ─────────────────────────────────────
(NULL, 'product',
 'Bu ürünler gerçekten işe yarıyor mu?',
 'Ürüne inanmıyorum',
 'Bu soruyu sorman harika, çünkü ben de başlamadan önce aynı şeyi sordum. En dürüst cevabım: Ben ve ailem kullanıyoruz, gördüğüm farkı sana anlatırım. Ama en iyisi kendin denemek — şüpheyle başlamak normaldir. İstersen sana küçük bir deneme paketi önereyim, bir ay kullan, fark hissetmezsen zaten devam etmek zorunda değilsin.',
 'Şüpheyle başlamak normal. Dene, fark hissetmezsen zaten devam etme.',
 'Dürüstlük + kişisel deneyim + deneme önerisi',
 'A: Bu ürünlerin gerçekten işe yarayıp yaramadığını bilmiyorum.
B: Ben de aynı şeyi düşünerek başladım. Şimdi ailem de kullanıyor. Ama en iyisi kendin denemen. İstersen sana küçük bir paket önereceğim, bir ay bak, fark hissetmezsen bitti.',
 true, 'tr'),

-- ── 8. ŞİRKETE GÜVENMİYORUM ──────────────────────────────────
(NULL, 'company',
 'Bu şirkete güvenmiyorum, duyduklarım iyi değildi.',
 'Şirkete güvenmiyorum',
 'Bu endişeyi duyduğuna sevindim, doğruyu araştırmak önemli. Şirket hakkında duyduklarını paylaşırsan, birlikte değerlendirebiliriz. Şunu söyleyebilirim: Şirket Türkiye''de yıllardır faaliyet gösteriyor, TİTCK onaylı ürünleri var. Ben kendi araştırmamı yaptım ve gördüklerimi paylaşabilirim. Ama her zaman söylüyorum: Bir kaynaktan duyulan bilgiye değil, birden fazla kaynağa bak.',
 'Kaynağı sorgula; şirket belgelerini birlikte inceleyelim.',
 'Soruya saygı + bilgi paylaşımı + belge/kanıt göster',
 'A: Bu şirketten iyi şeyler duymadım.
B: Ne duydun, anlatır mısın? Birlikte değerlendirelim. Benim araştırdıklarımı da paylaşayım. Şirket TİTCK denetimli, ürünleri onaylı. Ama her zaman söylüyorum, kendim karar verin.',
 true, 'tr'),

-- ── 9. GÜVENMİYORUM (GENEL) ──────────────────────────────────
(NULL, 'trust',
 'Sana güveniyorum ama bu işe pek inanmıyorum.',
 'İşe inanmıyorum',
 'Dürüstlüğün için teşekkürler, bu benim için çok değerli. Şüphe duymak tamamen normal. Ben de bu işe başlamadan önce aynı şekilde düşünüyordum. Senden istediğim şey şu: Karar vermeni değil, sadece bilgilenmeni istiyorum. Bir oturup 20 dakika konuşalım, sonra "bu bana göre değil" dersen ilişkimiz devam eder. Sadece bilgi, yargı yok.',
 'Şüphe normal; sadece bilgilenme, karar sana ait.',
 'Empati + şüpheyi normalize et + düşük riskli adım öner',
 'A: Sana güveniyorum ama bu işlere inanmıyorum açıkçası.
B: Dürüstlüğün için çok teşekkürler. Ben de başlamadan önce aynı şekilde hissettim. Senden karar vermeni istemiyorum. Sadece 20 dakika dinle, sonra "hayır" dersen tamamen normaliz.',
 true, 'tr'),

-- ── 10. ÇEVRESİ YOK ──────────────────────────────────────────
(NULL, 'no_network',
 'Çevrem çok dar, tanıdığım yok ki.',
 'Çevrem yok',
 'Bu çok yaygın bir düşünce ama şunu söyleyeyim: Büyük çevreler büyük ağlar garantilemez. Önemli olan kaç kişiyi tanıdığın değil, onlarla nasıl ilişki kurduğun. Ayrıca bu iş, mevcut çevren dışına da çıkmayı öğretiyor. Sosyal medya, topluluklar, ortak hobiler — yeni bağlantılar kurmak düşündüğünden kolay. Seninle birlikte bir başlangıç listesi çıkaralım; tanıdığın 10 kişiyi yaz, şaşıracaksın.',
 'Çevre büyüklüğü değil ilişki kalitesi önemli. 10 kişilik listeyle başla.',
 'Yeniden çerçeveleme + pratik adım + güven ver',
 'A: Hiç çevrem yok ki bu işi yapayım.
B: Ben de öyle düşünüyordum. Ama bir kağıda 10 isim yaz bakalım — arkadaş, komşu, eski iş arkadaşı... Şaşıracaksın kaç kişi çıktığına. Seninle birlikte yapalım bunu.',
 true, 'tr'),

-- ── 11. İÇE DÖNEKİM ──────────────────────────────────────────
(NULL, 'introvert',
 'Ben çok içe dönüğüm, bu iş benim için değil.',
 'İçe dönüğüm',
 'Sürpriz bir şey söyleyeyim: Tanıdığım en başarılı network marketingcilerin bir kısmı tam da senin gibi içe dönük insanlar. Çünkü içe dönük insanlar genellikle daha dikkatli dinler, daha özgün ilişki kurar ve satışa değil insana odaklanır. Bu iş bağırmak, büyük kalabalıklar değil — bire bir, derin konuşmalar. Senin güçlü yanın.',
 'İçe dönük olmak engel değil; derin ilişki kurma becerin avantaj.',
 'Yeniden çerçeveleme + içe dönüklüğü güce dönüştür',
 'A: Çok içe dönüğüm, tanımadıklarımla konuşamam.
B: Sürpriz olacak ama en iyi networkerların çoğu içe dönük! Çünkü satmak yerine dinliyorlar. Bu iş büyük sahne değil, bire bir konuşmalar. Senin güçlü yanın bu.',
 true, 'tr'),

-- ── 12. İŞİM VAR, GEREK YOK ──────────────────────────────────
(NULL, 'employed',
 'İşim var, maaşım yeterli.',
 'İşim var yeterli',
 'Harika, bu gerçekten iyi bir pozisyon. Sana sormak istiyorum: Maaşın 10 yıl sonra da aynı hayatı karşılayacak mı? Terfiler, zam beklentileri her zaman gerçekleşmiyor. Network marketing, işini bırakmadan yapabileceğin bir şey — bir B planı. En kötü senaryoda sadece ürünleri kendin kullanmış olursun. Ama olumlu senaryoda, maaşına ek bir gelir kanalın olur.',
 'B planı olarak düşün; işini bırakmak zorunda değilsin.',
 'Gelecek odaklı soru + risk-fayda dengesi + bırakmak zorunda değilsin',
 'A: İşim var, maaşım yeterli, neden uğraşayım.
B: Harika, bu gerçekten iyi. Sana bir soru: 10 yıl sonra maaşın yetecek mi? Bu işi yapmak için işten çıkman gerekmiyor. Ek bir gelir olarak düşün. En kötü ihtimalle ürünleri kendin kullanmış olursun.',
 true, 'tr'),

-- ── 13. DÜŞÜNECEĞIM ──────────────────────────────────────────
(NULL, 'wait',
 'Düşüneceğim, daha sonra bakarım.',
 'Düşüneceğim',
 '"Düşüneceğim" derken aslında neyin cevabını arıyorsun? Çünkü çoğu zaman "düşüneyim" bir soru işaretinin arkasında saklıdır. Parası mı, zamanı mı, güveni mi — hangisi? Bunu bilsem, tam ihtiyacın olan bilgiyi sana verebilirim. Yoksa bekleyebilirim, baskı yok. Ama şunu bilelim: Ne zaman tekrar konuşabiliriz?',
 '"Düşüneyim"in arkasındaki gerçek soruyu bul.',
 'Soru ile derine in + belirsizliği somutlaştır + tarih belirle',
 'A: Düşüneyim, sonra bakarım.
B: Tabii ki. Ama sana sormak istiyorum: Düşünürken en çok ne takıldı aklına — para mı, zaman mı, yoksa başka bir şey mi? Bilsem tam ihtiyacın olan bilgiyi verebilirim.',
 true, 'tr'),

-- ── 14. DAHA ÖNCE DENEDIM, MARKAYI TANIMIYOR ─────────────────
(NULL, 'experience',
 'Bu markayı hiç duymadım, tanınmıyor.',
 'Markayı tanımıyorum',
 'Anlaşılır, her yeni marka başlangıçta bilinmiyor. Apple 1976''da garaj şirketiydi. Önemli olan markanın şu anki büyüklüğü değil, ürünün kalitesi ve şirketin arkasındaki güç. Sana markanın lisanslarını, sertifikalarını ve büyüme rakamlarını gösterebilirim. Ama en iyisi ürünü kendin denemek — kaliteli bir ürün konuşturur kendini.',
 'Yenilik fırsat olabilir; ürün kalitesini kendin değerlendir.',
 'Yeniden çerçeveleme + kanıt göster + deneme öner',
 'A: Bu markayı tanımıyorum, bilmiyorum.
B: Anlıyorum, yeni bir marka tanımak zaman alır. Ama sana sertifikalarını göstereyim, sonra bir ürün dene. Kaliteli ürün kendini gösterir.',
 true, 'tr'),

-- ── 15. PARA KAZANMIYORUM Kİ ──────────────────────────────────
(NULL, 'trust',
 'Sen de para kazanmıyorsundur zaten.',
 'Sen de kazanmıyorsun',
 'Bu soruyu sormaya hakkın var ve dürüst olmak istiyorum. Bu işte herkes aynı anda aynı miktarı kazanmıyor. Kazanç, emek ve sistematik çalışmayla geliyor. Şu an nerede olduğumu ve nereye gittiğimi açıkça anlatabilir, kazanç belgelerimi paylaşabilirim. Önemli olan sana ne söylediğim değil, neyi ispat edebildiğim.',
 'Dürüst ol; belgeleri göster, baskısız anlat.',
 'Dürüstlük + kanıt gösterme + şeffaflık',
 'A: Sen de para kazanmıyorsun bu işten.
B: Dürüst olmak istiyorum: Her şey emek ve zamana bağlı. Sana rakamlarımı gösterebilirim, ne kadar sürede ne yaptığımı anlatabilirim. Sonra kendin değerlendirirsin.',
 true, 'tr'),

-- ── 16. ÇOCUKLARIM VAR, VAKTİM YOK ───────────────────────────
(NULL, 'family',
 'Çocuklar küçük, hiç vaktim yok.',
 'Çocuklar küçük',
 'En güzel yanlarından biri bu: Ev hanımlığı veya çocuk bakımıyla yürütülebilen nadir işlerden biri. Uyku saatlerinde, çocuklar okuldayken, telefonda yapabileceğin işler. Çocukları büyürken ekonomik bağımsızlık kazanmak — o hedefe giden kısa bir konuşmaya değmez mi?',
 'Esnek çalışma saatleri tam da çocuk sahibi ebeveynler için uygun.',
 'Durumu yeniden çerçevele + pratik zaman dilimleri göster',
 'A: Çocuklarım var, hiç vaktim olmuyor.
B: Tam da o yüzden bu iş sana uygun olabilir. Ben de çocuk büyütürken yaptım. Uyku saatlerinde, çocuk uyurken. Günde 1 saat bile yeter başlangıç için.',
 true, 'tr'),

-- ── 17. KOMİSYON GELİRİNE GÜVENMİYORUM ──────────────────────
(NULL, 'trust',
 'Pasif gelir masallarına inanmıyorum.',
 'Pasif gelire inanmıyorum',
 'Haklısın, "pasif gelir" kelimesi çok suistimal edildi ve gerçekçi beklentiler yaratmıyor. Şunu düzeltelim: Bu iş başlangıçta pasif değil, emek ister. Ama zamanla, kurduğun ekip büyüdükçe aktif çalışmadan da gelir akabilir. Bu bir süreç. Sana "hemen pasif gelir" demiyorum — sana "sistematik çalışınca ne olur" diyorum.',
 'Pasif gelir anında gelmez; emek + sistem + zaman ile oluşur.',
 'Beklentiyi düzelt + gerçekçi süreç anlat',
 'A: Pasif gelir diyorsunuz ama bunlar hep yalan.
B: Haklısın, o kelime çok suistimal edildi. Bana "hemen pasif" demiyorum. Ama 1-2 yıl sistematik çalışınca ekibin büyüyor, o zaman gelir kendiğinden akmaya başlıyor. Sana o süreci anlatayım.',
 true, 'tr'),

-- ── 18. EĞİTİMSİZ, YAPABİLİR MİYİM ─────────────────────────
(NULL, 'fear',
 'Yeterince eğitimim yok, başaramam.',
 'Eğitimim yok',
 'Bu işte okul diploması değil, insanlarla iletişim kurmak önemli. Ve bunu zaten yapıyorsun — her gün arkadaşlarınla konuşuyorsun. Ayrıca seni eğitimsiz bırakmıyoruz; sistemimizde adım adım öğreniyorsun. Başarılı distribütörlerimizin önemli bir kısmı üniversite mezunu değil ama insan odaklı, tutarlı insanlar.',
 'NM okul değil iletişim ister. Eğitim sistemimiz var, bırakmıyoruz.',
 'Empati + yeniden çerçevele + destek sistemi vurgula',
 'A: Eğitimim yok, bu işi yapamam.
B: Bu işte diploma değil, insan sevgisi önemli. Senin iletişimin var mı, insanlarla konuşabiliyor musun? İşte bu yeterli başlangıç. Gerisini birlikte öğreniriz.',
 true, 'tr'),

-- ── 19. YORULDUM, MOTİVASYONUM YOK ──────────────────────────
(NULL, 'other',
 'Bu tür işlere artık motive olamıyorum.',
 'Motivasyonum yok',
 'Seni duyuyorum. Motivasyon kayması herkesin yaşadığı bir şey. Sana sormak istiyorum: Ne için çalışmak seni mutlu eder? Çünkü bu iş bir araç. Hedef varsa motivasyon kendiliğinden gelir. Belki kısa vadeli küçük bir hedef koysak — 3 ayda şu kadar ek gelir, o paramla şunu yapacaksın — o spesifik hedef her şeyi değiştirir.',
 'Motivasyon hedeften gelir; somut bir 3 aylık hedef koy.',
 'Empati + hedef bulma + küçük adım',
 'A: Bu tür işlerle motivasyon tutturamıyorum artık.
B: Seni anlıyorum. Sana bir şey sorayım: 3 ay içinde ne yapmak istersin? Tatil mi, borç kapatmak mı, araba mı? Somut bir hedef olsun, motivasyon kendiliğinden gelir.',
 true, 'tr'),

-- ── 20. HERKES REDDEDİYOR ─────────────────────────────────────
(NULL, 'other',
 'Konuştuğum herkes hayır dedi, bu iş olmaz.',
 'Herkes reddediyor',
 'Redler bu işin bir parçası — ve bu söz sizi rahatlatmak için değil, gerçek. Başarılı distribütörler "hayır" almayı öğrenen insanlar. Önemli soru şu: Kaç kişiyle ve nasıl konuştun? Çünkü sunum yerine konuşma, teklif yerine soru sorma yaklaşımı "evet" oranını ciddi artırıyor. Seninle birlikte yaklaşımını gözden geçirelim mi?',
 '"Hayır" normaldir. Yaklaşımını birlikte gözden geçirelim.',
 'Normalize et + sistem hatası ara + destek sun',
 'A: Konuştuğum herkes hayır dedi.
B: Bu işte "hayır" almanın normal olduğunu söyleyeyim. Ama şunu sorayım: Nasıl konuştun? Çünkü yaklaşım her şeyi değiştirir. Seninle bir rol yapma yapalım mı, görelim nerede takılıyorsun.',
 true, 'tr');
