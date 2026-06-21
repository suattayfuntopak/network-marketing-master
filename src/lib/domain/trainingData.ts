export interface Konu {
  id: string
  baslik: string
  emoji: string
  sure: string
  seviye: 'Temel' | 'Orta' | 'İleri' | 'Basic' | 'Medium' | 'Advanced'
  ozet: string
  maddeler: string[]
  /** İçerik biçimi: madde-madde "konu" (varsayılan) ya da uzun-form "makale". */
  format?: 'topic' | 'article'
  /** Uzun-form makale gövdesi. Sade biçim: boş satır=paragraf, `## `=ara başlık, `- `=madde, `> `=alıntı. */
  govde?: string
}

export interface Kategori {
  id: string
  baslik: string
  emoji: string
  renk: string
  konular: Konu[]
}

const TR_KATEGORILER: Kategori[] = [
  {
    id: 'zihniyet',
    baslik: 'Zihniyet & Temel',
    emoji: '🧠',
    renk: 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc] border-[#E0E7FF] dark:border-[#312e8130]',
    konular: [
      {
        id: 'z1',
        baslik: 'Network Marketing Nedir?',
        emoji: '🌐',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'İşin gerçek tanımı, efsanelerden arındırılmış sade anlatım.',
        maddeler: [
          'NM, doğrudan satış ve kişisel tavsiye ekonomisinin birleşimidir.',
          'Şirket, reklam bütçesini distribütörlere komisyon olarak öder.',
          'Kazanç iki kaynaktan gelir: kendi satışın ve ekibinin satışı.',
          'Yasal NM\'de ürün gerçek, tüketim sürekli, büyüme sürdürülebilir.',
          'Piramit sistemiyle farkı: NM\'de çıkılan basamağı geride bırakabilirsin.',
        ],
      },
      {
        id: 'z2',
        baslik: 'Niçin Çoğu İnsan Bırakıyor?',
        emoji: '🚶',
        sure: '4 dk',
        seviye: 'Temel',
        ozet: 'İstatistiklerin arkasındaki gerçek ve onlardan sıyrılma yolu.',
        maddeler: [
          'Çoğu insan ilk 90 günde bırakır — yanlış beklenti nedeniyle.',
          'NM bir maraton, sprint değil; yavaş ama güçlü büyüme gerektirir.',
          'Sosyal baskı ve ilk reddedilmeler en yaygın bırakma nedenidir.',
          'Sürekli kalan %20, toplamın %80\'ini kazanır — bu her alanda böyle.',
          'Çözüm: net bir "neden" bulmak ve mentorla çalışmak.',
        ],
      },
      {
        id: 'z3',
        baslik: 'Büyüme Zihniyeti',
        emoji: '🌱',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Sabit zihniyet tuzağından çıkış ve gelişime açık olmanın pratiği.',
        maddeler: [
          '"Doğuştan satıcı değilim" sabit zihniyet tuzağıdır.',
          'Beceriler öğrenilir — iletişim, takip, sunum, liderlik.',
          'Her reddedilme, evet\'e bir adım daha yaklaşmak demektir.',
          'Geri bildirimi kişisel almamak: "hayır" sana değil, zamana söyleniyor.',
          'Kitap, podcast ve gözlemin günlük zihinsel "egzersizin" olsun.',
        ],
      },
      {
        id: 'z4',
        baslik: 'Reddedilmenin Sırrı: "Hayır" Ne Demek?',
        emoji: '🛡️',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'Network marketingde reddedilme korkusu en büyük engeldir — "hayır"ı yeniden çerçevele.',
        maddeler: [
          '"Hayır" genellikle zamana, yorgunluğa veya netlik eksikliğine söyleniyor — sana değil.',
          '"Hayır çeşitleri": "şimdi değil" → sonra dön; "bu yolla değil" → yaklaşımı değiştir; "asla" → ilişkiyi koru.',
          'Bu hafta 5 kişiyle konuş; "hayır" alsan bile kapıyı açık bırak.',
          '"Ne zaman tekrar yazabilirim?" sorusunu sor — baskı değil, netlik.',
          'Hareketsiz kalmak, reddedilmekten daha büyük risktir.',
        ],
      },
      {
        id: 'z5',
        baslik: 'Motivasyon Düştüğünde Ne Yaparsın?',
        emoji: '🔋',
        sure: '7 dk',
        seviye: 'Temel',
        ozet: 'Motivasyon dalgalanır — bu normaldir. 7 pratik araç ve SWSWSWN çerçevesiyle ritme geri dön.',
        maddeler: [
          'Motivasyon düşüşü enerji değil, netlik sorunudur: "neden yaptığımı unuttum" demektir.',
          '7 araç: Neden listeni yenile → Küçük başarı yarat → Mentoruna ulaş → Başarı hikayelerini oku → Ret sayını tut → Fiziksel hareket et → 24 Saat Kuralı.',
          'SWSWSWN: Some Will, Some Won\'t, So What, Next — her "hayır" bir "evet"e yaklaştırıyor.',
          '24 Saat Kuralı: çok düşük hissediyorsan büyük karar alma; "bırakacağım" kararını 24 saat ertele.',
          'Motivasyon hedeften gelir — önce küçük adım at, motivasyon peşinden gelir.',
        ],
      },
      {
        id: 'z6',
        baslik: 'Hedefini Belirle ve "Neden"ini Bul',
        emoji: '🎯',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Güçlü bir "neden", zor günlerde seni ayakta tutan tek şeydir — hedefini netleştir.',
        maddeler: [
          'Hedef olmadan çaba dağılır; "ne kadar, ne zaman, ne için" sorularını yazıya dök.',
          'Yüzeysel neden ("biraz ek gelir") zorlukta dağılır; derin neden ("çocuğumun eğitimi") seni taşır.',
          '5 Neden tekniği: "Bunu neden istiyorum?" sorusunu 5 kez sor, gerçek motivasyona in.',
          'Hedefini SMART yap: Belirli, Ölçülebilir, Ulaşılabilir, İlgili, Zaman sınırlı.',
          'Neden listeni gözünün önüne as; motivasyon düştüğünde önce ona bak.',
        ],
      },
      {
        id: 'z7',
        baslik: 'Bolluk Zihniyeti vs Kıtlık Zihniyeti',
        emoji: '🌅',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Kıtlık zihniyeti baskı ve umutsuzluk yayar; bolluk zihniyeti çekim yaratır.',
        maddeler: [
          'Kıtlık: "Bu kişiyi kaçırırsam biterim." → Baskı hissedilir, aday kaçar.',
          'Bolluk: "Doğru kişiyse harika, değilse başka kapı var." → Rahatlık çeker.',
          'Aday havuzun ne kadar genişse her "hayır"ın psikolojik ağırlığı o kadar azalır.',
          'Bolluk zihniyeti naiflik değil; çok sayıda kaliteli temas üretmenin sonucudur.',
          'Kovalayan değil, çekim yaratan distribütör kazanır — duruşun her şeyi belirler.',
        ],
      },
      {
        id: 'z8',
        baslik: 'Alışkanlık İnşası: Küçük Adımların Gücü',
        emoji: '⚙️',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Başarı motivasyondan değil, küçük ve tutarlı alışkanlıklardan gelir.',
        maddeler: [
          'Tek doğru davranışı her gün tekrarlamak, her gün farklı taktik denemekten güçlüdür.',
          'Alışkanlığı mevcut bir rutine bağla: "Sabah kahvemden sonra 3 yeni isimle konuşurum."',
          'Çok küçük başla — günde 2 mesaj — sürekliliği yakaladıktan sonra büyüt.',
          'Zinciri kırma: takvimde günlük aksiyonu işaretle, görsel ilerleme motive eder.',
          'Kötü hissettiğinde de minimum dozu yap; ritim duygu dalgalanmasından güçlüdür.',
        ],
      },
      {
        id: 'z9',
        baslik: 'Yeni Başlayanın En Sık 5 Hatası',
        emoji: '⚠️',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Bu hatalar kötü niyetten değil deneyimsizlikten gelir — görmek düzeltmenin yarısıdır.',
        maddeler: [
          'Hata 1: Fazla anlatmak, az dinlemek. → Önce soru sor, ihtiyacı anla.',
          'Hata 2: Herkesi aday görmek yerine kimseye ulaşmamak. → Geniş liste çıkar, başla.',
          'Hata 3: Ürün/şirket detayına boğulup harekete geçmemek. → Öğrenirken aksiyon al.',
          'Hata 4: İlk "hayır"da bırakmak. → "Hayır" işin doğal parçası; ritmini koru.',
          'Hata 5: Takip etmemek. → Servet takipte gizli; 48 saat içinde geri dön.',
        ],
      },
    ],
  },
  {
    id: 'iletisim',
    baslik: 'İletişim & Takip',
    emoji: '🗣️',
    renk: 'bg-[#E1F5EE] dark:bg-[#0d3d2e] text-[#0F6E56] dark:text-[#4ade80] border-[#D2EFE4] dark:border-[#0d3d2e80]',
    konular: [
      {
        id: 'i1',
        baslik: 'İlk Konuşmayı Açmak',
        emoji: '👋',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'Doğal bir konuşmayı nasıl fırsata dönüştürürsün.',
        maddeler: [
          'İnsanlar satış konuşması duymak istemez, hikâye duymak ister.',
          'Kendi değişimini anlat: "Ben de aynı durumdaydım…" ile başla.',
          'Soru sor, cevap verme: merak uyandır, zorla anlatma.',
          'Hedef: ilgi uyandırmak, bir sonraki adımı davet etmek.',
          '"Sana 2 dakikam var, ilgini çeker mi?" formülü çalışır.',
        ],
      },
      {
        id: 'i2',
        baslik: '2 Dakikalık Sunum',
        emoji: '⚡',
        sure: '7 dk',
        seviye: 'Orta',
        ozet: 'Kısa, güçlü ve akılda kalan bir sunum nasıl yapılır.',
        maddeler: [
          'Uzun sunum dikkat öldürür. 2 dakika yeterli, 20 dakika çok fazla.',
          'Yapı: Sorun → Çözüm → Kanıt → Davet.',
          'Rakam kullan: "3 ayda X TL" somut, "iyi para" muğlak.',
          'Öz hikâyeni ezberle: pratik yapar, pratik güven verir.',
          'Sunum bir kapı açar — her şeyi o kapının önünde anlatma.',
        ],
      },
      {
        id: 'i3',
        baslik: 'Takip Sanatı',
        emoji: '🔁',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: '"Hayır" yerine "henüz hazır değilim" diyenleri kaybetmemek.',
        maddeler: [
          'Satışların %80\'i 5. temastan sonra gerçekleşir.',
          'İlk "hayır" karar değil, savunma refleksidir.',
          'Takip zamanlaması: 2 gün → 1 hafta → 1 ay → 3 ay.',
          'Her takipte yeni bir değer sun; sadece "düşündün mü?" deme.',
          'Takip etmek, baskı değil; ilgi ve değer sunmaktır.',
        ],
      },
      {
        id: 'tu1',
        baslik: '48 Saat Kuralı: Sunum Sonrası Takip',
        emoji: '⏱️',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'Sunum bittikten sonra ilk 48 saat en yüksek ilgi zamanıdır — bu fırsatı kaçırma.',
        maddeler: [
          'Sunum biter bitmez 24-48 saat içinde takip et — bu süre en yüksek ilgi zamanı.',
          'Takip mesajı bir satış tekrarı değil, değer sunan bir devam: "Düşündükten sonra en büyük soru işaretin ne oldu?"',
          '"Hayır" aldıysan: ilişkiyi koru, kapıyı açık bırak, 30-90 gün sonra doğal bir sebeple tekrar yaz.',
          'Her takip yeni bir değer sunar — "Düşündün mü?" sorusu tek başına yetmez.',
          'Takip sistemi olmadan ekip büyümesi mümkün değildir.',
        ],
      },
      {
        id: 'tu2',
        baslik: '"Düşüneceğim" Diyene Ne Yazacaksın?',
        emoji: '💭',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: '"Düşüneceğim" cevabı bir karar değil, gizli bir soru işaretidir — onu bul ve ele al.',
        maddeler: [
          '"Düşüneceğim" denilinceyi bir karar değil, gizli soru işareti olarak gör.',
          'Hemen sormayı bırakma — derine in: "Düşünürken en çok ne aklında kalıyor?"',
          'İlgili kısa bir içerik veya belge gönder — değer sun, sonra takip et.',
          '3 gün sonra nazik takip: "Fırsat buldun mu bakmaya?"',
          '"Düşüneyim" cevabı çoğu zaman para, zaman veya aile endişesi barındırır.',
        ],
      },
      {
        id: 'i4',
        baslik: 'Aktif Dinleme ve Doğru Soruyu Sorma',
        emoji: '👂',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'En iyi distribütörler çok konuşan değil, doğru soruyu sorup dinleyenlerdir.',
        maddeler: [
          'Konuşma oranı %30 sen, %70 aday olmalı; satış değil, ihtiyaç keşfi yap.',
          'Açık uçlu sorular sor: "Şu an hayatında değiştirmek istediğin tek şey ne olurdu?"',
          'Dinlerken çözüm hazırlama — gerçekten anla; insanlar anlaşıldığını hissedince açılır.',
          'Duyduğunu özetle: "Yani seni asıl yoran zaman esnekliği, doğru mu anladım?"',
          'Sessizliği doldurmaya çalışma; soru sonrası 3 saniye bekle, aday düşünsün.',
        ],
      },
      {
        id: 'i5',
        baslik: 'FORM Formülü ile Bağ Kur',
        emoji: '🤝',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'İş konuşmadan önce insan ol — FORM ile samimi bağ kur, güven sonra gelir.',
        maddeler: [
          'FORM: Family (Aile), Occupation (İş), Recreation (Hobi), Money/Motivation (Para/Motivasyon).',
          'Önce ilişki, sonra iş: insanlar güvendikleri kişiden dinler.',
          'Aile ve hobi sorularıyla içten ilgilen; bu satış taktiği değil, gerçek merak olmalı.',
          'İş ve motivasyon konusu, kişinin "neden"ine ve fırsata köprü kurar.',
          'Notlarını tut; bir sonraki temasta detayları hatırlamak güçlü bir bağ sinyalidir.',
        ],
      },
      {
        id: 'i6',
        baslik: 'Beden Dili ve Ses Tonu',
        emoji: '🧏',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'İletişimin büyük kısmı kelimeler değil; ses tonu ve beden dilidir.',
        maddeler: [
          'Mesajın etkisinde kelimelerden çok ses tonu ve beden dili belirleyicidir.',
          'Görüntülü görüşmede göz teması (kameraya bak), gülümseme ve dik duruş güven verir.',
          'Sesli mesajda enerji ve içtenlik duyulur; monoton ton ilgisizlik olarak algılanır.',
          'Aynalama: adayın tempo ve enerjisine uyum sağla, yapay coşkudan kaçın.',
          'WhatsApp\'ta noktalama ve ton önemli; kuru "ok" yerine sıcak ve net dil kullan.',
        ],
      },
      {
        id: 'i7',
        baslik: 'Hikaye Anlatımının Gücü',
        emoji: '📖',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'İnsanlar veriyle ikna olmaz, hikayeyle bağ kurar — kendi ve üçüncü kişi hikayeleri kullan.',
        maddeler: [
          'Veri bilgilendirir, hikaye harekete geçirir; duyguya dokunan hikaye akılda kalır.',
          'Kendi hikayen: "Neredeydim → ne oldu → şimdi neredeyim." Kısa ve gerçek olsun.',
          'Üçüncü kişi hikayesi: kendi durumuna benzeyen birinin başarısı güçlü köprüdür.',
          'Abartma; gerçek ve mütevazı hikaye, mükemmel ama inanılmaz hikayeden güçlüdür.',
          'Her hikayeyi bir derse bağla: "Bundan öğrendiğim şuydu..."',
        ],
      },
      {
        id: 'i8',
        baslik: 'Takipte En Sık 5 Hata',
        emoji: '⚠️',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Satışların çoğu takipte kazanılır ya da kaybedilir — bu hatalardan kaçın.',
        maddeler: [
          'Hata 1: Hiç takip etmemek. → İlk "hayır" çoğu zaman "henüz değil" demektir.',
          'Hata 2: Sadece "ne düşündün?" yazmak. → Değer ekle: yeni bilgi, hikaye veya soru.',
          'Hata 3: Çok sık ve baskıcı olmak. → Ritmi koru, ısrarcı değil tutarlı ol.',
          'Hata 4: Takip tarihi belirlememek. → Her temasta "ne zaman tekrar konuşalım?" diye netleştir.',
          'Hata 5: Takibi kafadan yürütmek. → Sistemle takip et; kimse aklında kalmasın, kayıtta kalsın.',
        ],
      },
    ],
  },
  {
    id: 'davet',
    baslik: 'Davet & Aday Bulma',
    emoji: '🎯',
    renk: 'bg-[#F0F9FF] dark:bg-[#0c1a2e] text-[#0369A1] dark:text-[#38bdf8] border-[#BAE6FD] dark:border-[#0369a130]',
    konular: [
      {
        id: 'd1',
        baslik: 'Geniş Aday Listeni Nasıl Çıkarırsın?',
        emoji: '📋',
        sure: '7 dk',
        seviye: 'Temel',
        ozet: '"Kimseyi tanımıyorum" neredeyse hiç gerçek değildir — hafıza egzersizi ile liste 100\'ü geçer.',
        maddeler: [
          '"Kimseyi tanımıyorum" neredeyse hiç gerçek değildir — liste egzersizi bunu kanıtlar.',
          'İş çevresi: eski meslektaşlar, müşteriler, tedarikçiler.',
          'Sosyal çevre: okul arkadaşları, hobi grupları, spor arkadaşları.',
          'Dijital çevre: Instagram takipçileri, WhatsApp grupları, LinkedIn bağlantıları.',
          'İnsanları zihinsel olarak önceden reddetme — bu onların kararı, senin değil.',
        ],
      },
      {
        id: 'd2',
        baslik: 'Davet Sanatı: Tekliften Önce Merak',
        emoji: '🧲',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Çoğu davet erken teklif yüzünden başarısız olur — önce merak uyandır, sonra davet et.',
        maddeler: [
          'Çoğu davet başarısız olur çünkü çok erken teklif sunulur — önce merak uyandır.',
          '3 adım: 1) Gerçek bağlantı kur: "Ne yapıyorsun şu sıralar?" 2) Merak: "Buna bir bakmanı isterim." 3) Düşük baskı: "Sana göre olmayabilir, ama bir bak."',
          'Kaçın: "Muhteşem fırsat" abartısı, "Para kazanmak ister misin?" tuzağı, "Hayatın değişecek" vaadi.',
          'İnsanlar fikir satın almaktan hoşlanır ama satış yapıldığını hissetmekten nefret eder.',
          'Merak yarat; onların sana gelmesine izin ver.',
        ],
      },
      {
        id: 'd3',
        baslik: 'WhatsApp İlk Mesaj Senaryoları',
        emoji: '💬',
        sure: '8 dk',
        seviye: 'Temel',
        ozet: 'Bu taslakları kişiselleştirerek kullan — genel toplu mesaj gönderme.',
        maddeler: [
          'Her mesajı kişiselleştir: isim + gerçek bir bağlantı noktası kullan.',
          'Senaryo 1 (uzun görüşmemişsin): "Merhaba [İsim], dün aklıma geldin. Nasılsın?"',
          'Senaryo 2 (eski iş arkadaşı): "Eski şirketten düşünüyorum. Her şey nasıl gidiyor?"',
          'Senaryo 3 (ek gelir istemişti): "Bir ara ek gelir istediğinden bahsetmiştin, hala aklında mı?"',
          'Asla toplu spam mesaj gönderme — 1\'e 1 hissettiren kişisel mesaj çalışır.',
        ],
      },
      {
        id: 'd4',
        baslik: 'Soğuk Pazar vs Sıcak Pazar',
        emoji: '🌡️',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Sıcak pazar güvenle başlar, soğuk pazar beceri ister — ikisini doğru sırada kullan.',
        maddeler: [
          'Sıcak pazar: seni tanıyan ve güvenen kişiler — en kolay ve doğru başlangıç noktası.',
          'Soğuk pazar: tanımadığın kişiler (sosyal medya, tavsiye) — beceri ve sistem gerektirir.',
          'Yeni başlayan önce sıcak pazardan deneyim ve özgüven kazanmalı.',
          'Soğuk pazarda önce değer ver ve bağ kur; ilk mesajda teklif sunma.',
          'İkisi de tükenmez: sıcak liste tavsiyelerle, soğuk pazar içerikle sürekli beslenir.',
        ],
      },
      {
        id: 'd5',
        baslik: 'Tavsiye (Referans) İsteme Sanatı',
        emoji: '🔗',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Listen tavsiyelerle hiç bitmez — "hayır" diyenden bile referans alınır.',
        maddeler: [
          'Her görüşmenin sonunda tavsiye iste; en güçlü aday kaynağı memnun kişilerdir.',
          '"Hayır" diyene de sor: "Bu sana göre değil, peki tanıdığın doğru kişi olabilir mi?"',
          'Spesifik sor: "Çevreni düşün — ek gelir arayan veya yeni bir şeye açık biri var mı?"',
          'Tavsiye edeni köprü yap: "Beni ona kısaca tanıtır mısın?" sıcak giriş sağlar.',
          'Tavsiyeyle gelen adaya, tavsiye edeni överek (edification) yaklaş.',
        ],
      },
      {
        id: 'd6',
        baslik: 'Edification: Mentorunu ve Aracı Yükselt',
        emoji: '⭐',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Edification, üçüncü taraf otoritesini överek güveni hızla transfer etme sanatıdır.',
        maddeler: [
          'Edification = bir kişiyi/aracı, görüşmeden önce olumlu şekilde takdim etmek.',
          '"Seni çok deneyimli bir liderle tanıştıracağım; onun anlattıkları benden çok daha net."',
          'Kendini küçültme; mentorunu yücelt — bu güveni sana değil sisteme bağlar.',
          'Araçları da yücelt: "Bu kısa videoyu bir izle, her şeyi çok güzel özetliyor."',
          'Edification duplike olur: ekibin de seni yücelttiğinde otoriten katlanır.',
        ],
      },
      {
        id: 'd7',
        baslik: 'Etkinliğe ve Toplantıya Davet',
        emoji: '🎟️',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Etkinlikler kararı hızlandırır — davetin amacı bilgi vermek değil, katılımı sağlamaktır.',
        maddeler: [
          'Davetin tek amacı: kişiyi etkinliğe/sunuma getirmek — telefonda tüm işi anlatma.',
          'Merak yarat, detayı sakla: "Anlatmak yerine görmeni istiyorum, 30 dakikanı ayırır mısın?"',
          'Net gün ve saat ver; "müsait olunca" değil, "Salı 20:00 uygun mu?" diye kapat.',
          'Etkinlik enerjisi ve sosyal kanıt, bireysel anlatımdan çok daha ikna edicidir.',
          'Katılım teyidi al ve hatırlatma yap; gelmeyen için nazikçe yeniden planla.',
        ],
      },
      {
        id: 'd8',
        baslik: 'Rol Oyunu: Davet Diyaloğu Pratiği',
        emoji: '🎭',
        sure: '7 dk',
        seviye: 'Orta',
        ozet: 'Daveti ezberle değil, prova ederek doğallaştır — örnek diyaloğu sesli tekrarla.',
        maddeler: [
          'Aday: "Ne işi bu, anlatsana?" → Sen: "Telefonda hakkını veremem; 20 dakikalık kısa bir görüşmede göstereyim, fikrini merak ediyorum."',
          'Aday: "Şu an çok meşgulüm." → Sen: "Tam da bu yüzden esnek bir şey; bu hafta 2 günün var mı, sana göre olanı seçelim."',
          'Aday: "Bu o satış işlerinden mi?" → Sen: "Haklı bir soru; birlikte bakıp kendi kararını ver — uymazsa \'bana göre değil\' demen çok normal."',
          'Bir arkadaşınla bu üç senaryoyu sesli prova et; takıldığın yeri not al.',
          'Amaç ezber değil, doğallık; kendi cümlelerinle ama aynı çerçeveyle konuş.',
        ],
      },
    ],
  },
  {
    id: 'sunum',
    baslik: 'Sunum & Kapanış',
    emoji: '🎤',
    renk: 'bg-[#FFF7ED] dark:bg-[#2a1500] text-[#9A3412] dark:text-[#fb923c] border-[#FED7AA] dark:border-[#9a341230]',
    konular: [
      {
        id: 'sk1',
        baslik: '20 Dakikada Etkili Sunum: T-S-P-O-C',
        emoji: '📊',
        sure: '10 dk',
        seviye: 'Orta',
        ozet: 'Uzun sunumlar yerine beş parçalı T-S-P-O-C arki: güven, durum, plan, fırsat ve davet.',
        maddeler: [
          'T (Güven, 0-3 dk): Anlat değil, dinle — "Şu an en çok ne önemli senin için?"',
          'S (Durum, 3-7 dk): Onların sözünü kullanarak acı noktasını yansıt — anlaşıldıklarını hissettir.',
          'P (Plan, 7-13 dk): Ürün/fırsatı, durumlarına doğrudan cevap olarak sun; özellik değil fayda.',
          'O (Fırsat, 13-17 dk): Somut ve belgelenebilir değişimi hayalleştir — abartma.',
          'C (Davet, 17-20 dk): Büyük karar değil, tek küçük adım — "10 gün dene" veya "Bir zoom\'a gel."',
        ],
      },
      {
        id: 'sk2',
        baslik: 'Kapanışın 5 Tekniği',
        emoji: '🔐',
        sure: '8 dk',
        seviye: 'Orta',
        ozet: 'Kapanış zorlamak değil, karar vermeyi kolaylaştırmaktır — baskısız beş saha tekniği.',
        maddeler: [
          '1-10 Ölçeği: "1-10 arası neredesin?" → 4-7 ise: "Seni 10\'dan ne tutuyor?"',
          '"Eğer... olsaydı..." sorusu: "Zaman engel olmasa ilerler miydin?" — gerçek engeli yüzeye çıkar.',
          'Sessizlik tekniği: teklifi yap, sus ve bekle. Konuşmak için üretilen baskı genellikle satın alma değil, direnç üretir.',
          'Sonraki adım kapanışı: "Her şeyi şimdi karara bağlamanı değil, sadece bir küçük adım atmayı kastediyorum."',
          'Özet + davet: 3 faydayı özetle, düşük riskli tek bir aksiyon öner.',
        ],
      },
      {
        id: 'sk3',
        baslik: 'İtiraz Karşılama: Hisset–Hissetmiş–Buldu & DDSID',
        emoji: '🧩',
        sure: '10 dk',
        seviye: 'Orta',
        ozet: 'İtirazı duy, savunmaya geçme, önce gerçek endişeyi bul, sonra hikâyeyle ilerle.',
        maddeler: [
          'Hisset–Hissetmiş–Buldu: duyguyu yansıt → benzer deneyimi hatırlat → üçüncü kişi örneğiyle ilerle.',
          'Soğan soyma: Dur → Yumuşak onay ("Haklısın, önemli") → Derinleştir ("Bu endişenin kaynağı ne?") → Sabitle.',
          'DDSID: Durdur → Doğrula → Sor → İkna değil Hikâye → Davet.',
          'İlk cümlede tartışmaya girme; ezberlenmiş robot cevap verme.',
          'Abartılı gelir iddiasından kaçın; kısa ve gerçek bir kişisel hikaye kullan.',
        ],
      },
      {
        id: 'sk4',
        baslik: 'Üçlü Görüşme (Three-Way Call)',
        emoji: '👥',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Üçlü görüşme, mentorunun otoritesini adayına transfer eden en güçlü duplikasyon aracıdır.',
        maddeler: [
          'Üçlü görüşme: sen + mentorun + aday — deneyimli kişi soruları yanıtlar, sen öğrenirsin.',
          'Önce mentorunu yücelt (edification), sonra bağlantıyı kur; otorite transfer olur.',
          'Görüşmede çoğunlukla dinle; araya girip mentorunun sözünü kesme.',
          'Aday için güven verir, senin için canlı eğitimdir — her görüşmede bir şey öğrenirsin.',
          'Ekibine de öğret: üçlü görüşme duplike olunca ekip mentordan bağımsız büyür.',
        ],
      },
      {
        id: 'sk5',
        baslik: 'Araçların Gücü: Üçüncü Taraf Doğrulama',
        emoji: '🧰',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Araçlar konuşsun, sen köprü ol — video/PDF/örnek, ikna yükünü senden alır ve duplike olur.',
        maddeler: [
          'Araç (video, PDF, kısa sunum) tutarlı mesaj verir ve duygudan etkilenmez.',
          '"Sen konuşma, araç konuşsun" — bu hem yorgunluğu azaltır hem duplikasyonu kolaylaştırır.',
          'Yeni başlayan bile araçla profesyonel sunum yapabilir; bilgi eksikliği engel olmaz.',
          'Üçüncü taraf doğrulama (bağımsız yorum, belge) senin sözünden daha ikna edicidir.',
          'Aracı kısa tut ve takip et: "İzledikten sonra aklına takılanı birlikte konuşalım."',
        ],
      },
      {
        id: 'sk6',
        baslik: 'Takip Sıralaması: Servet Takipte Gizli',
        emoji: '🔁',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Satışların çoğu ilk temasta değil, planlı takip dizisinde kapanır.',
        maddeler: [
          'Kararların büyük kısmı birkaç temas sonrası verilir; tek dokunuşta kapanış nadirdir.',
          'Sıralama örneği: 1. gün teşekkür + araç → 2. gün soru → 4. gün hikaye → 7. gün net davet.',
          'Her takipte değer ekle; sadece "ne düşündün?" değil, yeni bir bilgi veya soru getir.',
          'Takip tarihini her zaman netleştir ve sistemle hatırla — unutmak fırsat kaybıdır.',
          '"Hayır" alana bile ilişkiyi koru; bugünün "hayır"ı 6 ay sonra "evet" olabilir.',
        ],
      },
      {
        id: 'sk7',
        baslik: 'Rol Oyunu: İtiraz Karşılama Pratiği',
        emoji: '🎭',
        sure: '7 dk',
        seviye: 'İleri',
        ozet: 'İtiraz karşılamayı Hisset–Hissetmiş–Buldu çerçevesiyle prova ederek refleks haline getir.',
        maddeler: [
          'Çerçeve: Anlıyorum (hisset) → Ben/başkası da böyle hissetti (hissetmiş) → Şöyle çözdük (buldu).',
          '"Vaktim yok" → "Anlıyorum, ben de tam zamanlı çalışırken başladım; haftada 3 saatle ritim kurduk."',
          '"Param yok" → "Çok yaygın; resmi en küçük başlangıç seçeneğine birlikte bakalım, baskı yok."',
          'Bir arkadaşınla en sık 3 itirazı sesli prova et; tonun savunmacı değil sakin olsun.',
          'Amaç tartışmayı kazanmak değil, kişinin gerçek endişesini açığa çıkarıp birlikte çözmek.',
        ],
      },
    ],
  },
  {
    id: 'ekip',
    baslik: 'Ekip & Liderlik',
    emoji: '👥',
    renk: 'bg-[#FAEEDA] dark:bg-[#3a2200] text-[#854F0B] dark:text-[#fbbf24] border-[#F6E4C4] dark:border-[#3a220080]',
    konular: [
      {
        id: 'e1',
        baslik: 'Ekip Kurmak: İlk Adımlar',
        emoji: '🏗️',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Sıfırdan bir ekip inşa etmenin sağlam temelleri.',
        maddeler: [
          'Herkesi değil, doğru insanı ara: hırslı, iletişime açık, güvenilir.',
          'İlk 2–3 kişini doğru seç — onlar kültürünü belirler.',
          'Yeni üyeye ilk 48 saat kritik: hemen aksiyon almasını sağla.',
          'Mentor değil, model ol: kendin yapmazsan ekibin yapmaz.',
          'Duygusal destek ve teknik koçluk arasındaki dengeyi kur.',
        ],
      },
      {
        id: 'e2',
        baslik: 'Çoğaltma: Sistemle Büyümek',
        emoji: '🔄',
        sure: '8 dk',
        seviye: 'İleri',
        ozet: 'Sen olmadan da büyüyen bir ekip nasıl inşa edilir.',
        maddeler: [
          'Çoğaltma: başkasının yapabildiği şeyi sisteme bağlamak.',
          'Tek bir süper yıldıza bağlı ekip kırılgandır; sistem güçlü olmalı.',
          '"Eğitimimi ver, git kendi kendin çalış" formülü çalışır.',
          'Her üye kendi 2–3 kişisini bulana kadar destek ver.',
          'Büyük liderler ekibini bağımlı değil, bağımsız yapar.',
        ],
      },
      {
        id: 'e3',
        baslik: 'İlk 5 Ekip Üyeni Nasıl Seçersin?',
        emoji: '🔎',
        sure: '9 dk',
        seviye: 'Orta',
        ozet: 'Kolay üye değil, doğru üye bulmak — ilk 5 kişi kültürünü belirler.',
        maddeler: [
          'Herkesi değil, doğru kişiyi ara: hırslı, koçlanabilir, güvenilir.',
          'Aday değerlendirme soruları: Bu kişi sahada çalışır mı? Öğrenmeye açık mı? Sözünü tutar mı?',
          'İlk 5, ekip kültürünü belirler — seçimde aceleci olma.',
          'İlk üye: yakın çevrenden, hazır ve motive olan biri. Sonraki üyeler farklı ağlardan.',
          'Kolay üye bulmak değil, doğru üye bulmak öncelik.',
        ],
      },
      {
        id: 'e4',
        baslik: 'Duplikasyon Sistemi: Seni Değil, Sistemi Kopyalat',
        emoji: '📡',
        sure: '10 dk',
        seviye: 'İleri',
        ozet: 'Duplikasyon, kişisel karizmanı değil, tekrarlanabilir bir sistemi ekibine aktarmaktır.',
        maddeler: [
          'Duplikasyon: senin yapabildiğini sisteme bağlamak, başkasının da yapabilmesi için.',
          'En basit başlangıç akışını tek A4\'e sığdır ve yeni üyeye anlat — geri anlattır.',
          'Tek süper yıldıza bağlı ekip kırılgandır — sisteme bağlı ekip güçlüdür.',
          '"Eğitimimi ver, git kendi kendin çalış" formülü sürdürülebilir büyüme sağlar.',
          'Büyük liderler ekibini bağımlı değil, bağımsız yapar.',
        ],
      },
      {
        id: 'e5',
        baslik: 'Hızlı Başlangıç: Yeni Üyenin İlk 48 Saati',
        emoji: '🚀',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Yeni üyenin ilk 48 saati, kalıcılığını belirler — hızlı bir kazanım her şeyi değiştirir.',
        maddeler: [
          'İlk heyecan en yüksektir; bu enerjiyi ilk 48 saatte somut bir aksiyona dönüştür.',
          'Birlikte yapılacaklar: aday listesi çıkar, ilk 3 davet, ürünü deneyimle, hedefi yaz.',
          'Erken küçük bir başarı (ilk "evet" veya ilk satış) bağlılığı kalıcı kılar.',
          'Net bir başlangıç kontrol listesi ver; belirsizlik en büyük bırakma sebebidir.',
          'İlk hafta sık temasta ol; yalnız bırakılan yeni üye hızla soğur.',
        ],
      },
      {
        id: 'e6',
        baslik: 'Örnek Ol: Liderlik Duruşu',
        emoji: '🧭',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Ekip senin söylediğini değil, yaptığını kopyalar — duruşun kültürü belirler.',
        maddeler: [
          'Duplikasyon davranışla olur: ekibinden istediğin neyse, önce sen tutarlı şekilde yap.',
          'Liderin sakin ve istikrarlı duruşu, baskı anında ekibe panik değil yön yayar.',
          '"Yap dediğimi değil, yaptığımı yap" çalışmaz; örnek olmak tek gerçek öğretmendir.',
          'Zor zamanlarda şikayet değil çözüm modeli ol; ekip senin enerjini yansıtır.',
          'Kendi aktiviteni asla bırakma; aktif olmayan lider, aktif ekip kuramaz.',
        ],
      },
      {
        id: 'e7',
        baslik: 'Tanıma ve Takdir Kültürü',
        emoji: '🏆',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'İnsanlar takdir için para kadar çalışır — küçük başarıları görünür kıl.',
        maddeler: [
          'Tanınma temel insani ihtiyaçtır; takdir edilen üye daha çok çalışır ve kalır.',
          'Sadece büyük sonuçları değil, ilk adımları da kutla: ilk davet, ilk sunum, ilk satış.',
          'Herkesin önünde takdir et; özelde değil, ekip grubunda görünür kıl.',
          'Spesifik ol: "Harikasın" değil, "Bu hafta 10 yeni temas — disiplinin örnek."',
          'Rozet, seviye, küçük ödüller — oyunlaştırma motivasyonu sürekli kılar.',
        ],
      },
      {
        id: 'e8',
        baslik: 'Online Ekip Yönetimi',
        emoji: '💻',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Coğrafya artık engel değil — online araçlarla farklı şehirlerde ekip kur ve yönet.',
        maddeler: [
          'Düzenli online toplantı (haftalık) ritim ve aidiyet yaratır; takvimde sabitle.',
          'Ekip grubu canlı tut: günlük motivasyon, başarı paylaşımı, soru-cevap.',
          'Eğitimi kaydet ve paylaş; yeni üye kendi hızında erişebilsin.',
          'Uzaktan da olsa birebir ilgi şart; herkesle ayrı kısa görüşmeler yap.',
          'Araç ve sistemi standartlaştır ki ekip nerede olursa olsun aynı şekilde çalışsın.',
        ],
      },
      {
        id: 'e9',
        baslik: 'Liderlikte En Sık 5 Hata',
        emoji: '⚠️',
        sure: '6 dk',
        seviye: 'İleri',
        ozet: 'İyi niyetli liderlerin bile düştüğü tuzaklar — farkındalık bunları önler.',
        maddeler: [
          'Hata 1: Ekibin işini üstlenmek. → Yap-göster-bırak; bağımlı değil bağımsız yetiştir.',
          'Hata 2: Sadece güçlü üyelerle ilgilenmek. → Yeni ve kararsızlara da zaman ayır.',
          'Hata 3: Takdiri unutmak. → Görünmeyen emek söner; düzenli tanıma şart.',
          'Hata 4: Kendi aktivitesini bırakmak. → Aktif olmayan lider güven ve örneklik kaybeder.',
          'Hata 5: Sistem yerine kişiye bağlı büyütmek. → Süreçleri standartlaştır, duplike et.',
        ],
      },
    ],
  },
  {
    id: 'strateji',
    baslik: 'Strateji & Büyüme',
    emoji: '📈',
    renk: 'bg-crown-subtle text-crown border-crown-subtle',
    konular: [
      {
        id: 's1',
        baslik: 'Günlük 5 Eylem Prensibi',
        emoji: '5️⃣',
        sure: '4 dk',
        seviye: 'Temel',
        ozet: 'Her gün sadece 5 eylem ile tutarlı büyüme.',
        maddeler: [
          '5 yeni kişiyle tanış veya eski biriyle tekrar konuş.',
          'Bir sunum veya bilgilendirme yap.',
          'Bir takip mesajı gönder.',
          'Ürününü kullan ve deneyimini not et.',
          'Bir şey öğren: video, podcast, kitap — 15 dakika yeter.',
        ],
      },
      {
        id: 's2',
        baslik: 'Sosyal Medyayı İş Aracına Dönüştürmek',
        emoji: '📱',
        sure: '7 dk',
        seviye: 'Orta',
        ozet: 'Spam değil, değer içeriğiyle organik büyüme.',
        maddeler: [
          'Ürün/fırsat paylaşımı değil, dönüşüm hikâyeleri paylaş.',
          '80/20 kuralı: %80 değer içeriği, %20 iş içeriği.',
          'DM stratejisi: sormadan önce ilgi göster, dinle, sonra davet et.',
          'Günde 1 story + haftada 2–3 gönderi sürdürülebilir hedeftir.',
          'Rakam + sonuç + duygu: "3 ayda X TL + ne hissettim" formülü güçlü.',
        ],
      },
      {
        id: 's3',
        baslik: '90 Günlük Başlangıç Planı',
        emoji: '🗓️',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'İlk 90 günde ne yapmalı, ne yapmamalı.',
        maddeler: [
          '1–30. gün: Öğren, dene, listeyi yaz. Ürünü kendin kullan.',
          '31–60. gün: İlk 10 konuşmayı tamamla, ilk satışı veya üyeyi al.',
          '61–90. gün: İlk ekip üyeni mentor et, sistemi çoğalt.',
          'Bu dönemde tek odak: momentum kırmamak.',
          '90 günün sonunda bir değerlendirme yap ve bir sonraki 90 günü planla.',
        ],
      },
      {
        id: 's4',
        baslik: 'Instagram\'da Kişisel Marka Kurmak',
        emoji: '📸',
        sure: '7 dk',
        seviye: 'Orta',
        ozet: 'Instagram\'ı doğru kullanmak, sana gelen sıcak adaylar yaratır — spam değil, çekim merkezi ol.',
        maddeler: [
          'İçerik karması: 3 eğitici + 2 kişisel + 1 iş/ürün paylaşımı (3-2-1 kuralı).',
          'Spam DM atmak yerine doğal konuşmalar başlat — asla izinsiz toplu teklif gönderme.',
          'Çekim merkezi ol: insanlar seni izledikçe gün gelir sorarlar, o anda hazır ol.',
          'Kendi sesi, kendi yüzü, kendi hikayesi — başkasının içeriğini kopyalama.',
          'Takipçilerle gerçek ilişki kur; içeriklerin kapı açar, sen orada hazır ol.',
        ],
      },
      {
        id: 's5',
        baslik: 'Sosyal Medyada YAPILMAYACAKLAR',
        emoji: '🚫',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'Hızlı referans: sosyal medyada seni yakacak hatalar ve doğruları. Sahada uygula.',
        maddeler: [
          '❌ Spam DM: hesabını ve güveni tehlikeye atar. ✅ Değer ver, bek, sorular gelince cevapla.',
          '❌ Sadece ürün/fırsat paylaşmak. ✅ 3-2-1 kuralı: 3 değer, 2 kişisel, 1 iş.',
          '❌ Abartılı kazanç paylaşımları. ✅ Şirketin onaylı, ölçülü dilini kullan.',
          '❌ Başkasının içeriğini kopyalamak. ✅ Kendi sesi, kendi yüzü, kendi hikayesi.',
          '❌ Olumsuz yorumlarla açık tartışmak. ✅ Özelden çöz veya kibarca geç.',
        ],
      },
      {
        id: 's6',
        baslik: 'İçerik Takvimi Oluştur',
        emoji: '🗓️',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Düzensiz paylaşım sonuç vermez — planlı bir içerik takvimi görünürlüğü sürekli kılar.',
        maddeler: [
          'Haftalık ritim belirle: ne, ne zaman, hangi formatta (story, post, video) paylaşacaksın.',
          'İçerik karışımı: %80 değer/yaşam/ilham, %20 iş/fırsat — sürekli satış kaçırır.',
          'Konu havuzu oluştur: ürün deneyimi, başarı hikayesi, günlük yaşam, eğitim, soru-cevap.',
          'Önceden hazırla ve planla; "an gelince" üretmek sürdürülebilir değildir.',
          'Etkileşimi ölç; hangi içerik tutuyorsa o yöne ağırlık ver.',
        ],
      },
      {
        id: 's7',
        baslik: 'Çekim Pazarlaması: İnsanların Sana Gelmesi',
        emoji: '🧲',
        sure: '7 dk',
        seviye: 'İleri',
        ozet: 'Kovalamak yerine değer üreterek insanların sana gelmesini sağla.',
        maddeler: [
          'Çekim pazarlaması: önce değer ver, otorite ve güven inşa et; talep kendiliğinden gelir.',
          'Sorun çözen içerik üret; insanlar yardımcı olanı takip eder ve ona güvenir.',
          'Kişisel marka = "neyle tanınıyorsun?"; net bir niş ve mesaj seç.',
          'Sosyal kanıt biriktir: deneyimler, dönüşümler, yorumlar güveni hızlandırır.',
          'Çekim yavaş ama bileşik büyür; bugün ektiğin içerik aylarca aday getirir.',
        ],
      },
      {
        id: 's8',
        baslik: 'Etkinliklerin Gücü',
        emoji: '🎤',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Etkinlikler kararı hızlandırır, ekibi ateşler — "etkinliğe götüren kazanır" derler.',
        maddeler: [
          'Etkinlik enerjisi ve sosyal kanıt, bireysel anlatımdan çok daha ikna edicidir.',
          'Yerel toplantı, online sunum, şirket konvansiyonu — her birinin ayrı bir gücü var.',
          'Ekibini büyük etkinliklere taşı; orada alınan kararlar kalıcı bağlılık yaratır.',
          'Adayını etkinliğe getir: tek kişilik anlatım yerine topluluğun ivmesinden yararlan.',
          'Etkinlik sonrası 24-48 saat içinde takip et; coşku tazeyken aksiyon kolaydır.',
        ],
      },
      {
        id: 's9',
        baslik: 'Zaman Bloklama ve Verimlilik',
        emoji: '⏱️',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Yarı zamanlı çalışıyorsan zamanı yönetmek zorundasın — blokla, dağılma.',
        maddeler: [
          'Belirli saatleri "iş bloğu" olarak ayır; bu blokta sadece gelir getiren aksiyon yap.',
          'Gelir getiren aktiviteye odaklan: davet, takip, sunum — geri kalan ikincildir.',
          'Bildirimleri kapat; 30-60 dakikalık odak blokları dağınık 3 saatten verimlidir.',
          'Günü önceden planla: akşam ertesi günün 3 önemli aksiyonunu yaz.',
          'Hazırlık ile üretimi karıştırma; sonsuz "öğrenme" çoğu zaman erteleme kılığındadır.',
        ],
      },
      {
        id: 's10',
        baslik: 'Sayılarla Yönetim: KPI Takibi',
        emoji: '📊',
        sure: '6 dk',
        seviye: 'İleri',
        ozet: 'Ölçmediğini yönetemezsin — doğru sayıları takip et, duyguya göre değil veriye göre ilerle.',
        maddeler: [
          'Aktivite metriklerini izle: yeni temas, davet, sunum, takip, yeni üye sayısı.',
          'Sonuç değil aktiviteyi yönet; aktivite senin kontrolünde, sonuç onun doğal çıktısı.',
          'Dönüşüm oranlarını bil: kaç temas → kaç sunum → kaç "evet"; darboğazı gör.',
          'Haftalık gözden geçir: hedef vs gerçekleşen; eksik nerede, fazlalık nerede.',
          'Sayılar duygusal dalgalanmayı keser; kötü bir gün bile veride küçük bir noktadır.',
        ],
      },
      {
        id: 's11',
        baslik: 'Yapay Zeka Araçlarıyla NM',
        emoji: '🤖',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Yapay zeka emeğinin yerini almaz ama hızını katlar — doğru yerde akıllıca kullan.',
        maddeler: [
          'İçerik fikri, başlık ve taslak üretiminde YZ zaman kazandırır; sen kişiselleştir.',
          'Mesaj ve itiraz cevaplarını YZ ile tonla; ama gönderdiğin her şeyi insan gibi gözden geçir.',
          'YZ ile araştır: ürün/sektör sorularına hızlı, doğrulanmış cevaplar hazırla.',
          'Otomasyonu bağ kurmanın yerine koyma; ilişki insandan insana büyür.',
          'Etik sınır: YZ üretimi gerçeği abartmamalı, sahte deneyim veya gelir vaadi olmamalı.',
        ],
      },
    ],
  },
  {
    id: 'uyum',
    baslik: 'Uyum & Etik',
    emoji: '⚖️',
    renk: 'bg-[#F0FDF4] dark:bg-[#052e16] text-[#166534] dark:text-[#86efac] border-[#BBF7D0] dark:border-[#16653430]',
    konular: [
      {
        id: 'ue1',
        baslik: 'Türkiye\'de Doğrudan Satış: Özet Çerçeve',
        emoji: '🏛️',
        sure: '8 dk',
        seviye: 'Temel',
        ozet: 'Yasal sınırları bilmek seni hem korur hem güvenilir yapar — genel çerçeve.',
        maddeler: [
          'Sağlık ürünlerinde: tanı/tedavi vaadi, garanti sonuç ve "kesin iyileşir" ifadeleri yüksek risk taşır.',
          'Meşru iş için kontrol: Gerçek müşteriye satılan ürün var mı? Kazanç vaadi belgelenebilir mi?',
          'Piramit belirtisi: ürün yok veya sembolik; gelir çoğunlukla kayıttan besleniyor.',
          'Abartılı kazanç, garanti sağlık sonucu ve belgesiz "onaylıdır" iddialarından kaçın.',
          'Bu özet genel çerçevedir; detay için şirketinin uyum kaynaklarına başvur.',
        ],
      },
      {
        id: 'ue2',
        baslik: 'Sağlık Ürünleri: Söylenebilen / Söylenemeyen',
        emoji: '🩺',
        sure: '4 dk',
        seviye: 'Temel',
        ozet: 'Yasal açıdan güvende kalmak için hızlı referans — hangi cümleleri kullanabilir, hangilerinden kaçınmalısın.',
        maddeler: [
          '✅ Söylenebilir: "Bende şu etkiyi yaptı", "Deneyimimi paylaşabilirim", "Sertifika bilgisini verebilirim".',
          '❌ Söylenemez: "Hastalığı iyileştirir", "Kesinlikle işe yarar", "Doktor onaylıdır" (belgesiz).',
          'Kişisel sonuç ≠ herkes için garanti — bunu her zaman belirt.',
          '"Kendi deneyimim şuydu..." ile başla; tıbbi iddia ve garantiden kaçın.',
          'Şirketinin onay aldığı ifade kalıplarını kullan.',
        ],
      },
      {
        id: 'ue3',
        baslik: 'Dijital Paylaşım ve Beyanlar: Kısa Kontrol',
        emoji: '📲',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Profil, hikaye ve mesajda güvende kal — kazanç, sağlık ve kişisel veri için temel hatırlatmalar.',
        maddeler: [
          'Kazanç: "X sürede Y kazanç" iddiası hem güven hem uyum riski taşır — ölçülü dil kullan.',
          'Sağlık: "Kendi deneyimim şuydu..." ile başla; tıbbi iddia ve garantiden kaçın.',
          'KVKK: İzinsiz kişisel veri paylaşma; gereksiz kişi listesi aktarımı yok.',
          'Mesafeli satış: Şirketinin sipariş ve cayma sürecini doğru anlat.',
          'Şeffaf, ölçülü, şirket uyumuna yakın dil → uzun vadeli güven.',
        ],
      },
      {
        id: 'ue4',
        baslik: 'Gelir Beyanı Etiği',
        emoji: '💬',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: 'Gelir konusunda dürüstlük hem yasal zorunluluk hem de uzun vadeli güvenin temelidir.',
        maddeler: [
          'Tipik olmayan sonuçları "tipik" gibi sunma; istisnai kazanç vaadi yanıltıcıdır.',
          'Gerçek rakam ver veya hiç verme; "ayda şu kadar kazanırsın" garantisi etik değildir.',
          'Kazancın emeğe, beceriye ve döneme göre değiştiğini açıkça söyle.',
          'Şirketin resmi kazanç beyanı belgelerine yönlendir; kendi iddianı değil belgeyi konuştur.',
          'Abartı kısa vadede heyecan, uzun vadede güven kaybı ve hayal kırıklığı yaratır.',
        ],
      },
      {
        id: 'ue5',
        baslik: 'Spam ve İstenmeyen Mesaj Sınırları',
        emoji: '🚫',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'Toplu, istenmeyen mesaj hem markanı yıpratır hem yasal risk doğurur — izinli iletişim kur.',
        maddeler: [
          'Asla toplu kopyala-yapıştır mesaj atma; 1\'e 1 hissettiren kişisel mesaj çalışır.',
          'Önce bağ kur, izin al: "Bununla ilgili sana bir şey göndermemi ister misin?"',
          'Kişisel veri ve iletişim izni konusunda KVKK çerçevesine saygılı ol.',
          'Tanımadığın kişiye ilk mesajda link/teklif yağdırma; önce gerçek ilgi göster.',
          'Kalite > miktar: 10 kişiyle gerçek sohbet, 100 spam mesajdan çok daha verimlidir.',
        ],
      },
    ],
  },
  {
    id: 'urun',
    baslik: 'Ürün & Şirket',
    emoji: '🏢',
    renk: 'bg-[#FAF5FF] dark:bg-[#1a0030] text-[#6B21A8] dark:text-[#d8b4fe] border-[#E9D5FF] dark:border-[#6b21a830]',
    konular: [
      {
        id: 'us1',
        baslik: 'Şüpheden İnanca: Ürünü Deneyimleyen Distribütörün Hikayesi',
        emoji: '✨',
        sure: '8 dk',
        seviye: 'Orta',
        ozet: 'Ürüne inanmadan bu işe başlamak hem sürdürülemez hem etik değildir — kendi hikayeni bul.',
        maddeler: [
          'Ürüne inanmadan bu işi yapmak hem sürdürülemez hem de etik değildir.',
          'Ürünü kendin ve ailenle kullan; 30 gün boyunca sonuçları not al.',
          '"Bende şu etkiyi yaptı; senin deneyimin farklı olabilir" — senaryo değil, gerçek hikaye.',
          'Ürün deneyimi satış tekniğinin yerini tutar; hikayeniz varsa script\'e gerek azalır.',
          'Etik inanç = sürdürülebilir iş. İnanmadığın bir şeyi satmak yorucu ve çöküşe neden olur.',
        ],
      },
      {
        id: 'us2',
        baslik: 'Şirketi Tanımak: Güveni İnşa Etmenin Temeli',
        emoji: '🔬',
        sure: '7 dk',
        seviye: 'Temel',
        ozet: 'Adayların güven soruları şirkete yönelir — bu soruları cevaplamak güven inşasıdır.',
        maddeler: [
          'Adaylar güvensizlik hissettiklerinde soruları şirkete yönelir — bu soruları cevaplamak güven inşasıdır.',
          'Bilmen gereken 5 alan: kuruluş tarihi, ürün portföyü, yasal kayıtlar, kompanzasyon planı şeffaflığı, destek altyapısı.',
          'Adayı birincil kaynağa yönlendir: "Buraya bak, bu sayfada var."',
          'Bağımsız kaynaklardaki değerlendirmeleri oku; yalnızca şirketin anlattıklarına güvenme.',
          'Bilgili distribütör = güvenilir distribütör.',
        ],
      },
      {
        id: 'us3',
        baslik: 'Ürün Hikayeni Oluştur',
        emoji: '📣',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Özellik değil dönüşüm sat — ürünün sende yarattığı gerçek değişimi anlat.',
        maddeler: [
          'İnsanlar özellik değil sonuç satın alır: "ne içeriyor" değil, "hayatımı nasıl değiştirdi".',
          'Hikaye yapısı: Önceki durum → ürünle tanışma → bugünkü fark.',
          'Kendi deneyimin en güçlü pazarlamadır; 30 gün kullan, somut gözlemlerini not al.',
          'Abartma ve sağlık iddiasından kaçın; gerçek ve mütevazı hikaye daha inandırıcıdır.',
          'Görsel ekle: öncesi/sonrası, günlük kullanım, samimi paylaşım güveni artırır.',
        ],
      },
      {
        id: 'us4',
        baslik: 'Otomatik Sipariş/Aboneliğin Mantığı',
        emoji: '🔄',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Düzenli tüketim, sürdürülebilir iş ve sadık müşteri demektir — mantığını doğru anlat.',
        maddeler: [
          'Sürekli tüketilen ürün = istikrarlı ciro = sürdürülebilir iş; tek seferlik satış kırılgandır.',
          'Otomatik sipariş kullanıcıya da fayda: indirim, kesintisiz tedarik, zaman tasarrufu.',
          'Önce kendin sadık tüketici ol; kullanmadığın ürünün düzenli tüketimini savunamazsın.',
          'Müşteriye baskı değil değer sun; ihtiyacına uygun, esnek ve iptal edilebilir olduğunu belirt.',
          'Sadık müşteri tabanı, ek üye olmadan da düzenli gelir sağlayan en sağlam temeldir.',
        ],
      },
      {
        id: 'us5',
        baslik: 'Müşteri Sadakati ve Tekrar Satış',
        emoji: '💚',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Asıl kazanç ilk satışta değil, tekrar eden mutlu müşteridedir — satış sonrası ilgilen.',
        maddeler: [
          'Yeni müşteri bulmak, mevcut müşteriyi elde tutmaktan çok daha pahalıdır.',
          'Satış sonrası takip et: "Ürünü nasıl kullanıyorsun, bir sorun var mı?" — ilgi sadakat yaratır.',
          'Doğru kullanımı öğret; yanlış kullanan müşteri sonuç alamaz ve ayrılır.',
          'Mutlu müşteri hem tekrar alır hem de en güçlü tavsiye (referans) kaynağındır.',
          'Bazı müşteriler zamanla iş ortağına dönüşür; iyi müşteri ilişkisi ekibinin tohumudur.',
        ],
      },
    ],
  },
  {
    id: 'blog',
    baslik: 'Blog',
    emoji: '📰',
    renk: 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc] border-[#E0E7FF] dark:border-[#312e8130]',
    konular: [
      {
        id: 'blog-ilk-90-gun',
        baslik: 'İlk 90 Gün: Çoğu İnsan Neden Bırakır?',
        emoji: '🗓️',
        sure: '7 dk okuma',
        seviye: 'Temel',
        ozet: 'Yeni başlayanların büyük kısmı ilk üç ayda pes eder. Sebep yetenek değil, yanlış beklenti. İşte kalanların yaptığı fark.',
        format: 'article',
        maddeler: [
          'Çoğu kişi ilk 90 günde yanlış beklenti yüzünden bırakır.',
          'İlk hedef para değil, alışkanlık ve ritim olmalı.',
          'Reddedilme kişisel değildir; sayı oyununun doğal parçasıdır.',
          'Küçük ama her gün tekrarlanan aksiyon, büyük ama düzensiz çabayı yener.',
        ],
        govde: `Network marketing'e başlayan her on kişiden yaklaşık yedisi ilk doksan günü tamamlamadan ayrılır. Bu istatistik insanı korkutmak için değil, tam tersine rahatlatmak için burada: çünkü bırakanların çoğu yeteneksiz olduğu için değil, yanlış bir beklentiyle başladığı için bırakır. Beklentiyi düzelttiğinde, o yüzde yetmişin dışında kalmak şaşırtıcı derecede kolaylaşır.

## Sorun para değil, zamanlama algısı

Yeni başlayan kişi genelde şunu düşünür: "Birkaç hafta içinde ciddi bir gelir göreceğim." Görmeyince hayal kırıklığına uğrar ve "demek ki bana göre değil" diyerek çıkar. Oysa bu işin doğası bir maraton gibidir; ilk aylar tohum ekme dönemidir, hasat değil. İlk doksan günde ölçmen gereken şey banka hesabın değil, kurduğun alışkanlıklardır.

## İlk 90 günde gerçekten önemli olan üç şey

- **Ritim:** Her gün küçük de olsa bir temas. Beş yeni kişiyle tanışmak, üç takip mesajı atmak, bir içerik paylaşmak. Miktar değil, sürekliliktir önemli olan.
- **Dayanıklılık:** Reddedilmeyi kişisel almamak. "Hayır" çoğu zaman "şu an değil" demektir ve senin değerinle ilgili bir yargı değildir.
- **Öğrenme:** Her görüşmeden sonra "ne işe yaradı, ne yaramadı" diye bir dakikalık not. Bu küçük refleks, üç ayın sonunda seni tanınmaz hale getirir.

## Reddedilmeyi yeniden çerçevele

Çoğu insan birkaç "hayır"dan sonra durur çünkü her reddi bir başarısızlık olarak kaydeder. Oysa deneyimli networker'lar reddi bir sayı oyununun parçası olarak görür. Diyelim ki yirmi görüşmeden biri ortaklığa dönüşüyor. O zaman aldığın her "hayır" seni o "evet"e bir adım yaklaştırır. Reddedilme bir engel değil, ilerleme göstergesidir.

> Bırakanlar genelde tam da işler dönmeye başlamadan hemen önce bırakır. Çünkü en zor kısım, henüz hiçbir sonuç görünmezken inanmaya devam etmektir.

## Doksanıncı günde kendine sor

Üç ayın sonunda kendine "ne kadar kazandım?" diye değil, şunları sor: Tutarlı bir günlük ritmim oluştu mu? Reddedilmeye karşı derim kalınlaştı mı? Her hafta birkaç yeni insan tanıyor muyum? Bu sorulara "evet" diyebiliyorsan, gelir zaten arkadan gelecektir — çünkü onu getirecek sistemi kurmuş olursun. Çoğu insanın asla ulaşamadığı şey, işte bu sabrın ödülüdür.`,
      },
      {
        id: 'blog-duplikasyon',
        baslik: 'Duplikasyon Sanatı: Kopyalanabilir Olmak',
        emoji: '🔁',
        sure: '8 dk okuma',
        seviye: 'İleri',
        ozet: 'Bir ekibi büyüten şey senin yeteneğin değil, ekibinin senin sistemini kolayca tekrarlayabilmesidir. Basitlik, karizmadan güçlüdür.',
        format: 'article',
        maddeler: [
          'Duplikasyon, ekibinin senin sistemini kolayca tekrarlayabilmesidir.',
          'Karmaşık ama etkileyici bir yöntem, basit ama kopyalanabilir bir yöntemden zayıftır.',
          'Sistemi yaz; "kafamda" olan hiçbir şey ölçeklenmez.',
          'Liderin işi yapmak değil, başkalarının yapmasını sağlamaktır.',
        ],
        govde: `Network marketing'te tek başına ne kadar iyi olduğun, ekibinin ne kadar büyüyeceğini belirlemez. Belirleyen şey, yaptığın işin ne kadar kolay kopyalanabildiğidir. Buna duplikasyon denir ve bu işi gerçekten ölçeklendiren tek kaldıraç budur.

## Neden en iyi satıcı en iyi lider değildir?

Çoğu zaman en parlak satıcı, en zayıf ekip lideridir. Sebebi şu: kendi karizmasına, kendi özel yeteneğine dayanan bir yöntem geliştirmiştir. Bu yöntem onun için harika çalışır ama kimse onu tekrar edemez. Yeni katılan biri o performansı görür, "ben bunu asla yapamam" der ve cesareti kırılır. Oysa sıradan ama herkesin tekrar edebileceği bir sistem, dahiyane ama kopyalanamaz bir sistemden çok daha fazla insan kazandırır.

## Basitlik bir stratejidir, eksiklik değil

Duplikasyonun kalbinde basitlik vardır. Sistemini öyle kur ki, üç gün önce katılan biri bile onu birine anlatabilsin:

- **Tek bir davet cümlesi:** Herkesin ezberleyebileceği, doğal bir davet.
- **Tek bir sunum yolu:** Standart bir video, bir araç, bir akış. Herkes aynı kapıdan girsin.
- **Tek bir takip ritmi:** "Ne zaman, ne söylenir" net olsun.

Karmaşıklık ego besler ama ekip öldürür. Bir yöntem ne kadar etkileyiciyse, o kadar az kopyalanır.

## "Kafamdaki" hiçbir şey ölçeklenmez

Eğer sistemin senin zihninde yaşıyorsa, ekibin senin kadar büyüyebilir — yani senin zamanınla sınırlı kalır. Bunu kırmanın yolu yazmaktır. Davet metnini yaz. İlk görüşme akışını yaz. Sık sorulan itirazlara cevapları yaz. Yazılı ve erişilebilir hale gelen her şey, sen orada olmasan bile çalışmaya devam eder.

> Liderin görevi işi en iyi yapan kişi olmak değil, en çok insanın işi yapmasını sağlayan kişi olmaktır.

## Kendini gereksiz kıl

Kulağa ters gelse de iyi bir liderin hedefi, ekibinin ona ihtiyaç duymadan ilerleyebilmesidir. Her soruya sen cevap veriyorsan, her görüşmeye sen giriyorsan, bir ekip değil bir bağımlılık kurmuşsun demektir. Gerçek duplikasyon, senin yokluğunda da büyüyen bir yapıdır. Kendini sistemin merkezinden çıkarabildiğin gün, ekibin ilk kez gerçekten ölçeklenmeye başlar.`,
      },
      {
        id: 'blog-firma-secimi',
        baslik: 'Bir NM Firması Seçerken Bakılacak 7 Kriter',
        emoji: '🔎',
        sure: '6 dk okuma',
        seviye: 'Orta',
        ozet: 'Doğru firma, doğru kişiyle bile yanlış zemin olabilir. Karar vermeden önce sormadan geçmemen gereken yedi soru.',
        format: 'article',
        maddeler: [
          'Ürün, plan olmasa bile satın alınacak kadar gerçek değer taşımalı.',
          'Şirketin geçmişi, finansal sağlığı ve şeffaflığı incelenmeli.',
          'Kazanç planı sürdürülebilir ve anlaşılır olmalı.',
          'Yasal uyum ve gerçekçi gelir beyanı şart.',
        ],
        govde: `Network marketing'te başarı sadece senin çabanla ilgili değildir; üzerinde durduğun zeminle de ilgilidir. Yanlış bir firma, en çalışkan kişiyi bile yorar. Bir fırsatı değerlendirirken duygusal heyecanın önüne geçip şu yedi kriteri sakince sormak, yıllarını kurtarabilir.

## 1. Ürün, plan olmadan da alınır mıydı?

En kritik soru budur. Eğer kimse kazanç planını bilmese, bu ürünü yine de parasıyla satın alır mıydı? Cevap "evet" ise sağlam bir temel var demektir. "Hayır" ise, satılan şey ürün değil sadece fırsattır ve bu uzun vadede sürdürülemez.

## 2. Şirketin geçmişi ve sağlığı

Şirket kaç yıldır faaliyette? Ödemelerini düzenli yapıyor mu? Kurucular ve yönetim şeffaf mı, yoksa sürekli isim mi değiştiriyor? Birkaç yıllık istikrarlı bir geçmiş, parlak ama yeni bir vaatten daha güven vericidir.

## 3. Kazanç planı anlaşılır mı?

İyi bir plan, ortalama bir insana on dakikada anlatılabilir. Eğer planı anlamak için elektronik tablo ve saatler gerekiyorsa, ekibine de anlatamazsın — yani duplike olmaz.

- Komisyonlar gerçek ürün satışından mı geliyor, yoksa sadece yeni kayıtlardan mı?
- Başlangıçta büyük stok almak zorunda mısın?
- Kazanç, sürekli yeni katılım yerine sürekli tüketime mi dayanıyor?

## 4. Yasal uyum ve gerçekçi beyan

Şirket gelir vaatlerinde dürüst mü? "Ayda şu kadar garanti" gibi söylemler bir uyarı işaretidir. Yasal ve etik bir firma, ortalama bir distribütörün gerçekte ne kazandığını şeffafça paylaşır.

## 5. Eğitim ve destek sistemi

Katıldığında seni bekleyen yapılandırılmış bir eğitim var mı, yoksa "kendi yolunu bul" mu deniyor? İyi bir firma ve iyi bir upline, başarın için araç ve sistem sunar.

## 6. Sponsor ve ekip kültürü

Bazen firma harikadır ama seni davet eden ekip toksiktir; bazen tam tersi. Birlikte çalışacağın insanlar dürüst, ulaşılabilir ve gerçekten yardımcı mı? Çünkü ilk yılında en çok onlarla muhatap olacaksın.

> Doğru firmayı seçmek, hızlı zengin olma vaadine değil, beş yıl sonra hâlâ yanında durabileceğin bir karara dayanır.

## 7. Beş yıl testi

Son olarak kendine sor: Bu ürünü ve bu şirketi, bir kuruş kazanmasam bile beş yıl boyunca gururla anlatabilir miyim? Cevabın "evet" ise, doğru zemindesin. Çünkü bu iş bir sprint değil; üzerinde uzun süre durabileceğin sağlam bir zemin gerektirir.`,
      },
      {
        id: 'blog-dinleme-sanati',
        baslik: 'Dinleme Sanatı: Konuşmadan İkna Etmek',
        emoji: '🎧',
        sure: '6 dk okuma',
        seviye: 'Orta',
        ozet: 'En iyi networker en çok konuşan değil, en iyi dinleyendir. İnsanlar anlaşıldıklarını hissettiklerinde ikna olur.',
        format: 'article',
        maddeler: [
          'İnsanlar bilgiden çok anlaşılmaktan etkilenir.',
          'Çözümünü sunmadan önce gerçek ihtiyacı keşfet.',
          'Açık uçlu sorular sohbeti derinleştirir.',
          'Sessizlikten korkma; en değerli cevaplar orada gizli.',
        ],
        govde: `Network marketing'te en yaygın hata çok konuşmaktır. Heyecanlı yeni başlayan, ürünün ve fırsatın her detayını anlatma telaşına düşer. Oysa ikna anlatmakla değil, anlamakla başlar.

## İnsanlar anlaşılmak ister
Karşındaki kişi sunumunun ne kadar parlak olduğunu umursamaz; kendi sorununun çözülüp çözülmeyeceğini merak eder. Önce onu dinlersen ne istediğini öğrenir, çözümü tam ona göre sunarsın. Dinlemek en güçlü ikna aracıdır, çünkü insan anlaşıldığını hissettiği kişiye güvenir.

## Sormayı öğren
- "Şu an hayatında değiştirmek istediğin bir şey var mı?"
- "Bunu neden önemsiyorsun?"
- "Bu sorun çözülse senin için ne değişirdi?"

Açık uçlu sorular kişinin gerçek motivasyonunu yüzeye çıkarır. Cevabı dikkatle dinle; bir sonraki soruyu onun sözlerinin içinden çıkar.

## Boşluktan korkma
Çoğu kişi sessizlikten rahatsız olur ve araya hemen girer. Oysa sessizlik karşındakine düşünme alanı verir. Bir soru sorduktan sonra sus; en içten cevaplar o sessizliğin içinden gelir.

> İnsanlar ne söylediğini unutur ama onları nasıl hissettirdiğini asla unutmaz.

## Dinlemek bir disiplindir
Dinlerken cevabını kurma, gerçekten anla. Sonra geri yansıt: "Doğru anladıysam seni en çok şu zorluyor…" Bu küçük teyit, karşındakine "bu kişi beni gerçekten dinledi" dedirtir. Satış çoğu zaman tam o anda başlar.`,
      },
      {
        id: 'blog-takip-sistemi',
        baslik: 'Takip Sistemi: Servet Takipte Gizli',
        emoji: '📌',
        sure: '6 dk okuma',
        seviye: 'Temel',
        ozet: 'Satışların çoğu ilk görüşmede değil, sonraki temaslarda kapanır. Çoğu kişi tam da o noktada takibi bırakır.',
        format: 'article',
        maddeler: [
          'Çoğu "hayır" aslında "şu an değil" demektir.',
          'Takip etmemek, ekilen tohumu sulamamaktır.',
          'Her temasın bir sonraki adımı net olmalı.',
          'Sistem hafızana değil, yazılı bir akışa dayanmalı.',
        ],
        govde: `Sektörde bir söz vardır: "Servet takipte gizlidir." Çünkü insanların büyük kısmı ilk görüşmede karar vermez. İlk "hayır" çoğu zaman bir ret değil, "henüz hazır değilim" anlamına gelir. Takip etmeyen kişi, ektiği tohumu sulamadan tarlayı terk etmiş gibidir.

## Neden takip edilmez?
İki sebep: korku ve düzensizlik. Kişi "rahatsız mı ederim" diye çekinir ya da kimi, ne zaman arayacağını unutur. İkisi de çözülebilir. Takip rahatsız etmek değil, değer hatırlatmaktır; yeter ki baskı değil ilgi taşısın.

## Her temasın bir sonraki adımı olsun
Bir görüşme "düşüneyim" ile bitiyorsa, takvime somut bir tarih koy: "O zaman cuma günü kısaca yazayım, olur mu?" Belirsiz "ben sizi ararım" yerine net bir randevu, takibi tahminden çıkarıp sisteme bağlar.

- İlk temas: tanış, dinle, tohum at.
- 2-3 gün sonra: küçük bir değer (içerik, cevap) ile hatırlat.
- Hazır olduğunda: net davet.

> Bir "hayır", sürecin sonu değil; doğru zamanlamayı bekleyen bir "henüz değil" olabilir.

## Hafızana değil, sisteme güven
Kimi ne zaman arayacağını aklında tutmaya çalışmak ölçeklenmez. Basit bir liste, hatırlatma ya da uygulamandaki takip aracı — yazılı her şey sen unutsan da çalışır. Disiplinli takip, yeteneğin önüne geçer.`,
      },
      {
        id: 'blog-sosyal-medya',
        baslik: 'Sosyal Medyada Çekim: İtmeden Mıknatıs Olmak',
        emoji: '🧲',
        sure: '7 dk okuma',
        seviye: 'Orta',
        ozet: 'İnsanlara ürün dayatan profiller görmezden gelinir. Değer paylaşan, merak uyandıran profillere ise insanlar kendileri gelir.',
        format: 'article',
        maddeler: [
          'Spam iter; değer çeker.',
          'Ürünü değil, dönüşümü ve yaşam tarzını göster.',
          'Tutarlılık, viral tek paylaşımdan güçlüdür.',
          'Mesaj kutusu satış değil, ilişki kurma yeridir.',
        ],
        govde: `Sosyal medyada iki tür networker vardır: itenler ve çekenler. İtenler her gönderide ürün linki paylaşır, herkese kopyala-yapıştır mesaj atar ve hızla görmezden gelinir. Çekenler ise insanların kendilerine geldiği bir alan kurar.

## Çekim pazarlamasının özü
İnsanlar reklamdan kaçar ama hikâyeye, faydaya ve samimiyete yaklaşır. Ürünün özelliklerini değil, getirdiği dönüşümü göster: nasıl hissettirdiğini, hayatında ne değiştirdiğini. İnsanlar matkabı değil, duvardaki deliği satın alır.

## Ne paylaşmalı?
- **Değer:** Takipçinin işine yarayan küçük ipuçları.
- **Hikâye:** Kendi yolculuğun, zorlukların ve küçük zaferlerin.
- **Sosyal kanıt:** Sonuçlar, dönüşümler (abartısız ve dürüst).
- **Kişilik:** Sadece "iş" değil; arkasındaki insan.

## Tutarlılık her şeyi yener
Bir gün on paylaşım yapıp üç hafta kaybolmak işe yaramaz. Haftada birkaç düzenli, samimi paylaşım; viral olma hayalinden çok daha güçlüdür. İnsanlar zamanla tanıdık yüze güvenir.

> Kimse satılmaktan hoşlanmaz, ama herkes ilham almayı ve ait olmayı sever.

## Mesaj kutusu bir ilişki alanıdır
Birisi etkileşime girince hemen link atma. Önce gerçek bir sohbet kur, ilgilen, dinle. Satış, güvenin doğal sonucudur. Mesaj kutusunu satış tezgâhı değil, tanışma masası gibi kullan.`,
      },
      {
        id: 'blog-itiraz-yonetimi',
        baslik: 'İtiraz Değil Soru: "Hayır"ı Anlamak',
        emoji: '💬',
        sure: '7 dk okuma',
        seviye: 'İleri',
        ozet: 'İtiraz bir kapı kapanması değil, çoğu zaman ilgi işaretidir. Doğru karşılandığında en güçlü satış anına dönüşür.',
        format: 'article',
        maddeler: [
          'İtiraz, ilgisizliğin değil ilginin işaretidir.',
          'Önce anla ve onayla, sonra cevap ver.',
          'Çoğu itiraz: para, zaman, güven ya da korkudur.',
          'Tartışma kazanılır ama kişi kaybedilir.',
        ],
        govde: `Yeni başlayanlar itirazdan korkar. Oysa deneyimli networker bilir ki itiraz, kapının kapanması değil, çoğu zaman aralanmasıdır. "Pahalı" diyen kişi aslında değeri merak ediyordur; "vaktim yok" diyen, ikna olursa vakit bulacağını söylüyordur.

## Önce anla, sonra cevapla
İtirazı duyar duymaz savunmaya geçme. Önce onayla: "Bunu anlıyorum, ben de başta aynısını düşünmüştüm." Bu cümle gerilimi düşürür ve karşındakini savunmadan çıkarır. İnsan, kendisiyle tartışılmadığını hissedince dinlemeye açılır.

## İtirazın ardındaki gerçek
Çoğu itiraz dört kökten gelir:
- **Para:** "Değer, fiyattan büyük mü?" sorusunun cevabını arıyor.
- **Zaman:** Öncelik sıralaması yapamıyor.
- **Güven:** Sana, ürüne ya da şirkete henüz emin değil.
- **Korku:** Başarısız olmaktan ya da ne düşünüleceğinden çekiniyor.

Hangi kökten geldiğini anlamadan verilen cevap, yanlış soruya doğru yanıt olur.

> Tartışmayı kazanabilirsin ama o anda müşteriyi kaybedersin.

## Soruyla karşıla
İtiraza itirazla değil, soruyla cevap ver: "Pahalı derken, neyle kıyaslıyorsun?" Bu, gerçek endişeyi yüzeye çıkarır ve kişinin kendi cevabını bulmasına yardım eder. İnsanlar senin söylediğine değil, kendi vardıkları sonuca ikna olur.`,
      },
      {
        id: 'blog-hedef-belirleme',
        baslik: 'Hedef Belirleme: Hayalden Takvime',
        emoji: '🎯',
        sure: '6 dk okuma',
        seviye: 'Temel',
        ozet: 'Hedefi olmayan çaba, pusulasız yürüyüştür. Büyük hayali küçük günlük aksiyonlara bölmek, onu ulaşılabilir kılar.',
        format: 'article',
        maddeler: [
          'Hayal ilham verir, hedef yön verir, plan yürütür.',
          'Büyük hedefi günlük aksiyona böl.',
          'Sonucu değil, kontrol edebildiğin eylemi hedefle.',
          'Yazılı hedef, akıldaki hedeften güçlüdür.',
        ],
        govde: `"Başarılı olmak istiyorum" bir hayaldir, hedef değil. Hayal ilham verir ama yön vermez. Hedef, hayali ölçülebilir ve tarihli hâle getirdiğinde başlar.

## İyi hedefin üç özelliği
Net, ölçülebilir ve tarihli. "Ekibimi büyüteceğim" yerine "bu ay 20 yeni kişiyle tanışıp 5'iyle sunum yapacağım." Böyle bir hedef, her sabah ne yapman gerektiğini sana kendisi söyler.

## Sonucu değil eylemi hedefle
Kaç kişinin "evet" diyeceğini kontrol edemezsin; ama kaç kişiyle konuşacağını kontrol edebilirsin. Bu yüzden hedefini eyleme bağla: "günde 5 temas." Sonuçlar bu eylemlerin doğal toplamı olarak gelir. Eyleme odaklanmak, hayal kırıklığını da azaltır.

- Yıllık hayal → aylık hedef → haftalık plan → günlük aksiyon.
- Her akşam: "Bugün beni hedefe yaklaştıran ne yaptım?"

> Bir hedef, son tarihi olan hayaldir.

## Yaz ve gözünün önünde tut
Akıldaki hedef sislidir; yazılı hedef nettir. Yaz, görebileceğin bir yere koy ve haftalık gözden geçir. Ölçtüğün şey büyür. Hedefini takip ettiğin gün, ona doğru ilerlemeye başlarsın.`,
      },
      {
        id: 'blog-zaman-yonetimi',
        baslik: 'Zaman Yönetimi: Yoğun Olmak, Üretken Olmak Değildir',
        emoji: '⏳',
        sure: '6 dk okuma',
        seviye: 'Orta',
        ozet: 'Çoğu kişi gün boyu meşguldür ama işi büyütmez. Sırrı, gelir getiren aktivitelere öncelik vermekte.',
        format: 'article',
        maddeler: [
          'Meşgul olmak ile üretken olmak farklıdır.',
          'Gelir getiren aktiviteleri (temas, takip, sunum) koru.',
          'Hazırlık önemlidir ama erteleme kılığına girebilir.',
          'Günün ilk saatini en önemli işe ayır.',
        ],
        govde: `Birçok networker gününü doldurur ama işini büyütmez. Logoyla, grupları düzenlemekle, "araştırmayla" saatler geçer; akşam yorgun ama satış yok. Çünkü yoğunluk üretkenlik değildir.

## Gelir getiren aktiviteler
İşini sadece birkaç eylem büyütür: yeni insanlarla tanışmak, takip etmek, sunum yapmak, ekibini eğitmek. Geri kalan her şey destek işidir. Günün büyük kısmını destek işine harcayıp asıl eylemlere zaman bulamamak, en sık görülen tuzaktır.

## Erteleme bazen "hazırlık" kılığına girer
Mükemmel bir broşür tasarlamak, planı tekrar tekrar gözden geçirmek konforludur çünkü reddedilme riski yoktur. Ama bu, gerçek işten kaçıştır. Kaba ama gerçek bir temas, kusursuz ama hayalî bir hazırlıktan değerlidir.

> Yoğunluk bir his, üretkenlik bir sonuçtur.

## İlk saat kuralı
Günün en taze enerjisini en çok korktuğun ve en çok kazandıran işe ayır: temas ve takip. O bittiğinde gün zaten kazanılmıştır. Önce kolay işleri yapıp zoru sona bırakırsan, zor iş genelde hiç yapılmaz.

- Güne "bugünün 3 gelir aktivitesi" ile başla.
- Bildirimleri kapat, bir blok zaman ayır.
- Önce arar/yazarsın, sonra düzenlersin.`,
      },
      {
        id: 'blog-liderlik-yetistirmek',
        baslik: 'Liderlik: Yönetmek Değil, Yetiştirmek',
        emoji: '🌱',
        sure: '7 dk okuma',
        seviye: 'İleri',
        ozet: 'Ekip lideri patron değildir. Görevi emir vermek değil, insanları kendi ayakları üzerinde duracak liderlere dönüştürmektir.',
        format: 'article',
        maddeler: [
          'Lider iş yapmaz, insanların iş yapmasını sağlar.',
          'Örnek olmak, talimattan güçlüdür.',
          'Kişinin "neden"ini bulmasına yardım et.',
          'Başarıyı paylaş, sorumluluğu üstlen.',
        ],
        govde: `Network marketing'te terfi, daha iyi satıcı olmakla değil, daha iyi lider olmakla gelir. Ama çoğu kişi lider olunca patron gibi davranmaya başlar: emir verir, kontrol eder, hesap sorar. Oysa burada kimse senin çalışanın değil; herkes gönüllü.

## Lider çoğaltır
İyi liderin ölçüsü kendi satışı değil, yetiştirdiği liderlerin sayısıdır. Her şeyi sen yaparsan ekibin sana bağımlı kalır. Bilgini, sistemini ve güvenini aktardığında ise ekibin sen olmadan da büyür.

## Örnek ol, sonra öğret
İnsanlar söylediklerini değil, yaptıklarını taklit eder. Hâlâ sahada olan, hâlâ aday ekleyen bir lider, masa başından talimat veren liderden çok daha fazla ilham verir. Önce göster, sonra yanında yaptır, sonra bırak yapsın.

> Gerçek lider, ekibinin ona ihtiyaç duymadan ilerleyebildiği liderdir.

## Onların "neden"ini büyüt
Bir kişiyi motive eden senin hedefin değil, kendi hedefidir. Ekip üyenin neden bu işte olduğunu keşfet ve zor günlerde ona o "neden"i hatırlat. Başarı geldiğinde sahneyi ona bırak; aksilik olduğunda sorumluluğu sen üstlen. İnsanlar böyle bir liderin peşinden gönüllü gider.`,
      },
      {
        id: 'blog-davet-sanati',
        baslik: 'Davet Sanatı: Baskı Yapmadan Çağırmak',
        emoji: '✉️',
        sure: '6 dk okuma',
        seviye: 'Temel',
        ozet: 'Davet, satışın kalbidir. Amaç ikna etmek değil, merak uyandırıp bir sonraki adıma çağırmaktır.',
        format: 'article',
        maddeler: [
          'Davetin amacı satmak değil, merak uyandırmaktır.',
          'Kısa tut; her şeyi davet anında anlatma.',
          'Heyecanın baskıdan değil, samimiyetten gelsin.',
          'Net bir sonraki adım sun (video, görüşme, etkinlik).',
        ],
        govde: `Davet, bu işin kalbidir; çünkü kimseyi davet etmezsen hiçbir şey başlamaz. Ama çoğu kişi davet ederken iki uca düşer: ya çekingenlikten hiç çağırmaz ya da baskıyla herkesi kaçırır. Doğru davet bu ikisinin ortasındadır.

## Davetin amacı satmak değildir
Davet anında ürünü, planı, her şeyi anlatmaya çalışma. Amacın tek şey: merak uyandırıp bir sonraki adıma (bir video, kısa bir görüşme, bir etkinlik) çağırmak. Ne kadar çok anlatırsan, "zaten biliyorum, ilgilenmiyorum" deme ihtimali o kadar artar.

## Kısa ve net ol
- "Senin tarzına uygun olabilecek bir şey buldum, 10 dakikalık bir video izler misin?"
- "Cuma akşamı kısa bir tanıtım var, seni de düşündüm."

Kısa davet güçlüdür çünkü kararı kolaylaştırır. Uzun, dağınık davet ise dinleyeni yorar.

> İnsanlar bilgiye değil, heyecanına ve netliğine "evet" der.

## Heyecan evet, baskı hayır
Senin gerçek heyecanın en güçlü davetiyedir; ama "kaçırırsan pişman olursun" tarzı baskı, güveni zedeler. İnsanı kendi kararını verecek kadar özgür bırak. Reddedilirsen de ilişkiyi koru: bugünün "hayır"ı, yarının "evet"i olabilir.`,
      },
      {
        id: 'blog-kisisel-marka',
        baslik: 'Kişisel Marka: İnsanlar Önce Sana Güvenir',
        emoji: '✨',
        sure: '6 dk okuma',
        seviye: 'Orta',
        ozet: 'Aynı ürünü binlerce kişi satıyor. Fark, ürün değil sensin. İnsanlar önce sana güvenir, sonra ürününe.',
        format: 'article',
        maddeler: [
          'Aynı üründe fark, güven veren kişidir.',
          'Tutarlılık ve dürüstlük markanın temelidir.',
          'Bildiğin bir konuda değer üreterek tanın.',
          'İtibar yavaş kurulur, hızlı yıkılır — koru.',
        ],
        govde: `Senin sattığın ürünü muhtemelen binlerce kişi daha satıyor. Aynı katalog, aynı plan, aynı fiyat. Peki insan neden senden alsın? Cevap basit: çünkü sana güveniyor. Network marketing'te asıl fark ürün değil, sensin.

## Marka = verdiğin güven
Kişisel marka logo ya da slogan değildir; insanların adını duyunca aklına gelen histir. "Dürüst", "yardımsever", "işini bilen" mi; yoksa "sürekli bir şey satmaya çalışan" mı? Bu algıyı her etkileşimde sen inşa edersin.

## Bir alanda değer üret
Herkes her şeyi bilemez. Senin doğal olarak iyi olduğun, keyif aldığın bir alanı seç (sağlık, annelik, girişimcilik, disiplin…) ve orada tutarlı değer üret. Zamanla o konuda "akla gelen kişi" olursun; insanlar sana gelmeye başlar.

> İnsanlar önce kişiyi satın alır, sonra ürünü.

## İtibar yavaş kurulur, hızlı yıkılır
Bir abartılı vaat, bir tutmadığın söz, yılların güvenini bir günde silebilir. Bu yüzden markanın en değerli sermayesi dürüstlüktür. Söz verdiğinde tut, bilmediğinde "bilmiyorum" de, satıştan önce ilişkiyi koru. Uzun vadede kazanan, en çok satan değil, en çok güvenilen olur.`,
      },
      {
        id: 'blog-hikaye-paketleme',
        baslik: 'Hikaye Paketleme: En Güçlü Satış Aracınızı Tasarlayın',
        emoji: '📖',
        sure: '8 dk okuma',
        seviye: 'İleri',
        ozet: 'İnsanlar verilerle ikna olmaz, hikâyelerle harekete geçer. Kendi dönüşüm hikâyeni doğru paketlemek en güçlü satış aracındır.',
        format: 'article',
        maddeler: [
          'Veriler bilgilendirir; hikâyeler harekete geçirir.',
          'İyi hikâye: önce/dönüm noktası/sonra yapısındadır.',
          'Kahraman sen değil, dinleyenin kendisidir.',
          'Hikâyeni sadeleştir ve tekrar tekrar anlatılabilir kıl.',
        ],
        govde: `İnsan beyni tablolarla değil, hikâyelerle düşünür. Bir liste rakamı unutulur ama iyi anlatılmış bir hikâye akılda kalır ve duyguyu harekete geçirir. Bu yüzden network marketing'te en güçlü satış aracın broşür değil, doğru paketlenmiş hikâyendir.

## Neden hikâye işe yarar?
Çünkü insanlar kendilerini hikâyenin içinde görür. "Bu ürün şu vitaminleri içerir" demek bilgi verir; "üç çocuklu, yorgun bir anneyken bu işle kendi zamanımı nasıl geri kazandığımı" anlatmak ise bağ kurar. Karar duyguyla verilir, sonra mantıkla haklı çıkarılır.

## İyi hikâyenin yapısı
Güçlü bir dönüşüm hikâyesi üç parçalıdır:
- **Önce:** Eski hâlin — zorluk, sıkışmışlık, hayal kırıklığı. (Dinleyen burada kendini tanır.)
- **Dönüm noktası:** Karşılaşma anı — neden başladın, ilk tereddüt, ilk kıvılcım.
- **Sonra:** Değişen hayat — abartısız, somut, dürüst.

Bu üçlü, dinleyene "demek ki benim için de mümkün" dedirtir.

## Kahraman sen değilsin
En sık yapılan hata, hikâyeyi bir kahramanlık destanına çevirmektir. Oysa asıl kahraman dinleyendir; sen sadece yolu önce yürümüş rehbersin. Hikâyeni öyle anlat ki, merkezde senin başarın değil, onun olasılığı olsun.

> Gerçekler anlatılır, hikâyeler yaşatılır — ve insanlar yaşadıkları şeye "evet" der.

## Paketle ve sadeleştir
Hikâyen 60 saniyede de, 5 dakikada da anlatılabilecek kadar net olmalı. Gereksiz detayları at, duygusal dönüm noktasını koru. Sonra prova et: o kadar sade olsun ki, ekibin bile kendi versiyonunu kolayca anlatabilsin. Çünkü kopyalanabilen hikâye, ölçeklenen hikâyedir.`,
      },
    ],
  },
]

