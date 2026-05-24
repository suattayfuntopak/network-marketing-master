export interface Konu {
  id: string
  baslik: string
  emoji: string
  sure: string
  seviye: 'Temel' | 'Orta' | 'İleri' | 'Basic' | 'Medium' | 'Advanced'
  ozet: string
  maddeler: string[]
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
    ],
  },
  {
    id: 'iletisim',
    baslik: 'İletişim & Sunum',
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
    ],
  },
  {
    id: 'strateji',
    baslik: 'Strateji & Büyüme',
    emoji: '📈',
    renk: 'bg-[#FBEAF0] dark:bg-[#3d0f1f] text-[#72243E] dark:text-[#f9a8d4] border-[#F5D9E5] dark:border-[#3d0f1f80]',
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
    ],
  },
  {
    id: 'iletisim',
    baslik: 'Communication & Presenting',
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
    ],
  },
  {
    id: 'strateji',
    baslik: 'Strategy & Momentum',
    emoji: '📈',
    renk: 'bg-[#FBEAF0] dark:bg-[#3d0f1f] text-[#72243E] dark:text-[#f9a8d4] border-[#F5D9E5] dark:border-[#3d0f1f80]',
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
    ],
  },
]

export function getTrainingData(lang: 'tr' | 'en'): Kategori[] {
  return lang === 'en' ? EN_KATEGORILER : TR_KATEGORILER
}