const EN_KATEGORILER: Kategori[] = [
  {
    id: 'zihniyet',
    baslik: 'Mindset & Foundation',
    emoji: '🧠',
    renk: 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc] border-[#E0E7FF] dark:border-[#312e8130]',
    konular: [
      {
        id: 'z1',
        baslik: 'What is Network Marketing?',
        emoji: '🌐',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'The true definition of the business, described simply and debunking the myths.',
        maddeler: [
          'NM is the combination of direct sales and the personal recommendation economy.',
          'The company pays the advertising budget to distributors as commissions.',
          'Earnings come from two sources: your own sales and your team\'s sales.',
          'In legitimate NM, the product is real, consumption is continuous, and growth is sustainable.',
          'Difference from pyramid schemes: in NM, you can bypass those who joined before you.',
        ],
      },
      {
        id: 'z2',
        baslik: 'Why Do Most People Quit?',
        emoji: '🚶',
        sure: '4 min',
        seviye: 'Basic',
        ozet: 'The truth behind the statistics and how to rise above them.',
        maddeler: [
          'Most people quit in their first 90 days — due to false expectations.',
          'NM is a marathon, not a sprint; it requires slow but strong compound growth.',
          'Social pressure and initial rejections are the most common reasons to quit.',
          'The persistent 20% earn 80% of the total revenue — this is true in every industry.',
          'The solution: find a clear "why" and work closely with your sponsor.',
        ],
      },
      {
        id: 'z3',
        baslik: 'Growth Mindset',
        emoji: '🌱',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'Escaping the fixed mindset trap and practicing openness to growth.',
        maddeler: [
          '"I am not a natural salesperson" is a fixed mindset trap.',
          'Skills can be learned — communication, inviting, follow-up, and leadership.',
          'Every rejection brings you one step closer to a "yes".',
          'Do not take feedback personally: "no" is not about you, it is about their timing.',
          'Let books, podcasts, and observation be your daily mental "workout".',
        ],
      },
      {
        id: 'z4',
        baslik: 'The Truth About "No": What Rejection Really Means',
        emoji: '🛡️',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'Fear of rejection is the biggest blocker in NM — learn how to reframe "no."',
        maddeler: [
          '"No" is usually aimed at timing, bandwidth, or clarity—not your worth.',
          'Types of "no": "not now" → reconnect later; "not this way" → adjust approach; "never" → preserve the relationship.',
          'Talk to five people this week; even after a "no," leave the door open.',
          'Ask: "When would it feel okay if I checked back?" No pressure—just clarity.',
          'Fear of rejection rarely hurts as much as never starting. Inaction is the bigger risk.',
        ],
      },
      {
        id: 'z5',
        baslik: 'What to Do When Motivation Drops',
        emoji: '🔋',
        sure: '7 min',
        seviye: 'Basic',
        ozet: 'Motivation fluctuates—that\'s normal. Seven practical tools and the SWSWSWN framework to get back on rhythm.',
        maddeler: [
          'Motivation loss is a clarity problem—"I forgot why I\'m doing this," not a lack of energy.',
          '7 tools: Refresh your "why" list → Create a small win → Reach your mentor → Read success stories → Track your rejections → Move physically → Apply the 24-hour rule.',
          'SWSWSWN: Some Will, Some Won\'t, So What, Next—every "no" moves you closer to "yes."',
          '24-hour rule: if you feel very low, don\'t make big decisions. Delay the "I\'ll quit" thought by 24 hours.',
          'Motivation follows action—take one small step first; motivation usually follows.',
        ],
      },
      {
        id: 'z6',
        baslik: 'Set Your Goal and Find Your "WHY"',
        emoji: '🎯',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'A strong "why" is the one thing that keeps you going on hard days—get clear on your goal.',
        maddeler: [
          'Without a goal, effort scatters; write down "how much, by when, and what for."',
          'A shallow why ("a little extra cash") collapses under pressure; a deep why ("my child\'s education") carries you.',
          '5 Whys: ask "why do I want this?" five times to reach your real motivation.',
          'Make your goal SMART: Specific, Measurable, Achievable, Relevant, Time-bound.',
          'Post your why where you can see it; when motivation dips, look there first.',
        ],
      },
      {
        id: 'z7',
        baslik: 'Abundance vs Scarcity Mindset',
        emoji: '🌅',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'A scarcity mindset radiates pressure and desperation; an abundance mindset creates attraction.',
        maddeler: [
          'Scarcity: "If I lose this person, I\'m done." → Pressure is felt, the prospect pulls away.',
          'Abundance: "If they\'re right, great; if not, there\'s another door." → Calm attracts.',
          'The wider your prospect pool, the lighter the psychological weight of each "no."',
          'Abundance is not naivety; it\'s the result of generating many quality contacts.',
          'The distributor who attracts—not chases—wins; your posture decides everything.',
        ],
      },
      {
        id: 'z8',
        baslik: 'Habit Building: The Power of Small Steps',
        emoji: '⚙️',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'Success comes not from motivation but from small, consistent habits.',
        maddeler: [
          'Repeating the one right action daily beats trying a different tactic every day.',
          'Anchor the habit to an existing routine: "After my morning coffee, I reach out to 3 new names."',
          'Start tiny—2 messages a day—then scale once consistency is locked in.',
          'Don\'t break the chain: mark the daily action on a calendar; visible progress motivates.',
          'Do the minimum dose even on bad days; rhythm is stronger than mood swings.',
        ],
      },
      {
        id: 'z9',
        baslik: 'Top 5 Beginner Mistakes',
        emoji: '⚠️',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'These mistakes come from inexperience, not bad intent—seeing them is half the fix.',
        maddeler: [
          'Mistake 1: Talking too much, listening too little. → Ask first, understand the need.',
          'Mistake 2: Seeing everyone as a prospect yet reaching no one. → Build a wide list and start.',
          'Mistake 3: Drowning in product/company detail instead of acting. → Take action while learning.',
          'Mistake 4: Quitting at the first "no." → "No" is part of the work; protect your rhythm.',
          'Mistake 5: Not following up. → Fortune is in the follow-up; circle back within 48 hours.',
        ],
      },
    ],
  },
  {
    id: 'iletisim',
    baslik: 'Communication & Follow-Up',
    emoji: '🗣️',
    renk: 'bg-[#E1F5EE] dark:bg-[#0d3d2e] text-[#0F6E56] dark:text-[#4ade80] border-[#D2EFE4] dark:border-[#0d3d2e80]',
    konular: [
      {
        id: 'i1',
        baslik: 'Opening the First Conversation',
        emoji: '👋',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'How to turn a natural conversation into a business opportunity.',
        maddeler: [
          'People do not want to hear a sales pitch, they want to hear a story.',
          'Share your own transformation: start with "I used to be in the exact same position..."',
          'Ask questions, do not just give answers: build curiosity, do not force the talk.',
          'Goal: spark interest and invite them to take the next step.',
          'The "I only have 2 minutes, but does this interest you?" formula works wonders.',
        ],
      },
      {
        id: 'i2',
        baslik: 'The 2-Minute Presentation',
        emoji: '⚡',
        sure: '7 min',
        seviye: 'Medium',
        ozet: 'How to deliver a short, powerful, and memorable presentation.',
        maddeler: [
          'Long presentations kill attention. 2 minutes is enough, 20 minutes is too much.',
          'Structure: Problem → Solution → Proof → Invitation.',
          'Use real numbers: "X dollars in 3 months" is concrete; "good money" is vague.',
          'Memorize and practice your core story: practice builds ultimate confidence.',
          'A presentation opens a door — do not try to explain everything on the doorstep.',
        ],
      },
      {
        id: 'i3',
        baslik: 'The Art of Follow-Up',
        emoji: '🔁',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'How not to lose those who say "I\'m not ready yet" instead of "no".',
        maddeler: [
          '80% of sales occur after the 5th contact/follow-up.',
          'An initial "no" is not a final decision, it is a natural defense reflex.',
          'Follow-up timing: 2 days → 1 week → 1 month → 3 months.',
          'Deliver new value in every follow-up; do not just ask "did you think about it?"',
          'Following up is not pressure; it is offering care and continuous value.',
        ],
      },
      {
        id: 'tu1',
        baslik: 'The 48-Hour Rule: Following Up After Your Presentation',
        emoji: '⏱️',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'The first 48 hours after a presentation are when interest is highest—don\'t miss this window.',
        maddeler: [
          'Follow up within 24–48 hours after a presentation—that\'s when interest is at its peak.',
          'Your follow-up isn\'t a repeated pitch; it\'s value-adding continuation: "After thinking it over, what\'s the one question still on your mind?"',
          'After a "no": preserve the relationship, leave the door open, reconnect naturally in 30–90 days.',
          'Every follow-up delivers new value—"Did you think about it?" alone isn\'t enough.',
          'Without a follow-up system, team growth is impossible.',
        ],
      },
      {
        id: 'tu2',
        baslik: 'What to Write When They Say "I\'ll Think About It"',
        emoji: '💭',
        sure: '5 min',
        seviye: 'Basic',
        ozet: '"I\'ll think about it" is not a decision—it hides a specific concern. Find it and address it.',
        maddeler: [
          '"I\'ll think about it" is not a decision—it hides a specific question or concern.',
          'Don\'t drop it; go deeper: "While you think, what\'s the one thing sticking most?"',
          'Send a relevant piece of content or document to add value.',
          'Three days later, a gentle nudge: "Did you get a chance to look?"',
          '"Think about it" usually holds a concern about money, time, or family.',
        ],
      },
      {
        id: 'i4',
        baslik: 'Active Listening and Asking the Right Question',
        emoji: '👂',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'The best distributors don\'t talk the most—they ask the right question and listen.',
        maddeler: [
          'Talk ratio should be 30% you, 70% prospect; do need-discovery, not a sales pitch.',
          'Ask open questions: "If you could change one thing in your life right now, what would it be?"',
          'Don\'t prepare your answer while listening—truly understand; people open up when they feel heard.',
          'Summarize what you heard: "So what really tires you is time flexibility—did I get that right?"',
          'Don\'t rush to fill silence; wait 3 seconds after a question and let them think.',
        ],
      },
      {
        id: 'i5',
        baslik: 'Build Rapport with the FORM Formula',
        emoji: '🤝',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'Be human before you talk business—build genuine rapport with FORM; trust comes after.',
        maddeler: [
          'FORM: Family, Occupation, Recreation, Money/Motivation.',
          'Relationship first, business second: people listen to someone they trust.',
          'Show real interest in family and hobbies; this must be genuine curiosity, not a tactic.',
          'Occupation and motivation bridge to the person\'s "why" and to the opportunity.',
          'Take notes; recalling details next time is a powerful signal of connection.',
        ],
      },
      {
        id: 'i6',
        baslik: 'Body Language and Tone of Voice',
        emoji: '🧏',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Most of communication is not the words; it\'s tone of voice and body language.',
        maddeler: [
          'Tone and body language shape a message\'s impact far more than the words.',
          'On video calls, eye contact (look at the camera), a smile, and upright posture build trust.',
          'Energy and sincerity come through in a voice note; a monotone reads as indifference.',
          'Mirroring: match the prospect\'s pace and energy; avoid fake enthusiasm.',
          'On WhatsApp, punctuation and tone matter; replace a dry "ok" with warm, clear language.',
        ],
      },
      {
        id: 'i7',
        baslik: 'The Power of Storytelling',
        emoji: '📖',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'People aren\'t convinced by data; they connect through story—use your own and third-party stories.',
        maddeler: [
          'Data informs, story moves; a story that touches emotion sticks.',
          'Your story: "where I was → what happened → where I am now." Keep it short and real.',
          'Third-party story: the success of someone similar to your prospect is a powerful bridge.',
          'Don\'t exaggerate; a real, humble story beats a perfect but unbelievable one.',
          'Tie every story to a lesson: "What I learned from this was..."',
        ],
      },
      {
        id: 'i8',
        baslik: 'Top 5 Follow-up Mistakes',
        emoji: '⚠️',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Most sales are won or lost in the follow-up—avoid these mistakes.',
        maddeler: [
          'Mistake 1: Never following up. → The first "no" usually means "not yet."',
          'Mistake 2: Only writing "what did you think?" → Add value: new info, a story, or a question.',
          'Mistake 3: Being too frequent and pushy. → Keep a rhythm; be consistent, not insistent.',
          'Mistake 4: Not setting a follow-up date. → Each time clarify "when shall we talk again?"',
          'Mistake 5: Tracking follow-ups in your head. → Use a system; nothing should live in memory, only in records.',
        ],
      },
    ],
  },
  {
    id: 'davet',
    baslik: 'Inviting & Prospecting',
    emoji: '🎯',
    renk: 'bg-[#F0F9FF] dark:bg-[#0c1a2e] text-[#0369A1] dark:text-[#38bdf8] border-[#BAE6FD] dark:border-[#0369a130]',
    konular: [
      {
        id: 'd1',
        baslik: 'How to Build Your Wide Prospect Name List',
        emoji: '📋',
        sure: '7 min',
        seviye: 'Basic',
        ozet: '"I know nobody" is almost never true—a memory exercise will prove it.',
        maddeler: [
          '"I know nobody" is almost never literally true—a memory exercise proves it.',
          'Work: former colleagues, clients, suppliers, industry acquaintances.',
          'Social: school friends, neighbors, hobby groups, sports contacts.',
          'Digital: people you actually know from Instagram, WhatsApp groups, LinkedIn.',
          'Don\'t pre-reject people mentally ("they\'ll say no")—that\'s their decision, not yours.',
        ],
      },
      {
        id: 'd2',
        baslik: 'The Art of the Invite: Curiosity Before the Pitch',
        emoji: '🧲',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'Most invites fail because people pitch too early—create curiosity first, then invite.',
        maddeler: [
          'Most invites fail because people pitch too early—lead with curiosity, not the offer.',
          '3 steps: 1) Connect for real: "What are you up to lately?" 2) Spark curiosity: "I\'d love your eyes on something." 3) Low pressure: "It might not be for you—just take a quick look."',
          'Avoid: "Huge opportunity" hype, "Want to earn money?" traps, "Your life will change" promises.',
          'People like buying ideas—but hate feeling sold.',
          'Create curiosity and let them lean in.',
        ],
      },
      {
        id: 'd3',
        baslik: 'WhatsApp First Message Scripts',
        emoji: '💬',
        sure: '8 min',
        seviye: 'Basic',
        ozet: 'Personalize these openers—never blast generic spam.',
        maddeler: [
          'Personalize every message: name + one real anchor. Never blast generic spam.',
          'Scenario 1 (haven\'t spoken lately): "Hi [Name]—you popped into my head. How are you?"',
          'Scenario 2 (former coworker): "Thinking about [Company] days. How\'s everything going?"',
          'Scenario 3 (once mentioned extra income): "You mentioned wanting side income—is that still on your radar?"',
          'Name + real anchor = 1:1 feeling. That\'s what makes messages work.',
        ],
      },
      {
        id: 'd4',
        baslik: 'Cold Market vs Warm Market',
        emoji: '🌡️',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'Warm market starts with trust, cold market takes skill—use them in the right order.',
        maddeler: [
          'Warm market: people who know and trust you—the easiest, right place to start.',
          'Cold market: people you don\'t know (social media, referrals)—requires skill and a system.',
          'A beginner should first gain experience and confidence from the warm market.',
          'In the cold market, give value and build rapport first; don\'t pitch in the first message.',
          'Neither runs out: the warm list refills via referrals, the cold market via content.',
        ],
      },
      {
        id: 'd5',
        baslik: 'The Art of Asking for Referrals',
        emoji: '🔗',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Your list never ends with referrals—you can even get one from someone who said "no."',
        maddeler: [
          'Ask for referrals at the end of every conversation; happy people are your best source.',
          'Ask the "no" too: "This isn\'t for you—who do you know that might be the right person?"',
          'Be specific: "Think of your circle—anyone looking for extra income or open to something new?"',
          'Turn the referrer into a bridge: "Could you introduce me to them briefly?" warms the intro.',
          'Approach the referred prospect by edifying the person who referred them.',
        ],
      },
      {
        id: 'd6',
        baslik: 'Edification: Elevate Your Mentor and Tools',
        emoji: '⭐',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Edification is the art of transferring trust fast by praising a third-party authority.',
        maddeler: [
          'Edification = introducing a person/tool positively before the conversation.',
          '"I\'ll connect you with a very experienced leader; what they explain is far clearer than me."',
          'Don\'t diminish yourself; elevate your mentor—this ties trust to the system, not just you.',
          'Edify tools too: "Just watch this short video, it sums everything up beautifully."',
          'Edification duplicates: when your team elevates you too, your authority compounds.',
        ],
      },
      {
        id: 'd7',
        baslik: 'Inviting to Events and Meetings',
        emoji: '🎟️',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Events speed up decisions—the goal of the invite is attendance, not information.',
        maddeler: [
          'The invite\'s only goal: get the person to the event/presentation—don\'t explain it all on the phone.',
          'Create curiosity, hold the detail: "Rather than tell you, I want to show you—can you spare 30 minutes?"',
          'Give a specific day and time; close with "Is Tuesday 8 PM okay?" not "whenever you\'re free."',
          'Event energy and social proof are far more persuasive than a one-on-one explanation.',
          'Confirm attendance and remind; for no-shows, gently reschedule.',
        ],
      },
      {
        id: 'd8',
        baslik: 'Roleplay: Practicing the Invitation Dialogue',
        emoji: '🎭',
        sure: '7 min',
        seviye: 'Medium',
        ozet: 'Don\'t memorize the invite—make it natural by practicing; rehearse the sample dialogue aloud.',
        maddeler: [
          'Prospect: "What is this, just tell me?" → You: "I can\'t do it justice on the phone; let me show you in a quick 20-minute chat—I\'d love your take."',
          'Prospect: "I\'m really busy right now." → You: "That\'s exactly why it\'s flexible; do you have 2 days this week—let\'s pick the one that suits you."',
          'Prospect: "Is this one of those sales things?" → You: "Fair question; let\'s look together and you decide—if it\'s not a fit, saying \'not for me\' is totally fine."',
          'Rehearse these three scenarios aloud with a friend; note where you stumble.',
          'The goal is naturalness, not a script; use your own words within the same frame.',
        ],
      },
    ],
  },
  {
    id: 'sunum',
    baslik: 'Presenting & Closing',
    emoji: '🎤',
    renk: 'bg-[#FFF7ED] dark:bg-[#2a1500] text-[#9A3412] dark:text-[#fb923c] border-[#FED7AA] dark:border-[#9a341230]',
    konular: [
      {
        id: 'sk1',
        baslik: 'T-S-P-O-C: A 20-Minute Presentation Framework',
        emoji: '📊',
        sure: '10 min',
        seviye: 'Medium',
        ozet: 'Instead of marathon talks, use a five-part arc that ends in clarity, not confusion.',
        maddeler: [
          'T (Trust, 0–3 min): Listen before you talk. "What matters most to you right now?"',
          'S (Situation, 3–7 min): Reflect the pain point they named—make them feel understood.',
          'P (Plan, 7–13 min): Present the product or opportunity as a direct answer to their situation.',
          'O (Opportunity, 13–17 min): Paint the concrete change in their life—only realistic, documentable outcomes.',
          'C (Call-to-Action, 17–20 min): One small next step—not a big decision. "Try for 10 days" or "Join one Zoom."',
        ],
      },
      {
        id: 'sk2',
        baslik: 'The 5 Closing Techniques That Work Without Pressure',
        emoji: '🔐',
        sure: '8 min',
        seviye: 'Medium',
        ozet: 'Closing isn\'t coercion—it\'s making decisions easier. Five field-tested techniques.',
        maddeler: [
          '1-10 Scale: "On a scale of 1–10, where are you right now?" If 4–7: "What\'s keeping you from a 10?"',
          '"If...then..." question: surfaces the real objection without confrontation.',
          'Silence technique: make the offer, then stop talking and wait.',
          'Next-step close: "I\'m not asking you to decide everything now—just the next small step."',
          'Summary + invite: summarize 3 key benefits, propose one low-risk action.',
        ],
      },
      {
        id: 'sk3',
        baslik: 'Objection Handling: Feel-Felt-Found & VVSSD',
        emoji: '🧩',
        sure: '10 min',
        seviye: 'Medium',
        ozet: 'Hear the objection, don\'t get defensive, find the real concern first, then move forward with story.',
        maddeler: [
          'Feel–Felt–Found: reflect the emotion → recall a similar experience → share a third-person example.',
          'Peeling the onion: Stop → Soft validation ("That\'s fair") → Deepen ("What\'s behind that concern?") → Anchor.',
          'VVSSD: Validate → Verify → Seek → Story (not persuasion) → Door (invite).',
          'Don\'t jump into debate on the first response; avoid scripted robot answers.',
          'No exaggerated income claims; use a short genuine personal story instead.',
        ],
      },
      {
        id: 'sk4',
        baslik: 'The Three-Way Call',
        emoji: '👥',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'The three-way call is the most powerful duplication tool for transferring your mentor\'s authority to your prospect.',
        maddeler: [
          'Three-way call: you + your mentor + the prospect—the experienced person answers, you learn.',
          'First edify your mentor, then connect; authority transfers.',
          'During the call, mostly listen; don\'t interrupt your mentor.',
          'It builds trust for the prospect and is live training for you—you learn something each time.',
          'Teach it to your team: once the three-way call duplicates, the team grows independent of the mentor.',
        ],
      },
      {
        id: 'sk5',
        baslik: 'The Power of Tools: Third-Party Validation',
        emoji: '🧰',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Let the tools talk and be the bridge—video/PDF/sample lifts the persuasion load off you and duplicates.',
        maddeler: [
          'A tool (video, PDF, short deck) delivers a consistent message unaffected by mood.',
          '"Don\'t you talk, let the tool talk"—this reduces fatigue and eases duplication.',
          'Even a beginner can present professionally with a tool; lack of knowledge isn\'t a barrier.',
          'Third-party validation (independent review, document) is more persuasive than your own words.',
          'Keep the tool short and follow up: "After you watch it, let\'s discuss whatever stands out."',
        ],
      },
      {
        id: 'sk6',
        baslik: 'The Follow-up Sequence: Fortune Is in the Follow-up',
        emoji: '🔁',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'Most sales close not on first contact but across a planned follow-up sequence.',
        maddeler: [
          'Most decisions come after several touches; a one-touch close is rare.',
          'Sample sequence: Day 1 thanks + tool → Day 2 a question → Day 4 a story → Day 7 a clear invite.',
          'Add value at each touch; not just "what did you think?" but new info or a question.',
          'Always set the next follow-up date and track it with a system—forgetting is lost opportunity.',
          'Keep the relationship even with a "no"; today\'s "no" can be a "yes" in 6 months.',
        ],
      },
      {
        id: 'sk7',
        baslik: 'Roleplay: Practicing Objection Handling',
        emoji: '🎭',
        sure: '7 min',
        seviye: 'Advanced',
        ozet: 'Turn objection handling into a reflex by rehearsing the Feel–Felt–Found frame.',
        maddeler: [
          'Frame: I understand (feel) → I/others felt the same (felt) → here\'s what we found (found).',
          '"No time" → "I get it; I started while working full-time too—we built a rhythm with 3 hours a week."',
          '"No money" → "Very common; let\'s look at the smallest official starter option together, no pressure."',
          'Rehearse the 3 most common objections aloud with a friend; keep your tone calm, not defensive.',
          'The goal isn\'t to win an argument but to surface the real concern and solve it together.',
        ],
      },
    ],
  },
  {
    id: 'ekip',
    baslik: 'Team & Leadership',
    emoji: '👥',
    renk: 'bg-[#FAEEDA] dark:bg-[#3a2200] text-[#854F0B] dark:text-[#fbbf24] border-[#F6E4C4] dark:border-[#3a220080]',
    konular: [
      {
        id: 'e1',
        baslik: 'Building a Team: First Steps',
        emoji: '🏗️',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'The solid foundations of building a team from scratch.',
        maddeler: [
          'Do not look for everyone, look for the right ones: ambitious, coachable, reliable.',
          'Choose your first 2–3 partners carefully — they will define your team culture.',
          'The first 48 hours are critical for a new member: get them to take action immediately.',
          'Be a role model, not just a advisor: if you do not do it, your team won\'t either.',
          'Establish a healthy balance between emotional support and technical coaching.',
        ],
      },
      {
        id: 'e2',
        baslik: 'Duplication: Scaling with a System',
        emoji: '🔄',
        sure: '8 min',
        seviye: 'Advanced',
        ozet: 'How to build a team that grows even when you are not there.',
        maddeler: [
          'Duplication: connecting things that others can also do to a systematic process.',
          'A team relying on a single superstar is fragile; a team relying on a system is strong.',
          'The "I will train you, then model it, then let you fly" formula is highly successful.',
          'Support every member until they find and sponsor their own first 2–3 partners.',
          'Great leaders make their team independent, not dependent.',
        ],
      },
      {
        id: 'e3',
        baslik: 'How to Choose Your First 5 Team Members',
        emoji: '🔎',
        sure: '9 min',
        seviye: 'Medium',
        ozet: 'Find the right member, not the easiest one—your first 5 define your team culture.',
        maddeler: [
          'Look for the right person, not everyone: ambitious, coachable, reliable.',
          'Evaluation questions: Will this person work in the field? Are they open to learning? Do they keep their word?',
          'Your first 5 define your team culture—don\'t rush the selection.',
          'First member: someone close, ready, and motivated. Later members from different networks.',
          'Priority is finding the right member, not the easiest one.',
        ],
      },
      {
        id: 'e4',
        baslik: 'Duplication System: Build a Team That Copies the System, Not You',
        emoji: '📡',
        sure: '10 min',
        seviye: 'Advanced',
        ozet: 'Duplication means transferring a repeatable system to your team—not your personal charisma.',
        maddeler: [
          'Duplication: connecting what you do to a system so others can do it too.',
          'Fit your simplest starting workflow onto one A4 page—teach it, then have them teach it back.',
          'A team relying on a single superstar is fragile; a system-reliant team is strong.',
          'The "I\'ll train you, then let you run" formula creates sustainable growth.',
          'Great leaders make their team independent, not dependent.',
        ],
      },
      {
        id: 'e5',
        baslik: 'Fast Start: A New Member\'s First 48 Hours',
        emoji: '🚀',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'A new member\'s first 48 hours determine their staying power—a quick win changes everything.',
        maddeler: [
          'Excitement peaks early; turn that energy into a concrete action within the first 48 hours.',
          'Do together: build the prospect list, first 3 invites, experience the product, write the goal.',
          'An early small win (first "yes" or first sale) makes commitment stick.',
          'Give a clear start checklist; uncertainty is the biggest reason people quit.',
          'Stay in close contact the first week; a new member left alone cools off fast.',
        ],
      },
      {
        id: 'e6',
        baslik: 'Lead by Example: Leadership Posture',
        emoji: '🧭',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Your team copies what you do, not what you say—your posture sets the culture.',
        maddeler: [
          'Duplication happens through behavior: whatever you ask of your team, do it consistently first.',
          'A leader\'s calm, steady posture spreads direction—not panic—in pressured moments.',
          '"Do as I say, not as I do" fails; leading by example is the only real teacher.',
          'In hard times, model solutions not complaints; the team mirrors your energy.',
          'Never stop your own activity; an inactive leader can\'t build an active team.',
        ],
      },
      {
        id: 'e7',
        baslik: 'A Culture of Recognition and Appreciation',
        emoji: '🏆',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'People work as hard for recognition as for money—make small wins visible.',
        maddeler: [
          'Recognition is a basic human need; an appreciated member works more and stays longer.',
          'Celebrate not only big results but first steps: first invite, first presentation, first sale.',
          'Recognize publicly; make it visible in the team group, not just privately.',
          'Be specific: not "you\'re great" but "10 new contacts this week—your discipline is exemplary."',
          'Badges, levels, small rewards—gamification keeps motivation alive.',
        ],
      },
      {
        id: 'e8',
        baslik: 'Managing a Virtual Team',
        emoji: '💻',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'Geography is no longer a barrier—build and lead a team across cities with online tools.',
        maddeler: [
          'A regular online meeting (weekly) creates rhythm and belonging; lock it into the calendar.',
          'Keep the team group alive: daily motivation, success shares, Q&A.',
          'Record training and share it; new members can access it at their own pace.',
          'One-on-one attention is essential even remotely; have short individual chats with everyone.',
          'Standardize tools and the system so the team works the same way wherever they are.',
        ],
      },
      {
        id: 'e9',
        baslik: 'Top 5 Leadership Mistakes',
        emoji: '⚠️',
        sure: '6 min',
        seviye: 'Advanced',
        ozet: 'Traps even well-meaning leaders fall into—awareness prevents them.',
        maddeler: [
          'Mistake 1: Doing the team\'s work for them. → Do-show-release; raise them independent, not dependent.',
          'Mistake 2: Focusing only on strong members. → Give time to the new and the undecided too.',
          'Mistake 3: Forgetting recognition. → Unseen effort fades; regular acknowledgment is essential.',
          'Mistake 4: Stopping your own activity. → An inactive leader loses trust and example.',
          'Mistake 5: Growing by person instead of system. → Standardize processes and duplicate them.',
        ],
      },
    ],
  },
  {
    id: 'strateji',
    baslik: 'Strategy & Momentum',
    emoji: '📈',
    renk: 'bg-crown-subtle text-crown border-crown-subtle',
    konular: [
      {
        id: 's1',
        baslik: 'The Daily 5 Actions Principle',
        emoji: '5️⃣',
        sure: '4 min',
        seviye: 'Basic',
        ozet: 'Achieving consistent business growth with just 5 simple daily actions.',
        maddeler: [
          'Meet 5 new people or reconnect with 5 existing contacts.',
          'Share a presentation or short informational overview.',
          'Send 1 follow-up message to a prospect.',
          'Use your product and note down your personal experience.',
          'Learn something new: watch a video, listen to a podcast, read — 15 minutes is enough.',
        ],
      },
      {
        id: 's2',
        baslik: 'Turning Social Media Into a Business Tool',
        emoji: '📱',
        sure: '7 min',
        seviye: 'Medium',
        ozet: 'Achieving organic growth with valuable content instead of spamming.',
        maddeler: [
          'Do not just share product spam; share stories of transformation and benefits.',
          'The 80/20 rule: 80% valuable/educational content, 20% direct business promotion.',
          'DM strategy: show genuine interest first, listen actively, and then invite.',
          'A sustainable goal is 1 story a day + 2–3 main grid posts a week.',
          'The "Number + Result + Emotion" formula is highly engaging.',
        ],
      },
      {
        id: 's3',
        baslik: '90-Day Quickstart Plan',
        emoji: '🗓️',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'What to do and what to avoid in your critical first 90 days.',
        maddeler: [
          'Days 1–30: Learn the ropes, use the product yourself, and write down your prospect list.',
          'Days 31–60: Complete your first 10 invite calls, make your first sale or sign up a member.',
          'Days 61–90: Mentor your first distributor and begin duplicating the system.',
          'Your only focus during this period: maintaining active, unstoppable momentum.',
          'Evaluate your progress at the end of the 90 days and plan the next 90-day block.',
        ],
      },
      {
        id: 's4',
        baslik: 'Building Personal Brand on Instagram',
        emoji: '📸',
        sure: '7 min',
        seviye: 'Medium',
        ozet: 'Used correctly, Instagram creates warm inbound leads—be a pull center, not a pusher.',
        maddeler: [
          'Content mix: 3 educational + 2 personal + 1 business/product posts (the 3-2-1 rule).',
          'Start natural conversations—never send unsolicited bulk DMs.',
          'Be an attraction center: as people follow you, they eventually ask—be ready.',
          'Your voice, your face, your story—don\'t copy others\' content.',
          'Build real relationships with followers; your content opens the door, you walk through it.',
        ],
      },
      {
        id: 's5',
        baslik: 'Social Media: What NOT to Do',
        emoji: '🚫',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'Quick reference: the mistakes that will damage your brand, and what to do instead.',
        maddeler: [
          '❌ Spam DMs risk your account and trust. ✅ Add value first; answer questions when they come.',
          '❌ Only posting products/opportunity. ✅ 3-2-1: 3 value, 2 personal, 1 business.',
          '❌ Exaggerated earnings posts. ✅ Use measured, company-approved language.',
          '❌ Copying others\' content. ✅ Your voice, your face, your story.',
          '❌ Public arguments with critics. ✅ Resolve privately or move on politely.',
        ],
      },
      {
        id: 's6',
        baslik: 'Build a Content Calendar',
        emoji: '🗓️',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'Random posting doesn\'t work—a planned content calendar keeps your visibility consistent.',
        maddeler: [
          'Set a weekly rhythm: what, when, and in which format (story, post, video) you\'ll share.',
          'Content mix: 80% value/life/inspiration, 20% business/opportunity—constant selling loses people.',
          'Build a topic pool: product experience, success story, daily life, education, Q&A.',
          'Prepare and schedule ahead; creating "in the moment" isn\'t sustainable.',
          'Measure engagement; lean into whatever content performs.',
        ],
      },
      {
        id: 's7',
        baslik: 'Attraction Marketing: Make People Come to You',
        emoji: '🧲',
        sure: '7 min',
        seviye: 'Advanced',
        ozet: 'Instead of chasing, create value so people come to you.',
        maddeler: [
          'Attraction marketing: give value first, build authority and trust; demand follows naturally.',
          'Create problem-solving content; people follow and trust the one who helps.',
          'Personal brand = "what are you known for?"; pick a clear niche and message.',
          'Accumulate social proof: experiences, transformations, reviews speed up trust.',
          'Attraction is slow but compounds; content you plant today brings prospects for months.',
        ],
      },
      {
        id: 's8',
        baslik: 'The Power of Events',
        emoji: '🎤',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Events accelerate decisions and ignite the team—"those who get people to events win."',
        maddeler: [
          'Event energy and social proof are far more persuasive than a one-on-one explanation.',
          'Local meetup, online presentation, company convention—each has its own power.',
          'Take your team to big events; decisions made there create lasting commitment.',
          'Bring your prospect to an event: use the momentum of the crowd instead of solo pitching.',
          'Follow up within 24-48 hours after an event; action is easy while enthusiasm is fresh.',
        ],
      },
      {
        id: 's9',
        baslik: 'Time Blocking and Productivity',
        emoji: '⏱️',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'If you work part-time, you must manage time—block it, don\'t scatter.',
        maddeler: [
          'Reserve specific hours as a "work block"; in that block, do only income-producing activity.',
          'Focus on income-producing activity: invite, follow up, present—the rest is secondary.',
          'Turn off notifications; 30-60 minute focus blocks beat a scattered 3 hours.',
          'Plan the day ahead: each evening, write the next day\'s 3 key actions.',
          'Don\'t confuse preparation with production; endless "learning" is often procrastination in disguise.',
        ],
      },
      {
        id: 's10',
        baslik: 'Manage by Numbers: Tracking KPIs',
        emoji: '📊',
        sure: '6 min',
        seviye: 'Advanced',
        ozet: 'You can\'t manage what you don\'t measure—track the right numbers and move by data, not mood.',
        maddeler: [
          'Track activity metrics: new contacts, invites, presentations, follow-ups, new members.',
          'Manage activity not results; activity is in your control, results are its natural output.',
          'Know your conversion rates: how many contacts → presentations → "yes"; spot the bottleneck.',
          'Review weekly: target vs actual; where is the gap, where is the surplus.',
          'Numbers cut emotional swings; even a bad day is just a small dot in the data.',
        ],
      },
      {
        id: 's11',
        baslik: 'Using AI Tools in Network Marketing',
        emoji: '🤖',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'AI won\'t replace your effort but multiplies your speed—use it wisely in the right place.',
        maddeler: [
          'AI saves time on content ideas, headlines, and drafts; you personalize it.',
          'Tone messages and objection replies with AI, but review everything you send like a human.',
          'Research with AI: prepare fast, verified answers to product/industry questions.',
          'Don\'t let automation replace connection; relationships grow person to person.',
          'Ethical line: AI output must not exaggerate reality—no fake experience or income promises.',
        ],
      },
    ],
  },
  {
    id: 'uyum',
    baslik: 'Compliance & Ethics',
    emoji: '⚖️',
    renk: 'bg-[#F0FDF4] dark:bg-[#052e16] text-[#166534] dark:text-[#86efac] border-[#BBF7D0] dark:border-[#16653430]',
    konular: [
      {
        id: 'ue1',
        baslik: 'Direct Sales in Turkey: A Quick Compliance Framework',
        emoji: '🏛️',
        sure: '8 min',
        seviye: 'Basic',
        ozet: 'Knowing the legal boundaries protects you and makes you more trustworthy—general overview.',
        maddeler: [
          'Health products: diagnosis/treatment promises and guaranteed results carry high legal risk.',
          'Legitimacy check: real product sold to real customers? Income claims documentable?',
          'Pyramid warning signal: no/symbolic product; income mostly from recruiting, not sales.',
          'Avoid exaggerated earnings, guaranteed health outcomes, undocumented "approved" claims.',
          'This is a general framework—consult your company\'s official compliance resources for specifics.',
        ],
      },
      {
        id: 'ue2',
        baslik: 'Health Products: What You Can and Cannot Say',
        emoji: '🩺',
        sure: '4 min',
        seviye: 'Basic',
        ozet: 'Quick reference for staying legally safe—which phrases work, which ones create risk.',
        maddeler: [
          '✅ You can say: "Here\'s what I personally experienced," "I can share certifications," "My experience was..."',
          '❌ Never say: "It cures diseases," "It definitely works," "Doctor-approved" (without documentation).',
          'Personal result ≠ guaranteed outcome for everyone—always clarify this.',
          'Start with "My own experience was..."; avoid medical claims and guaranteed results.',
          'Use only language your company has officially approved.',
        ],
      },
      {
        id: 'ue3',
        baslik: 'Digital Posts & Declarations: Quick Check',
        emoji: '📲',
        sure: '6 min',
        seviye: 'Basic',
        ozet: 'Stay safe on your profile, stories, and messages—key reminders for income, health, and data.',
        maddeler: [
          'Income: "X earnings in Y time" carries both trust and compliance risk—use measured language.',
          'Health: start with "My own experience was..."; avoid medical claims and guarantees.',
          'PDPL: Do not share personal data without permission; no unnecessary list transfers.',
          'Distance selling: accurately explain your company\'s order and withdrawal processes.',
          'Transparent, measured, compliance-aligned language → long-term trust.',
        ],
      },
      {
        id: 'ue4',
        baslik: 'The Ethics of Income Claims',
        emoji: '💬',
        sure: '6 min',
        seviye: 'Medium',
        ozet: 'Honesty about income is both a legal duty and the foundation of long-term trust.',
        maddeler: [
          'Don\'t present atypical results as "typical"; promising exceptional income is misleading.',
          'Give a real figure or none at all; a guarantee of "you\'ll earn X per month" is unethical.',
          'Clearly state that income varies by effort, skill, and season.',
          'Direct people to the company\'s official income disclosure; let the document speak, not your claim.',
          'Hype creates short-term excitement but long-term loss of trust and disappointment.',
        ],
      },
      {
        id: 'ue5',
        baslik: 'Anti-Spam and Consent Boundaries',
        emoji: '🚫',
        sure: '5 min',
        seviye: 'Basic',
        ozet: 'Mass, unsolicited messaging damages your brand and creates legal risk—communicate with consent.',
        maddeler: [
          'Never send bulk copy-paste messages; a personal message that feels 1:1 works.',
          'Build rapport first, get permission: "Would you like me to send you something about this?"',
          'Respect data-privacy frameworks (e.g., GDPR/KVKK) regarding personal data and consent.',
          'Don\'t flood a stranger with links/offers in the first message; show genuine interest first.',
          'Quality > quantity: a real chat with 10 people beats 100 spam messages.',
        ],
      },
    ],
  },
  {
    id: 'urun',
    baslik: 'Product & Company',
    emoji: '🏢',
    renk: 'bg-[#FAF5FF] dark:bg-[#1a0030] text-[#6B21A8] dark:text-[#d8b4fe] border-[#E9D5FF] dark:border-[#6b21a830]',
    konular: [
      {
        id: 'us1',
        baslik: 'From Doubt to Belief: A Distributor\'s Product Story',
        emoji: '✨',
        sure: '8 min',
        seviye: 'Medium',
        ozet: 'Building this business without believing in the products is both unsustainable and unethical.',
        maddeler: [
          'Building this business without believing in the products is both unsustainable and unethical.',
          'Use the product yourself and with your family; take notes on results for 30 days.',
          '"Here\'s what I personally noticed—your experience may differ" is story, not script.',
          'Product experience replaces sales technique; your story reduces reliance on scripts.',
          'Ethical belief in what you sell = sustainable business.',
        ],
      },
      {
        id: 'us2',
        baslik: 'Knowing Your Company: The Foundation of Trust',
        emoji: '🔬',
        sure: '7 min',
        seviye: 'Basic',
        ozet: 'Prospects direct trust questions to the company—being able to answer builds your credibility.',
        maddeler: [
          'Prospects direct trust concerns to the company—answering those questions builds credibility.',
          '5 areas to know: founding history, product portfolio, legal registrations, compensation plan transparency, support infrastructure.',
          'Direct candidates to primary sources: "Look here—it\'s on this page."',
          'Read independent reviews; don\'t rely only on what the company tells you.',
          'Informed distributor = trustworthy distributor.',
        ],
      },
      {
        id: 'us3',
        baslik: 'Craft Your Product Story',
        emoji: '📣',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Sell transformation, not features—tell the real change the product created in you.',
        maddeler: [
          'People buy outcomes, not features: not "what\'s in it" but "how it changed my life."',
          'Story structure: before state → discovering the product → the difference today.',
          'Your own experience is the strongest marketing; use it for 30 days and note concrete observations.',
          'Avoid exaggeration and health claims; a real, humble story is more believable.',
          'Add visuals: before/after, daily use, sincere sharing builds trust.',
        ],
      },
      {
        id: 'us4',
        baslik: 'The Logic of Autoship/Subscription',
        emoji: '🔄',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'Regular consumption means a sustainable business and loyal customers—explain its logic well.',
        maddeler: [
          'A continuously consumed product = steady revenue = sustainable business; one-off sales are fragile.',
          'Autoship benefits the customer too: discounts, uninterrupted supply, time saved.',
          'Be a loyal consumer yourself first; you can\'t advocate regular use of a product you don\'t use.',
          'Offer value not pressure; note that it\'s flexible, fits their need, and is cancelable.',
          'A loyal customer base is the most solid foundation for steady income—even without new members.',
        ],
      },
      {
        id: 'us5',
        baslik: 'Customer Loyalty and Repeat Sales',
        emoji: '💚',
        sure: '5 min',
        seviye: 'Medium',
        ozet: 'The real profit is not in the first sale but in the repeat, happy customer—care after the sale.',
        maddeler: [
          'Finding a new customer is far more expensive than keeping an existing one.',
          'Follow up after the sale: "How are you using it, any issues?"—care builds loyalty.',
          'Teach correct usage; a customer who uses it wrong gets no results and leaves.',
          'A happy customer both buys again and is your strongest referral source.',
          'Some customers become business partners over time; a good customer relationship is the seed of your team.',
        ],
      },
    ],
  },
  {
    id: 'blog',
    baslik: 'Blog',
    emoji: '📰',
    renk: 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc] border-[#E0E7FF] dark:border-[#312e8130]',
    konular: [
      {
        id: 'blog-ilk-90-gun',
        baslik: 'The First 90 Days: Why Most People Quit',
        emoji: '🗓️',
        sure: '7 min read',
        seviye: 'Basic',
        ozet: 'Most newcomers give up in the first three months. The reason is not talent but the wrong expectation. Here is what the ones who stay do differently.',
        format: 'article',
        maddeler: [
          'Most people quit in the first 90 days because of the wrong expectation.',
          'The first goal should be habits and rhythm, not money.',
          'Rejection is not personal; it is a natural part of the numbers game.',
          'Small action repeated every day beats large but irregular effort.',
        ],
        govde: `Roughly seven out of every ten people who start network marketing leave before completing their first ninety days. This statistic is here not to scare you but to reassure you: most of those who quit do so not because they lack talent, but because they started with the wrong expectation. Once you fix the expectation, staying out of that seventy percent becomes surprisingly easy.

## The problem isn't money, it's your sense of timing

A newcomer usually thinks: "I'll see serious income within a few weeks." When it doesn't happen, they get disappointed and walk away saying "this isn't for me." But the nature of this business is like a marathon; the first months are a season of planting, not harvesting. In your first ninety days, the thing to measure is not your bank account but the habits you build.

## Three things that truly matter in the first 90 days

- **Rhythm:** A small touch every single day. Meeting five new people, sending three follow-up messages, sharing one piece of content. It's not the volume that matters, it's the consistency.
- **Resilience:** Not taking rejection personally. "No" most often means "not right now," and it is not a judgment about your worth.
- **Learning:** A one-minute note after each conversation: "what worked, what didn't." This small reflex will make you unrecognizable in three months.

## Reframe rejection

Most people stop after a few "no"s because they record every rejection as a failure. Experienced networkers, however, see rejection as part of a numbers game. Say one in twenty conversations turns into a partnership. Then every "no" you get moves you one step closer to that "yes." Rejection isn't an obstacle; it's a sign of progress.

> People usually quit right before things start to turn. Because the hardest part is to keep believing while no results are visible yet.

## On the ninetieth day, ask yourself

At the end of three months, don't ask yourself "how much did I earn?" — ask these instead: Have I built a consistent daily rhythm? Has my skin thickened against rejection? Am I meeting a few new people every week? If you can answer "yes," the income will follow on its own — because you'll have built the system that produces it. That is the reward of a patience most people never reach.`,
      },
      {
        id: 'blog-duplikasyon',
        baslik: 'The Art of Duplication: Being Copyable',
        emoji: '🔁',
        sure: '8 min read',
        seviye: 'Advanced',
        ozet: 'What grows a team is not your talent, but your team\'s ability to easily repeat your system. Simplicity is stronger than charisma.',
        format: 'article',
        maddeler: [
          'Duplication is your team\'s ability to easily repeat your system.',
          'A complex but impressive method is weaker than a simple but copyable one.',
          'Write the system down; nothing that lives "in your head" scales.',
          'A leader\'s job is not to do the work, but to enable others to do it.',
        ],
        govde: `In network marketing, how good you are on your own does not determine how much your team will grow. What determines it is how easily the work you do can be copied. This is called duplication, and it is the only lever that truly scales this business.

## Why the best salesperson isn't the best leader

Very often the most brilliant salesperson is the weakest team leader. The reason: they've built a method that relies on their own charisma, their own special talent. That method works wonderfully for them, but no one else can repeat it. A newcomer sees that performance, says "I could never do that," and gets discouraged. An ordinary system that everyone can repeat wins far more people than a genius system that cannot be copied.

## Simplicity is a strategy, not a shortcoming

At the heart of duplication is simplicity. Build your system so that even someone who joined three days ago can explain it to another person:

- **One invitation line:** A natural invite anyone can memorize.
- **One presentation path:** A standard video, a tool, a flow. Everyone enters through the same door.
- **One follow-up rhythm:** "When to say what" should be clear.

Complexity feeds the ego but kills the team. The more impressive a method is, the less it gets copied.

## Nothing "in your head" scales

If your system lives in your mind, your team can only grow as much as you can — meaning it stays limited by your time. The way to break this is to write things down. Write the invitation script. Write the first-conversation flow. Write the answers to common objections. Everything that becomes written and accessible keeps working even when you aren't there.

> A leader's task is not to be the person who does the work best, but the person who enables the most people to do the work.

## Make yourself unnecessary

It sounds backwards, but a good leader's goal is for the team to move forward without needing them. If you answer every question and join every meeting, you've built a dependency, not a team. True duplication is a structure that grows even in your absence. The day you can remove yourself from the center of the system is the day your team truly begins to scale.`,
      },
      {
        id: 'blog-firma-secimi',
        baslik: '7 Criteria for Choosing a Network Marketing Company',
        emoji: '🔎',
        sure: '6 min read',
        seviye: 'Medium',
        ozet: 'The right company can still be the wrong ground, even with the right person. Seven questions you should not skip before deciding.',
        format: 'article',
        maddeler: [
          'The product should carry enough real value to be bought even without the plan.',
          'Examine the company\'s history, financial health and transparency.',
          'The compensation plan should be sustainable and easy to understand.',
          'Legal compliance and realistic income claims are essential.',
        ],
        govde: `Success in network marketing isn't only about your effort; it's also about the ground you stand on. The wrong company wears out even the hardest worker. When evaluating an opportunity, getting past the emotional excitement and calmly asking these seven questions can save you years.

## 1. Would the product be bought without the plan?

This is the most critical question. If no one knew about the compensation plan, would they still buy this product with their own money? If the answer is "yes," there's a solid foundation. If "no," what's being sold isn't the product but only the opportunity — and that isn't sustainable long term.

## 2. The company's history and health

How many years has the company been operating? Does it pay on time? Are the founders and management transparent, or do they keep changing names? A few years of stable history is more reassuring than a shiny but brand-new promise.

## 3. Is the compensation plan understandable?

A good plan can be explained to an average person in ten minutes. If understanding the plan requires spreadsheets and hours, you won't be able to explain it to your team either — meaning it won't duplicate.

- Do commissions come from real product sales, or only from new sign-ups?
- Do you have to buy a large amount of stock up front?
- Is income based on continuous consumption rather than continuous recruitment?

## 4. Legal compliance and honest claims

Is the company honest about income? Claims like "guaranteed X per month" are a warning sign. A legal and ethical company transparently shares what an average distributor actually earns.

## 5. Training and support system

When you join, is there structured training waiting for you, or are you told to "find your own way"? A good company and a good upline give you tools and a system for your success.

## 6. Sponsor and team culture

Sometimes the company is great but the team that invited you is toxic; sometimes it's the opposite. Are the people you'll work with honest, reachable and genuinely helpful? Because in your first year, they're who you'll deal with the most.

> Choosing the right company rests not on a get-rich-quick promise, but on a decision you can still stand behind five years from now.

## 7. The five-year test

Finally, ask yourself: Could I proudly talk about this product and this company for five years, even if I never earned a penny? If your answer is "yes," you're on the right ground. Because this business is not a sprint; it requires solid ground you can stand on for a long time.`,
      },
      {
        id: 'blog-dinleme-sanati',
        baslik: 'The Art of Listening: Persuading Without Talking',
        emoji: '🎧',
        sure: '6 min read',
        seviye: 'Medium',
        ozet: 'The best networker is not the one who talks most, but the one who listens best. People are persuaded when they feel understood.',
        format: 'article',
        maddeler: [
          'People are moved by being understood more than by information.',
          'Discover the real need before presenting your solution.',
          'Open-ended questions deepen the conversation.',
          'Don’t fear silence; the most valuable answers hide there.',
        ],
        govde: `The most common mistake in network marketing is talking too much. The excited beginner rushes to explain every detail of the product and the opportunity. But persuasion begins not with explaining, but with understanding.

## People want to be understood
The person across from you doesn't care how brilliant your pitch is; they wonder whether their own problem will be solved. Listen first and you'll learn what they want, then present the solution made exactly for them. Listening is the most powerful persuasion tool, because people trust whoever makes them feel understood.

## Learn to ask
- "Is there something in your life you'd like to change right now?"
- "Why does that matter to you?"
- "If this were solved, what would change for you?"

Open-ended questions surface a person's real motivation. Listen closely, and draw your next question from their own words.

## Don’t fear the silence
Most people get uncomfortable with silence and jump in. But silence gives the other person room to think. After you ask a question, stay quiet; the most honest answers come out of that silence.

> People forget what you said, but they never forget how you made them feel.

## Listening is a discipline
Don't build your reply while listening—truly understand. Then reflect back: "If I understood right, the thing that challenges you most is…" That small confirmation makes the other person think, "this person really listened to me." The sale often begins right there.`,
      },
      {
        id: 'blog-takip-sistemi',
        baslik: 'Follow-Up: The Fortune Is in the Follow-Up',
        emoji: '📌',
        sure: '6 min read',
        seviye: 'Basic',
        ozet: 'Most sales close not on the first conversation but in later touches. And most people quit following up at exactly that point.',
        format: 'article',
        maddeler: [
          'Most "no"s actually mean "not right now."',
          'Not following up is planting a seed and never watering it.',
          'Every touch should have a clear next step.',
          'Rely on a written flow, not your memory.',
        ],
        govde: `There's a saying in this industry: "The fortune is in the follow-up." Because most people don't decide on the first conversation. A first "no" is often not a rejection but "I'm not ready yet." Someone who doesn't follow up is like a farmer who plants a seed and leaves the field without watering it.

## Why people don’t follow up
Two reasons: fear and disorganization. People worry, "what if I'm bothering them," or simply forget who to contact and when. Both are solvable. Follow-up isn't pestering; it's reminding of value—as long as it carries interest, not pressure.

## Give every touch a next step
If a conversation ends with "let me think about it," put a concrete date on the calendar: "I'll drop you a short message on Friday, okay?" A clear appointment instead of a vague "I'll call you" turns follow-up from guesswork into a system.

- First touch: meet, listen, plant the seed.
- 2-3 days later: remind with a small piece of value.
- When they're ready: a clear invite.

> A "no" may not be the end of the process—just a "not yet" waiting for the right timing.

## Trust the system, not your memory
Trying to remember who to call and when doesn't scale. A simple list, a reminder, or your app's follow-up tool—anything written works even when you forget. Disciplined follow-up beats raw talent.`,
      },
      {
        id: 'blog-sosyal-medya',
        baslik: 'Attraction on Social Media: Be a Magnet, Not a Pushcart',
        emoji: '🧲',
        sure: '7 min read',
        seviye: 'Medium',
        ozet: 'Profiles that push products are ignored. Profiles that share value and spark curiosity draw people in on their own.',
        format: 'article',
        maddeler: [
          'Spam repels; value attracts.',
          'Show the transformation and lifestyle, not the product.',
          'Consistency beats a single viral post.',
          'The inbox is for building relationships, not closing sales.',
        ],
        govde: `On social media there are two kinds of networkers: those who push and those who attract. The pushers drop a product link in every post, send copy-paste messages to everyone, and get ignored fast. The attractors build a space people come to on their own.

## The essence of attraction marketing
People flee ads but move toward stories, usefulness, and sincerity. Don't show the product's features—show the transformation it brings: how it feels, what it changed. People don't buy the drill; they buy the hole in the wall.

## What to share
- **Value:** Small tips that actually help your followers.
- **Story:** Your own journey, struggles, and small wins.
- **Social proof:** Results and transformations (honest, never exaggerated).
- **Personality:** Not just "business"—the human behind it.

## Consistency beats everything
Posting ten times one day and disappearing for three weeks doesn't work. A few regular, genuine posts a week are far stronger than dreaming of going viral. Over time, people trust a familiar face.

> Nobody likes being sold to, but everybody loves being inspired and feeling they belong.

## The inbox is a relationship space
When someone engages, don't fire off a link. Start a real conversation first—care, listen. The sale is the natural result of trust. Use the inbox like a table to get acquainted, not a sales counter.`,
      },
      {
        id: 'blog-itiraz-yonetimi',
        baslik: 'Not an Objection, a Question: Understanding "No"',
        emoji: '💬',
        sure: '7 min read',
        seviye: 'Advanced',
        ozet: 'An objection isn’t a door closing—it’s often a sign of interest. Handled right, it becomes the strongest moment of the sale.',
        format: 'article',
        maddeler: [
          'An objection signals interest, not indifference.',
          'Understand and acknowledge first, then answer.',
          'Most objections are: money, time, trust, or fear.',
          'You can win the argument and lose the person.',
        ],
        govde: `Beginners fear objections. But the experienced networker knows an objection isn't the door closing—it's often the door opening a crack. Someone who says "it's expensive" is actually curious about the value; "I have no time" means "if I'm convinced, I'll find the time."

## Understand first, then answer
Don't go on the defensive the moment you hear an objection. Acknowledge first: "I understand—I thought the same thing at the beginning." That sentence lowers tension and takes the other person out of defense mode. When people feel they aren't being argued with, they open up to listening.

## The truth behind the objection
Most objections come from four roots:
- **Money:** Looking for the answer to "is the value bigger than the price?"
- **Time:** Can't set the priority.
- **Trust:** Not yet sure about you, the product, or the company.
- **Fear:** Afraid of failing or of what others will think.

An answer given without knowing the root is a right reply to the wrong question.

> You may win the argument, but in that moment you lose the customer.

## Meet it with a question
Answer an objection not with a counter-objection but with a question: "When you say expensive, what are you comparing it to?" This surfaces the real concern and helps the person reach their own conclusion. People are convinced not by what you say, but by what they conclude themselves.`,
      },
      {
        id: 'blog-hedef-belirleme',
        baslik: 'Goal Setting: From Dream to Calendar',
        emoji: '🎯',
        sure: '6 min read',
        seviye: 'Basic',
        ozet: 'Effort without a goal is a walk without a compass. Breaking a big dream into small daily actions makes it reachable.',
        format: 'article',
        maddeler: [
          'A dream inspires, a goal directs, a plan executes.',
          'Break the big goal into daily action.',
          'Target the action you control, not the outcome.',
          'A written goal beats one kept in your head.',
        ],
        govde: `"I want to be successful" is a dream, not a goal. A dream inspires but gives no direction. A goal begins when you make the dream measurable and dated.

## Three traits of a good goal
Clear, measurable, dated. Instead of "I'll grow my team," try "this month I'll meet 20 new people and present to 5 of them." A goal like that tells you each morning exactly what to do.

## Target the action, not the outcome
You can't control how many people say "yes," but you can control how many you talk to. So tie your goal to action: "5 contacts a day." Results arrive as the natural sum of those actions. Focusing on action also reduces disappointment.

- Yearly dream → monthly goal → weekly plan → daily action.
- Every evening: "What did I do today that moved me toward the goal?"

> A goal is a dream with a deadline.

## Write it and keep it in sight
A goal in your head is foggy; a written goal is clear. Write it, put it somewhere you'll see it, review it weekly. What you measure grows. The day you start tracking your goal is the day you start moving toward it.`,
      },
      {
        id: 'blog-zaman-yonetimi',
        baslik: 'Time Management: Being Busy Is Not Being Productive',
        emoji: '⏳',
        sure: '6 min read',
        seviye: 'Medium',
        ozet: 'Most people are busy all day but don’t grow the business. The secret is prioritizing income-producing activities.',
        format: 'article',
        maddeler: [
          'Being busy and being productive are different.',
          'Protect income-producing activity (contact, follow-up, present).',
          'Preparation matters but can disguise procrastination.',
          'Give the first hour of the day to the most important task.',
        ],
        govde: `Many networkers fill their day but don't grow their business. Hours go to logos, organizing groups, "research"; by evening they're tired but there's no sale. Because being busy is not being productive.

## Income-producing activities
Only a few actions grow your business: meeting new people, following up, presenting, training your team. Everything else is support work. Spending most of the day on support work and finding no time for the core actions is the most common trap.

## Procrastination sometimes wears a "preparation" costume
Designing the perfect brochure or reviewing the plan again and again feels comfortable because there's no risk of rejection. But it's an escape from the real work. A rough but real contact is worth more than a flawless but imaginary preparation.

> Busyness is a feeling; productivity is a result.

## The first-hour rule
Give the day's freshest energy to the task you fear most and that earns most: contacting and following up. Once that's done, the day is already won. If you do the easy tasks first and leave the hard one for last, the hard one usually never gets done.

- Start the day with "today's 3 income activities."
- Turn off notifications, set a block of time.
- You call/message first, then organize.`,
      },
      {
        id: 'blog-liderlik-yetistirmek',
        baslik: 'Leadership: Not Managing, but Growing People',
        emoji: '🌱',
        sure: '7 min read',
        seviye: 'Advanced',
        ozet: 'A team leader is not a boss. The job isn’t to give orders but to turn people into leaders who can stand on their own.',
        format: 'article',
        maddeler: [
          'A leader doesn’t do the work; they enable others to do it.',
          'Setting an example beats giving instructions.',
          'Help each person find their own "why".',
          'Share the credit, carry the responsibility.',
        ],
        govde: `In network marketing, promotion comes not from becoming a better salesperson but a better leader. Yet many start acting like a boss once they lead: ordering, controlling, demanding. But here no one is your employee; everyone is a volunteer.

## A leader multiplies
The measure of a good leader isn't their own sales but the number of leaders they grow. If you do everything yourself, your team stays dependent on you. When you pass on your knowledge, system, and confidence, your team grows even without you.

## Model first, then teach
People imitate what you do, not what you say. A leader still in the field, still adding prospects, inspires far more than one giving orders from a desk. Show first, then do it alongside them, then let them do it.

> A true leader is one whose team can move forward without needing them.

## Grow their "why"
What motivates a person is not your goal but their own. Discover why your team member is in this business, and on hard days remind them of that "why." When success comes, give them the stage; when something goes wrong, carry the responsibility yourself. People follow a leader like that willingly.`,
      },
      {
        id: 'blog-davet-sanati',
        baslik: 'The Art of the Invite: Inviting Without Pressure',
        emoji: '✉️',
        sure: '6 min read',
        seviye: 'Basic',
        ozet: 'The invite is the heart of the sale. The goal isn’t to convince, but to spark curiosity and call to the next step.',
        format: 'article',
        maddeler: [
          'The goal of the invite is to spark curiosity, not to sell.',
          'Keep it short; don’t explain everything at the invite.',
          'Let your excitement come from sincerity, not pressure.',
          'Offer a clear next step (video, call, event).',
        ],
        govde: `The invite is the heart of this business, because nothing starts until you invite someone. Yet most people fall to one of two extremes: either shyness keeps them from inviting at all, or pressure scares everyone off. The right invite sits between the two.

## The goal of an invite isn’t to sell
Don't try to explain the product, the plan, everything at the moment of invitation. Your only goal: spark curiosity and call to a next step (a video, a short call, an event). The more you explain, the more likely you'll hear "I already know, not interested."

## Be short and clear
- "I found something that might fit your style—would you watch a 10-minute video?"
- "There's a short intro Friday evening; I thought of you."

A short invite is powerful because it makes the decision easy. A long, scattered invite tires the listener.

> People say "yes" not to information, but to your excitement and clarity.

## Excitement yes, pressure no
Your genuine excitement is the most powerful invitation; but "you'll regret it if you miss this" pressure damages trust. Leave people free enough to make their own decision. If you're turned down, keep the relationship: today's "no" can be tomorrow's "yes."`,
      },
      {
        id: 'blog-kisisel-marka',
        baslik: 'Personal Brand: People Trust You First',
        emoji: '✨',
        sure: '6 min read',
        seviye: 'Medium',
        ozet: 'Thousands sell the same product. The difference isn’t the product—it’s you. People trust you first, then your product.',
        format: 'article',
        maddeler: [
          'With the same product, the difference is the trusted person.',
          'Consistency and honesty are the brand’s foundation.',
          'Become known by creating value in one area you know.',
          'Reputation is built slowly and destroyed fast—protect it.',
        ],
        govde: `Thousands of others probably sell the exact product you sell. Same catalog, same plan, same price. So why should someone buy from you? The answer is simple: because they trust you. In network marketing, the real difference isn't the product—it's you.

## Brand = the trust you give
A personal brand isn't a logo or a slogan; it's the feeling that comes to mind when people hear your name. "Honest," "helpful," "knows their craft"—or "always trying to sell something"? You build that perception in every interaction.

## Create value in one area
No one can know everything. Pick an area you're naturally good at and enjoy (health, parenting, entrepreneurship, discipline…) and create consistent value there. Over time you become the "person who comes to mind" on that topic; people start coming to you.

> People buy the person first, then the product.

## Reputation is built slowly, destroyed fast
One exaggerated promise, one broken word, can erase years of trust in a day. That's why your brand's most valuable asset is honesty. Keep your word, say "I don't know" when you don't, protect the relationship before the sale. In the long run, the winner isn't the one who sells most, but the one who is trusted most.`,
      },
      {
        id: 'blog-hikaye-paketleme',
        baslik: 'Story Packaging: Design Your Most Powerful Sales Tool',
        emoji: '📖',
        sure: '8 min read',
        seviye: 'Advanced',
        ozet: 'People aren’t persuaded by data; they’re moved by stories. Packaging your own transformation story well is your strongest sales tool.',
        format: 'article',
        maddeler: [
          'Data informs; stories move people to act.',
          'A good story has a before / turning point / after structure.',
          'The hero is not you—it’s the listener.',
          'Simplify your story so it can be retold again and again.',
        ],
        govde: `The human brain thinks in stories, not spreadsheets. A list of numbers is forgotten, but a well-told story sticks and stirs emotion into action. That's why your most powerful sales tool in network marketing isn't a brochure—it's your well-packaged story.

## Why stories work
Because people see themselves inside the story. "This product contains these vitamins" gives information; "how, as a tired mother of three, I won back my own time with this business" builds connection. Decisions are made with emotion, then justified with logic.

## The structure of a good story
A strong transformation story has three parts:
- **Before:** Your old self—the struggle, the stuck feeling, the frustration. (The listener recognizes themselves here.)
- **Turning point:** The encounter—why you started, the first hesitation, the first spark.
- **After:** The changed life—concrete and honest, never exaggerated.

This trio makes the listener think, "then it's possible for me too."

## You are not the hero
The most common mistake is turning the story into a tale of personal heroics. But the real hero is the listener; you're just the guide who walked the path first. Tell your story so the center isn't your success, but their possibility.

> Facts are told; stories are lived—and people say "yes" to what they live.

## Package and simplify
Your story should be clear enough to tell in 60 seconds or in 5 minutes. Cut the unnecessary details, keep the emotional turning point. Then rehearse it: make it so simple that even your team can easily tell their own version. Because a story that can be copied is a story that scales.`,
      },
    ],
  },
]

export function getTrainingData(lang: 'tr' | 'en'): Kategori[] {
  return lang === 'en' ? EN_KATEGORILER : TR_KATEGORILER
}
