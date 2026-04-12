import type {
  AcademyContent,
  ContentCategory,
  ContentLevel,
  ContentType,
  Objection,
  ObjectionCategory,
} from './types'

const SYSTEM_DATE = '2026-04-11T00:00:00.000Z'

interface LessonBlueprint {
  slug: string
  type: ContentType
  level: ContentLevel
  readingTime: number
  buildTitle: (label: string) => string
  buildSummary: (subject: CategorySubject) => string
  buildContent: (subject: CategorySubject) => string
  tags: (subject: CategorySubject) => string[]
}

interface CategorySubject {
  category: ContentCategory
  label: string
  target: string
  friction: string
  nextStep: string
  teamAngle: string
  scriptHook: string
  metric: string
  emotion: string
}

interface ObjectionBlueprint {
  suffix: string
  buildQuestion: (pack: ObjectionPack) => string
  buildShort: (pack: ObjectionPack) => string
  buildResponse: (pack: ObjectionPack) => string
  buildApproach: (pack: ObjectionPack) => string
  buildExample: (pack: ObjectionPack) => string
  tags: (pack: ObjectionPack) => string[]
}

interface ObjectionPack {
  category: ObjectionCategory
  shortLabel: string
  rootFear: string
  reframe: string
  nextMove: string
  softQuestion: string
  proof: string
}

type SystemLanguage = 'tr' | 'en'

const LESSON_BLUEPRINTS_TR: LessonBlueprint[] = [
  {
    slug: 'foundation',
    type: 'lesson',
    level: 'beginner',
    readingTime: 8,
    buildTitle: (label) => `${label}: Temeli Doğru Kur`,
    buildSummary: (subject) =>
      `${subject.label} alanında en sık yapılan dağılmayı toparla ve ${subject.target.toLowerCase()} için temiz bir çalışma zemini oluştur.`,
    buildContent: (subject) => `## Bu dersin amacı
${subject.label} tarafında başarı genelde daha fazla konuşmaktan değil, doğru ritmi kurmaktan gelir. Bu içerik sana ${subject.target.toLowerCase()} için sade ama güçlü bir temel verir.

## Neden kritik?
- ${subject.friction}
- ${subject.emotion}
- ${subject.nextStep}

## Çalışan çerçeve
- Önce **niyetini netleştir**: Bu aşamada amacın satış baskısı değil, ${subject.target.toLowerCase()}.
- Sonra **tek odak seç**: Aynı anda her şeyi düzeltmeye çalışma. Bugün sadece ${subject.metric.toLowerCase()} görünür olsun.
- En sonda **ritmi sabitle**: Her temasın sonunda küçük ama belirli bir ${subject.nextStep.toLowerCase()} bırak.

## Saha uygulaması
- Bugün bu kategoriyle ilgili 3 kişiyi seç.
- Her biri için sadece tek bir sonraki adımı yaz.
- Akşam bakarken şunu sor: ${subject.metric} daha görünür hale geldi mi?

## Mini kontrol listesi
- Karmaşık anlattın mı?
- Kişiyi gereksiz savunmaya ittin mi?
- Konuşmanın sonunda net bir sonraki adım bıraktın mı?

## Koç notu
Güç çoğu zaman daha çok şey eklemekte değil, daha az ama daha net ilerlemektedir.`,
    tags: (subject) => [subject.category, 'temel', 'ritim', 'uygulama'],
  },
  {
    slug: 'mistakes',
    type: 'article',
    level: 'intermediate',
    readingTime: 6,
    buildTitle: (label) => `${label}: En Sık 5 Hata`,
    buildSummary: (subject) =>
      `${subject.label} sırasında akışı bozan davranışları gör ve ${subject.target.toLowerCase()} öncesi gereksiz sürtünmeyi azalt.`,
    buildContent: (subject) => `## En sık görülen hata
${subject.label} tarafında insanlar çoğu zaman kötü niyetli değil, sadece fazla açıklayıcı ve dağınık oluyor.

## 5 hata
- **Uzun anlatım**: Kişi daha hazır değilken detay yüklemek.
- **Erken baskı**: Güven oluşmadan karar istemek.
- **Takipsiz bırakmak**: İlgi var ama ${subject.nextStep.toLowerCase()} net değil.
- **Savunmaya cevap yetiştirmek**: Önce anlamak yerine hemen ikna etmeye çalışmak.
- **Ekibi görünmez bırakmak**: ${subject.teamAngle}

## Ne yapmalı?
- Kısa konuş.
- Bir seferde tek hedef taşı.
- Kişinin bağlamını tekrar cümleye koy.
- Konuşmayı bir sonraki küçük adıma bağla.

## Uygulama sorusu
Bugün hangi konuşmada fazla anlattın ama az yön verdin?

## Düzeltme cümlesi
"Sana uzun uzun yüklenmek istemem. En mantıklı küçük sonraki adım şu olabilir..."
`,
    tags: (subject) => [subject.category, 'hatalar', 'sade satış', 'akış'],
  },
  {
    slug: 'script',
    type: 'script',
    level: 'intermediate',
    readingTime: 5,
    buildTitle: (label) => `${label}: Konuşma Çerçevesi`,
    buildSummary: (subject) =>
      `${subject.label} için doğrudan kopyalanabilir bir iskelet kullan; baskıyı değil açıklığı artır.`,
    buildContent: (subject) => `## Ne zaman kullanılır?
${subject.friction}

## Kısa çerçeve
1. **Bağ kur**
${subject.scriptHook}

2. **Bağlamı sadeleştir**
"Seni gereksiz detaya boğmak istemem. Burada asıl mesele ${subject.target.toLowerCase()}."

3. **Tek sonraki adımı öner**
"İstersen şimdi sadece ${subject.nextStep.toLowerCase()} tarafını netleştirelim."

4. **Baskısız kapat**
"Uygun değilse sorun değil, ama istersen bunu sana en kolay haliyle gösterebilirim."

## Dikkat
- Sorular kısa olsun.
- Cümleler günlük dilde kalsın.
- Mesajı tek bir niyete bağla.

## Hızlı varyasyon
"Bugün tek amacım seni ikna etmek değil, ${subject.target.toLowerCase()} daha sade hale getirmek."
`,
    tags: (subject) => [subject.category, 'script', 'mesaj', 'konuşma'],
  },
  {
    slug: 'checklist',
    type: 'cheat_sheet',
    level: 'beginner',
    readingTime: 4,
    buildTitle: (label) => `${label}: Hızlı Kontrol Listesi`,
    buildSummary: (subject) =>
      `${subject.label} çalışırken ekrana dönüp hızla bakabileceğin kısa bir saha listesi.`,
    buildContent: (subject) => `## Bugün kontrol et
- Hedefim net mi?
- ${subject.metric} görünür mü?
- Sonraki adım tek cümleyle yazılı mı?
- Kişi baskı değil netlik hissediyor mu?
- ${subject.teamAngle}

## İyi görünüm
- Konuşmalar kısa ama yönlü.
- Kişi ne olacağını anlıyor.
- Takipler görünür durumda.

## Zayıf görünüm
- Her konuşma ayrı tonda ilerliyor.
- Konu dağılıyor.
- ${subject.nextStep} net bırakılmıyor.

## Gün sonu sorusu
Bugün ${subject.label.toLowerCase()} alanında en çok neyi sadeleştirdin?
`,
    tags: (subject) => [subject.category, 'checklist', 'hızlı bakış', 'saha'],
  },
  {
    slug: 'roleplay',
    type: 'role_play',
    level: 'advanced',
    readingTime: 9,
    buildTitle: (label) => `${label}: Rol Oyunu`,
    buildSummary: (subject) =>
      `${subject.label} anında sahada yaşayacağın gerçek bir senaryoyu kısa bir rol oyunuyla çalış.`,
    buildContent: (subject) => `## Senaryo
Bir kişi ilgi gösteriyor ama ${subject.friction.toLowerCase()}. Eğer konuşma dağılırsa enerji düşecek.

## Amaç
${subject.target} ve konuşmanın sonunda ${subject.nextStep.toLowerCase()}.

## Deneme akışı
### Sen
"Seni uzun anlatımla yormak istemem. Burada en önemli nokta ${subject.target.toLowerCase()}."

### Karşı taraf
"Tamam ama emin değilim."

### Sen
"Bu çok normal. İstersen bugün sadece ${subject.nextStep.toLowerCase()} tarafını netleştirelim."

### Karşı taraf
"Bu bana ne kazandırır?"

### Sen
"Asıl kazanç, konuyu üzerimize yük bindirmeden anlamak. Sonra istersen devam ederiz."

## Değerlendirme
- Baskıyı düşürdün mü?
- Tek adım önerdin mi?
- Savunmaya cevap yetiştirmek yerine alan açtın mı?
`,
    tags: (subject) => [subject.category, 'rol oyunu', 'uygulama', 'diyalog'],
  },
  {
    slug: 'review',
    type: 'success_story',
    level: 'advanced',
    readingTime: 7,
    buildTitle: (label) => `${label}: Haftalık Gözden Geçirme`,
    buildSummary: (subject) =>
      `${subject.label} tarafında neyin gerçekten çalıştığını görmek için haftalık bir lider gözden geçirme ritmi kur.`,
    buildContent: (subject) => `## Neyi gözden geçiriyoruz?
${subject.label} iyi gidiyor gibi görünse bile esas kalite ${subject.metric.toLowerCase()} içinde anlaşılır.

## Haftalık lider soruları
- Bu hafta hangi dil daha çok işe yaradı?
- Hangi noktada gereksiz açıklama arttı?
- ${subject.teamAngle}
- İnsanlar nerede rahatladı, nerede savunmaya geçti?

## Başarı işaretleri
- Konuşma süreleri kısalır ama ilerleme artar.
- Takipler daha görünür hale gelir.
- ${subject.target} daha az eforla olur.

## Takıma koçluk cümlesi
"Bu hafta daha fazla konuşmaya değil, daha net ve tekrar edilebilir bir akışa ihtiyacımız var."

## Bir sonraki hafta için karar
Takımca sadece tek bir davranış seç ve tüm hafta onu standardize et.
`,
    tags: (subject) => [subject.category, 'liderlik', 'haftalık gözden geçirme', 'koçluk'],
  },
]

const LESSON_BLUEPRINTS_EN: LessonBlueprint[] = [
  {
    slug: 'foundation',
    type: 'lesson',
    level: 'beginner',
    readingTime: 8,
    buildTitle: (label) => `${label}: Build the Right Foundation`,
    buildSummary: (subject) =>
      `Remove the usual friction in ${subject.label.toLowerCase()} and create a cleaner base for ${subject.target.toLowerCase()}.`,
    buildContent: (subject) => `## What this lesson is for
In ${subject.label.toLowerCase()}, progress rarely comes from saying more. It comes from building the right rhythm. This lesson gives you a simple base for ${subject.target.toLowerCase()}.

## Why it matters
- ${subject.friction}
- ${subject.emotion}
- ${subject.nextStep}

## A working frame
- **Clarify the intent**: the goal here is not pressure, but ${subject.target.toLowerCase()}.
- **Choose one focus**: do not fix everything at once. Let ${subject.metric.toLowerCase()} become visible first.
- **Protect the rhythm**: every touch should end with a small but clear ${subject.nextStep.toLowerCase()}.

## Field application
- Pick 3 people for this category today.
- Write just one next step for each of them.
- Ask at the end of the day: did ${subject.metric.toLowerCase()} become more visible?

## Quick checklist
- Did you over-explain?
- Did you trigger defensiveness too early?
- Did you leave a visible next step?

## Coach note
Strength often comes from making the flow simpler, not heavier.`,
    tags: (subject) => [subject.category, 'foundation', 'rhythm', 'execution'],
  },
  {
    slug: 'mistakes',
    type: 'article',
    level: 'intermediate',
    readingTime: 6,
    buildTitle: (label) => `${label}: The 5 Most Common Mistakes`,
    buildSummary: (subject) =>
      `See the behaviors that usually slow ${subject.label.toLowerCase()} down and reduce friction before ${subject.target.toLowerCase()}.`,
    buildContent: (subject) => `## The common pattern
In ${subject.label.toLowerCase()}, most people are not doing the wrong thing on purpose. They are usually just over-explaining and under-structuring the moment.

## 5 mistakes
- **Too much detail** before the person is ready.
- **Pressure too early** before trust is in place.
- **No visible next step** after interest appears.
- **Responding too fast** instead of first understanding the hesitation.
- **Leaving the team invisible**: ${subject.teamAngle}

## What to do instead
- Keep the language short.
- Carry one goal at a time.
- Put the person’s context back into the conversation.
- End with one visible next step.

## Review question
Where did you say too much and guide too little today?

## Reset sentence
"I do not want to overload this. The cleanest next step may simply be..."
`,
    tags: (subject) => [subject.category, 'mistakes', 'clarity', 'flow'],
  },
  {
    slug: 'script',
    type: 'script',
    level: 'intermediate',
    readingTime: 5,
    buildTitle: (label) => `${label}: Conversation Framework`,
    buildSummary: (subject) =>
      `Use a clean, reusable structure for ${subject.label.toLowerCase()} and raise clarity without sounding pushy.`,
    buildContent: (subject) => `## When to use it
${subject.friction}

## Short framework
1. **Connect**
${subject.scriptHook}

2. **Simplify the context**
"I do not want to drown you in details. The real point here is ${subject.target.toLowerCase()}."

3. **Offer one next step**
"If you want, we can just clarify ${subject.nextStep.toLowerCase()} for now."

4. **Close without pressure**
"If now is not the right moment, no problem. I can still show you the simplest version."

## Keep in mind
- Short questions.
- Everyday language.
- One intention per message.

## Fast variation
"My goal is not to convince you right now, but to make ${subject.target.toLowerCase()} feel lighter."
`,
    tags: (subject) => [subject.category, 'script', 'message', 'framework'],
  },
  {
    slug: 'checklist',
    type: 'cheat_sheet',
    level: 'beginner',
    readingTime: 4,
    buildTitle: (label) => `${label}: Quick Checklist`,
    buildSummary: (subject) =>
      `A short field checklist you can return to when you want ${subject.label.toLowerCase()} to stay clean.`,
    buildContent: (subject) => `## Check today
- Is the goal clear?
- Is ${subject.metric.toLowerCase()} visible?
- Is the next step written in one sentence?
- Does the person feel clarity rather than pressure?
- ${subject.teamAngle}

## Strong look
- Conversations are short but directed.
- The person understands what comes next.
- Follow-up rhythm stays visible.

## Weak look
- Every conversation has a different tone.
- The topic gets diluted.
- ${subject.nextStep} is left vague.

## End-of-day question
What did you simplify most in ${subject.label.toLowerCase()} today?
`,
    tags: (subject) => [subject.category, 'checklist', 'field', 'speed'],
  },
  {
    slug: 'roleplay',
    type: 'role_play',
    level: 'advanced',
    readingTime: 9,
    buildTitle: (label) => `${label}: Role Play`,
    buildSummary: (subject) =>
      `Practice a real field moment from ${subject.label.toLowerCase()} with a short role-play structure.`,
    buildContent: (subject) => `## Scenario
Someone shows interest, but ${subject.friction.toLowerCase()}. If the moment gets messy, the energy will drop.

## Goal
${subject.target} and a visible ${subject.nextStep.toLowerCase()} before the conversation ends.

## Practice flow
### You
"I do not want to make this heavy. The most important thing here is ${subject.target.toLowerCase()}."

### Other person
"Okay, but I am not sure."

### You
"That makes sense. If you want, we can just clarify ${subject.nextStep.toLowerCase()} for now."

### Other person
"What would that really give me?"

### You
"Mainly clarity without extra pressure. Then you can decide whether it is worth going further."

## Review
- Did you lower pressure?
- Did you suggest one next step?
- Did you create room instead of rushing to defend?
`,
    tags: (subject) => [subject.category, 'role play', 'practice', 'dialogue'],
  },
  {
    slug: 'review',
    type: 'success_story',
    level: 'advanced',
    readingTime: 7,
    buildTitle: (label) => `${label}: Weekly Review Rhythm`,
    buildSummary: (subject) =>
      `Build a weekly leader review around ${subject.label.toLowerCase()} so the team can see what is truly working.`,
    buildContent: (subject) => `## What are we reviewing?
Even when ${subject.label.toLowerCase()} looks busy, the real quality shows up in ${subject.metric.toLowerCase()}.

## Weekly leader questions
- Which language worked best this week?
- Where did explanation grow while clarity dropped?
- ${subject.teamAngle}
- Where did people relax, and where did they go defensive?

## Signs of strength
- Conversations get shorter while progress improves.
- Follow-up visibility improves.
- ${subject.target} happens with less effort.

## Team coaching line
"This week we do not need more talking. We need a cleaner, more repeatable flow."

## Next-week decision
Choose one behavior as a team and standardize that one thing all week.
`,
    tags: (subject) => [subject.category, 'leadership', 'weekly review', 'coaching'],
  },
]

const CATEGORY_SUBJECTS_TR: CategorySubject[] = [
  {
    category: 'mindset',
    label: 'Zihniyet',
    target: 'özgüvenli ama yardım odaklı bir duruş kurmak',
    friction: 'İnsanlar ya fazla çekingen kalıyor ya da fazla satış baskısı kuruyor.',
    nextStep: 'bir sonraki küçük adımı görünür bırakmak',
    teamAngle: 'Takım dilinin güven veren ama sade bir hatta kalması gerekir.',
    scriptHook: '"Bugün seni zorlamak için değil, daha net bir resim çizmek için yazıyorum."',
    metric: 'günlük aksiyon ritmi',
    emotion: 'Karşı tarafın da senin de üzerindeki baskıyı düşürür.',
  },
  {
    category: 'prospecting',
    label: 'Aday Bulma',
    target: 'sağlam bir aday akışı üretmek',
    friction: 'Liste kurma ertelendikçe bütün iş sadece sıcak birkaç kişiye sıkışıyor.',
    nextStep: 'ilk temas sırasını belirlemek',
    teamAngle: 'Ekip, aday havuzunu kişisel çevreyle sınırlamadan büyütmeyi öğrenir.',
    scriptHook: '"Aklıma geldin çünkü şu an doğru kişileri sakin ve seçici biçimde toparlıyorum."',
    metric: 'yeni aday görünürlüğü',
    emotion: 'Dağınık arama hissi yerine kontrollü bir büyüme hissi verir.',
  },
  {
    category: 'inviting',
    label: 'Davet',
    target: 'ilk konuşmayı meraka çevirmek',
    friction: 'Davetler ya fazla belirsiz ya da erken detay yüklü kaldığında geri dönüş düşer.',
    nextStep: 'kısa bir görüşme veya sunum daveti bırakmak',
    teamAngle: 'Takımın davet tonu ne kadar ortaksa sonuçlar o kadar öngörülebilir olur.',
    scriptHook: '"Sana uzun uzun anlatmak için değil, fikrini merak ettiğim küçük bir konu için yazıyorum."',
    metric: 'davet kabul oranı',
    emotion: 'Karşı tarafın savunmaya geçmesini azaltır.',
  },
  {
    category: 'presenting',
    label: 'Sunum',
    target: 'sunumu karşı tarafın ihtiyacına bağlamak',
    friction: 'Sunumlar ürün veya fırsat anlatısına boğulunca ilgi var gibi görünse de enerji düşer.',
    nextStep: 'sunum sonrası tek net karar kapısı bırakmak',
    teamAngle: 'Takım aynı sunumu farklı değil, tutarlı bir omurgayla vermeli.',
    scriptHook: '"Bugün her şeyi anlatmak yerine sana en relevant kısmı göstermek isterim."',
    metric: 'sunum sonrası hareket',
    emotion: 'Kişinin kendini dinlenmiş hissetmesini sağlar.',
  },
  {
    category: 'closing',
    label: 'Karar Aşaması',
    target: 'karar sürtünmesini azaltmak',
    friction: 'İlgi olduğu halde son adım netleşmediğinde süreç gereksiz yere uzar.',
    nextStep: 'kararı kolaylaştıran tek bir öneri sunmak',
    teamAngle: 'Takım baskı yerine netlik ve güven dili kullanmalıdır.',
    scriptHook: '"Burada seni sıkıştırmak değil, kararını kolaylaştırmak istiyorum."',
    metric: 'karar ilerleme oranı',
    emotion: 'Karar yükünü azaltır ve karşı tarafın kontrol hissini korur.',
  },
  {
    category: 'follow_up',
    label: 'Takip',
    target: 'ritmi kaybetmeden geri dönmek',
    friction: 'İyi konuşmalar bile takip görünmez olduğunda sessizliğe düşer.',
    nextStep: 'takip tarihini ve mesaj tonunu netleştirmek',
    teamAngle: 'Takım için ortak takip standardı güven verir.',
    scriptHook: '"Sadece kısaca yoklayıp doğru zamanda dönmek istedim."',
    metric: 'takip görünürlüğü',
    emotion: 'İlgiyi baskı yaratmadan canlı tutar.',
  },
  {
    category: 'team_building',
    label: 'Ekip Kurma',
    target: 'yeni üyeyi aktif ritme almak',
    friction: 'Yeni katılan kişi neyi ne sırayla yapacağını bilmeyince hızlıca soğuyabiliyor.',
    nextStep: 'ilk basit çalışma haftasını netleştirmek',
    teamAngle: 'Takımın kopyalanabilir başlangıç ritmi olması gerekir.',
    scriptHook: '"Sana zor bir sistem değil, çalıştırması kolay bir başlangıç akışı göstereceğim."',
    metric: 'aktif ekip oranı',
    emotion: 'Yeni kişinin yük altında değil destek altında hissetmesini sağlar.',
  },
  {
    category: 'leadership',
    label: 'Liderlik',
    target: 'ekibi görünür veri ve sade koçlukla yönetmek',
    friction: 'Liderler her şeye yetişmeye çalışınca ekipte yön netliği kaybolur.',
    nextStep: 'tek davranış odaklı haftalık koçluk vermek',
    teamAngle: 'Takımın en çok ihtiyacı uzun motivasyon değil, net lider sinyalidir.',
    scriptHook: '"Bu hafta hepimizin aynı davranışı güçlendirmesini istiyorum."',
    metric: 'ekip ritim skoru',
    emotion: 'Takımda panik yerine yön duygusu oluşturur.',
  },
  {
    category: 'social_media',
    label: 'Sosyal Medya',
    target: 'görünürlüğü satış baskısına çevirmeden artırmak',
    friction: 'Paylaşımlar ya çok genel kalıyor ya da fazlaca fırsat kokuyor.',
    nextStep: 'konuşma başlatan içerik çizgisini korumak',
    teamAngle: 'Takımın dijital dili kişisel ama tutarlı olmalı.',
    scriptHook: '"İnsanların önce kendini güvende hissettiği bir içerik hattı kuruyoruz."',
    metric: 'gelen mesaj kalitesi',
    emotion: 'Marka hissini yormadan merak üretir.',
  },
  {
    category: 'product_knowledge',
    label: 'Ürün Bilgisi',
    target: 'ürünü ezber gibi değil ihtiyaç bağlamında anlatmak',
    friction: 'Ürün avantajları listeye dönünce karşı taraf kendini anlatının dışında hisseder.',
    nextStep: 'kişinin ihtiyacına bağlı tek faydayı netleştirmek',
    teamAngle: 'Takım ürün dilini özellik değil fayda üzerinden ortaklaştırmalı.',
    scriptHook: '"Ürünü anlatmadan önce senin tarafında neyin önemli olduğunu anlamak isterim."',
    metric: 'ürün ilgisi dönüşü',
    emotion: 'Karşı tarafın ürünle kendi hayatı arasında bağ kurmasını sağlar.',
  },
  {
    category: 'company_info',
    label: 'Şirket Bilgisi',
    target: 'güveni gereksiz kurumsal yük olmadan kurmak',
    friction: 'Şirket anlatımı çok erken veya çok ağır olunca güven yerine mesafe oluşabilir.',
    nextStep: 'güven için yeterli ama hafif bir çerçeve sunmak',
    teamAngle: 'Takım şirket bilgisini savunmacı değil sakin bir dille taşımalı.',
    scriptHook: '"Önce büyük iddia değil, sağlam ve sade bir çerçeve vermek isterim."',
    metric: 'güven eşiği',
    emotion: 'Kurumsal güç gösterisi yerine sakin güven üretir.',
  },
  {
    category: 'compliance',
    label: 'Etik ve Uyum',
    target: 'güven kaybetmeden etik çizgide büyümek',
    friction: 'Abartılı vaatler kısa vadede ilgi çekse de uzun vadede tüm yapıyı zedeler.',
    nextStep: 'doğru ifade standardını görünür kılmak',
    teamAngle: 'Takımın ortak dili hem güveni hem sürdürülebilirliği korur.',
    scriptHook: '"Burada doğruyu sade söylemek, güçlü görünmeye çalışmaktan daha değerli."',
    metric: 'güvenilir iletişim oranı',
    emotion: 'Hem ekipte hem adayda daha güvenli bir zemin kurar.',
  },
]

const CATEGORY_SUBJECTS_EN: CategorySubject[] = [
  {
    category: 'mindset',
    label: 'Mindset',
    target: 'building a confident but helpful presence',
    friction: 'People often drift into either hesitation or too much pressure.',
    nextStep: 'leaving one small next step visible',
    teamAngle: 'The team needs a tone that feels calm, confident, and repeatable.',
    scriptHook: '"I am not reaching out to pressure you, just to make the picture clearer."',
    metric: 'daily action rhythm',
    emotion: 'It lowers pressure for both you and the other person.',
  },
  {
    category: 'prospecting',
    label: 'Prospecting',
    target: 'creating a healthier prospect flow',
    friction: 'When list building gets delayed, the whole business collapses onto a few warm people.',
    nextStep: 'setting the order of first touches',
    teamAngle: 'The team should learn how to expand beyond only the personal circle.',
    scriptHook: '"You came to mind because I am carefully gathering the right people right now."',
    metric: 'new prospect visibility',
    emotion: 'It replaces scattered searching with controlled growth.',
  },
  {
    category: 'inviting',
    label: 'Inviting',
    target: 'turning first contact into curiosity',
    friction: 'When invites are too vague or too loaded, response rates drop.',
    nextStep: 'leaving a short call or presentation invite',
    teamAngle: 'The more consistent the team invitation tone is, the more predictable the results become.',
    scriptHook: '"I am not here to dump details on you, just to get your quick take on something."',
    metric: 'invite acceptance rate',
    emotion: 'It lowers the chance that the person feels defensive.',
  },
  {
    category: 'presenting',
    label: 'Presenting',
    target: 'connecting the presentation to the person’s need',
    friction: 'When presentations become heavy on product or opportunity detail, the energy drops even if interest is present.',
    nextStep: 'leaving one clean decision doorway after the presentation',
    teamAngle: 'The team should not present in random styles; it needs one clear spine.',
    scriptHook: '"Rather than explaining everything, I want to show you the part most relevant to you."',
    metric: 'post-presentation movement',
    emotion: 'It helps the other person feel understood, not talked at.',
  },
  {
    category: 'closing',
    label: 'Closing',
    target: 'reducing decision friction',
    friction: 'Even with clear interest, the process drags when the last step stays vague.',
    nextStep: 'offering one decision-lightening suggestion',
    teamAngle: 'The team should use clarity and confidence, not pressure.',
    scriptHook: '"I am not trying to corner you here. I want to make the decision easier."',
    metric: 'decision progress rate',
    emotion: 'It keeps the person’s sense of control intact.',
  },
  {
    category: 'follow_up',
    label: 'Follow-up',
    target: 'coming back without losing rhythm',
    friction: 'Even good conversations go quiet when follow-up becomes invisible.',
    nextStep: 'clarifying the follow-up date and message tone',
    teamAngle: 'A shared follow-up standard gives the team confidence.',
    scriptHook: '"I just wanted to check in briefly and come back at the right moment."',
    metric: 'follow-up visibility',
    emotion: 'It keeps interest warm without creating pressure.',
  },
  {
    category: 'team_building',
    label: 'Team Building',
    target: 'moving a new member into active rhythm',
    friction: 'New people cool off quickly when they do not know what to do first.',
    nextStep: 'clarifying a simple first working week',
    teamAngle: 'The team needs a repeatable starting rhythm.',
    scriptHook: '"I want to show you an easy starting flow, not a heavy system."',
    metric: 'active team ratio',
    emotion: 'It helps the new person feel supported rather than overloaded.',
  },
  {
    category: 'leadership',
    label: 'Leadership',
    target: 'managing the team with visible data and simple coaching',
    friction: 'When leaders try to do everything, the team loses direction.',
    nextStep: 'giving one behavior-focused coaching target each week',
    teamAngle: 'The team does not need more motivation speeches. It needs clear leader signals.',
    scriptHook: '"This week I want us all strengthening the same one behavior."',
    metric: 'team rhythm score',
    emotion: 'It creates direction instead of panic.',
  },
  {
    category: 'social_media',
    label: 'Social Media',
    target: 'growing visibility without creating sales pressure',
    friction: 'Content either becomes too generic or smells too much like the opportunity.',
    nextStep: 'protecting a conversation-starting content style',
    teamAngle: 'The team’s digital tone should feel personal but coherent.',
    scriptHook: '"We are building a content line where people feel safe before they feel sold to."',
    metric: 'message quality from inbound',
    emotion: 'It creates curiosity without exhausting the brand feeling.',
  },
  {
    category: 'product_knowledge',
    label: 'Product Knowledge',
    target: 'explaining the product through need, not memorization',
    friction: 'When product advantages become a list, the other person stops seeing themselves in the story.',
    nextStep: 'clarifying one benefit tied to their need',
    teamAngle: 'The team should align around benefits, not feature dumping.',
    scriptHook: '"Before I explain the product, I want to understand what matters most on your side."',
    metric: 'product-interest conversion',
    emotion: 'It helps the person connect the product to real life.',
  },
  {
    category: 'company_info',
    label: 'Company Information',
    target: 'building trust without corporate overload',
    friction: 'When company information arrives too early or too heavily, it creates distance instead of trust.',
    nextStep: 'offering a light but credible trust frame',
    teamAngle: 'The team should carry company information in a calm, non-defensive tone.',
    scriptHook: '"I do not want to lead with claims. I want to give you a simple, solid frame."',
    metric: 'trust threshold',
    emotion: 'It creates steady trust instead of performance theater.',
  },
  {
    category: 'compliance',
    label: 'Compliance',
    target: 'growing on an ethical and sustainable line',
    friction: 'Big claims may create short-term attention, but they damage the whole system over time.',
    nextStep: 'making the right language standard visible',
    teamAngle: 'A shared language protects both trust and sustainability.',
    scriptHook: '"Saying the truth simply matters more than sounding impressive."',
    metric: 'trust-safe communication rate',
    emotion: 'It creates a safer base for both the team and the prospect.',
  },
]

const OBJECTION_BLUEPRINTS_TR: ObjectionBlueprint[] = [
  {
    suffix: 'core',
    buildQuestion: (pack) => pack.rootFear,
    buildShort: (pack) => `${pack.reframe} Önce sadece ${pack.nextMove.toLowerCase()} tarafını netleştirelim.`,
    buildResponse: (pack) => `${pack.reframe}

Burada hemen büyük bir karar vermeni beklemiyorum. Daha sağlıklı olan şey, önce ${pack.nextMove.toLowerCase()} kısmını sakin biçimde görmek. Sonra sana uyuyorsa ilerlersin, uymuyorsa da boş yere yük almamış olursun.

${pack.proof}`,
    buildApproach: (pack) => `Önce kaygıyı kabul et, sonra baskıyı düşür ve konuşmayı ${pack.nextMove.toLowerCase()} tarafına indir.`,
    buildExample: (pack) => `Aday: ${pack.rootFear}

Sen: Çok normal. Bir anda karar vermeni istemem.

Sen: İstersen önce sadece ${pack.nextMove.toLowerCase()} tarafına bakalım.

Sen: ${pack.softQuestion}`,
    tags: (pack) => [pack.category, 'itiraz', 'sakin cevap', 'ikna değil netlik'],
  },
  {
    suffix: 'identity',
    buildQuestion: (pack) => pack.rootFear,
    buildShort: (pack) => `${pack.reframe} Bu iş herkese aynı kalıpla yürümez; sana uygun ${pack.nextMove.toLowerCase()} bulmak daha önemli.`,
    buildResponse: (pack) => `${pack.reframe}

Zaten amaç seni başkasının kalıbına sokmak değil. Bu tür durumlarda en doğru yaklaşım, sana uyan en küçük ${pack.nextMove.toLowerCase()} görmek. Büyük tabloyu sonra konuşuruz.

${pack.proof}`,
    buildApproach: () => `Kimlik savunmasını kırmaya çalışma; kişiye kendi hızında ilerleyebileceği hafif bir kapı aç.`,
    buildExample: (pack) => `Aday: Ben o tarz biri değilim.

Sen: Olmak zorunda da değilsin.

Sen: Benim için daha önemli olan, sana uygun bir ${pack.nextMove.toLowerCase()} var mı onu görmek.

Sen: ${pack.softQuestion}`,
    tags: (pack) => [pack.category, 'kimlik itirazı', 'uyum', 'mikro adım'],
  },
  {
    suffix: 'delay',
    buildQuestion: (pack) => pack.rootFear,
    buildShort: (pack) => `${pack.reframe} Kararı büyütmek yerine ${pack.nextMove.toLowerCase()} küçültelim.`,
    buildResponse: (pack) => `${pack.reframe}

Bu cümle genelde istememekten çok, kararın ağır gelmesi demektir. O yüzden büyük sonuca değil, küçük bir ${pack.nextMove.toLowerCase()} bakmak daha iyi olur. Böylece konu zihninde yük olmadan netleşir.

${pack.proof}`,
    buildApproach: () => `Erteleme cümlesini ret gibi okumadan, karar yükünü küçült ve konuşmayı bir adım hafiflet.`,
    buildExample: (pack) => `Aday: Biraz bekleyeyim.

Sen: Tabii, acele ettirmek istemem.

Sen: İstersen bunu büyük bir karar gibi değil, sadece ${pack.nextMove.toLowerCase()} gibi düşünelim.

Sen: ${pack.softQuestion}`,
    tags: (pack) => [pack.category, 'erteleme', 'karar yükü', 'yumuşak takip'],
  },
]

const OBJECTION_BLUEPRINTS_EN: ObjectionBlueprint[] = [
  {
    suffix: 'core',
    buildQuestion: (pack) => pack.rootFear,
    buildShort: (pack) => `${pack.reframe} Let us first make ${pack.nextMove.toLowerCase()} clearer.`,
    buildResponse: (pack) => `${pack.reframe}

I am not expecting a big decision right now. The healthier move is simply to look at ${pack.nextMove.toLowerCase()} in a calm way. If it fits, we continue. If not, you do not carry unnecessary pressure.

${pack.proof}`,
    buildApproach: (pack) => `Acknowledge the concern, lower the pressure, and move the conversation toward ${pack.nextMove.toLowerCase()}.`,
    buildExample: (pack) => `Prospect: ${pack.rootFear}

You: That makes sense. I would not want you making a rushed decision.

You: If you want, we can just look at ${pack.nextMove.toLowerCase()} first.

You: ${pack.softQuestion}`,
    tags: (pack) => [pack.category, 'objection', 'calm response', 'clarity'],
  },
  {
    suffix: 'identity',
    buildQuestion: (pack) => pack.rootFear,
    buildShort: (pack) => `${pack.reframe} This does not have to look the same for everyone; the real question is what ${pack.nextMove.toLowerCase()} would fit you.`,
    buildResponse: (pack) => `${pack.reframe}

The point is not to force you into someone else’s style. The better move is to find the smallest ${pack.nextMove.toLowerCase()} that would actually fit your reality. We can talk about the bigger picture later.

${pack.proof}`,
    buildApproach: () => `Do not argue with the identity statement. Open a lighter path that still feels personally safe.`,
    buildExample: (pack) => `Prospect: I am not really that kind of person.

You: You do not have to be.

You: What matters more is whether there is a version of ${pack.nextMove.toLowerCase()} that fits your situation.

You: ${pack.softQuestion}`,
    tags: (pack) => [pack.category, 'identity objection', 'fit', 'micro step'],
  },
  {
    suffix: 'delay',
    buildQuestion: (pack) => pack.rootFear,
    buildShort: (pack) => `${pack.reframe} Instead of making the decision bigger, let us make ${pack.nextMove.toLowerCase()} smaller.`,
    buildResponse: (pack) => `${pack.reframe}

That line usually means the decision feels too heavy, not that the interest is gone. So rather than pushing the outcome, it is better to shrink the conversation down to one simple ${pack.nextMove.toLowerCase()}. That keeps the topic clear without adding weight.

${pack.proof}`,
    buildApproach: () => `Do not treat delay like rejection. Reduce the decision load and move toward one lighter step.`,
    buildExample: (pack) => `Prospect: I think I should wait.

You: Of course. I do not want to rush you.

You: If it helps, we can treat this as a small ${pack.nextMove.toLowerCase()} rather than a big decision.

You: ${pack.softQuestion}`,
    tags: (pack) => [pack.category, 'delay', 'decision load', 'gentle follow-up'],
  },
]

const OBJECTION_PACKS_TR: ObjectionPack[] = [
  {
    category: 'money',
    shortLabel: 'Para çekincesi',
    rootFear: 'Bütçemi zorlar diye çekiniyorum.',
    reframe: 'Bu çoğu zaman gerçekten para itirazından çok, yanlış karar verme korkusudur.',
    nextMove: 'küçük bir başlangıç opsiyonunu görmek',
    softQuestion: 'En risksiz başlangıç şeklini birlikte görsek rahatlatır mı?',
    proof: 'Birçok kişi önce küçük ve kontrollü bir denemeyle rahatlıyor; netlik geldikçe karar vermek kolaylaşıyor.',
  },
  {
    category: 'time',
    shortLabel: 'Zaman çekincesi',
    rootFear: 'Zaten yeterince yoğunum, buna zaman ayıramam.',
    reframe: 'Zaman itirazı çoğu zaman ek yük korkusudur.',
    nextMove: 'haftalık hafif çalışma planını görmek',
    softQuestion: 'Bunu yoğun hayatına göre hafifletilmiş haliyle görsek daha gerçekçi olur mu?',
    proof: 'İnsanlar genelde tüm sistemi hayal edip yoruluyor; ama küçük bir haftalık ritim görünce tablo yumuşuyor.',
  },
  {
    category: 'trust',
    shortLabel: 'Güven çekincesi',
    rootFear: 'Tam güvenmeden adım atmak istemiyorum.',
    reframe: 'Bu kötü bir işaret değil; sadece daha sakin ve şeffaf bir çerçeve ihtiyacı var.',
    nextMove: 'sade bir güven çerçevesi kurmak',
    softQuestion: 'Sende güveni artıracak en kritik iki başlığı önce açsak iyi gelir mi?',
    proof: 'Güven çoğu zaman büyük iddialarla değil, sakin ve tutarlı açıklıkla oluşuyor.',
  },
  {
    category: 'family',
    shortLabel: 'Aile onayı',
    rootFear: 'Ailem ne der bilmiyorum, önce onu düşünmem lazım.',
    reframe: 'Bu, çoğu zaman tek başına karar almak istememek anlamına gelir.',
    nextMove: 'konuyu aileye sade anlatacak çerçeveyi görmek',
    softQuestion: 'Ailene bunu nasıl sade anlatabileceğini birlikte netleştirelim mi?',
    proof: 'Karşı taraf aileye nasıl anlatacağını gördüğünde baskı hissi ciddi biçimde azalır.',
  },
  {
    category: 'fear',
    shortLabel: 'Başarısızlık korkusu',
    rootFear: 'Ya yapamazsam ya da rezil olursam diye korkuyorum.',
    reframe: 'Burada korku genelde kapasite değil, görünür başarısızlık endişesidir.',
    nextMove: 'güvenli ilk adımı tanımlamak',
    softQuestion: 'İlk adımı neredeyse sıfır riskli hale getirsek rahatlar mısın?',
    proof: 'İnsanlar genelde büyük resmi görünce çekinir; güvenli ilk adım görünür olunca cesaret artar.',
  },
  {
    category: 'experience',
    shortLabel: 'Deneyim eksikliği',
    rootFear: 'Ben bu konularda deneyimli değilim.',
    reframe: 'Deneyim eksikliği çoğu zaman öğrenme eşiğinin gözde büyümesidir.',
    nextMove: 'öğrenmesi kolay ilk çalışma akışını görmek',
    softQuestion: 'Bunu sıfır deneyimle başlayacak biri gibi sadeleştirsek bakmak ister misin?',
    proof: 'İnsanlar ustalık değil, yönetilebilir bir başlangıç gördüğünde çok daha rahat ilerler.',
  },
  {
    category: 'product',
    shortLabel: 'Ürün şüphesi',
    rootFear: 'Ürünün bana ya da çevreme uygun olup olmadığından emin değilim.',
    reframe: 'Bu genelde ürün karşıtlığı değil, kişisel faydanın netleşmemesidir.',
    nextMove: 'tek somut faydayı bağlamak',
    softQuestion: 'Sence en önemli ihtiyaç hangi başlık; oradan baksak daha anlamlı olur mu?',
    proof: 'Kişi kendi ihtiyacına bağlı bir fayda gördüğünde ürün daha gerçek görünmeye başlar.',
  },
  {
    category: 'company',
    shortLabel: 'Şirket şüphesi',
    rootFear: 'Şirket tarafı bana çok net gelmiyor.',
    reframe: 'Bu çekince savunulacak değil, sakinleştirilecek bir güven ihtiyacıdır.',
    nextMove: 'şirketi sade ve şeffaf anlatmak',
    softQuestion: 'Şirketle ilgili en çok hangi nokta sende soru işareti bırakıyor?',
    proof: 'Kurumsal detay yığını yerine iki üç sağlam netlik başlığı daha çok güven üretir.',
  },
  {
    category: 'pyramid',
    shortLabel: 'Piramit algısı',
    rootFear: 'Bu bana piramit sistem gibi geliyor.',
    reframe: 'Bu itiraz genelde kötü deneyim hikayelerinin bıraktığı savunmadan gelir.',
    nextMove: 'farkı yalın şekilde göstermek',
    softQuestion: 'İstersen önce bunu neden öyle düşündürdüğünü konuşalım mı?',
    proof: 'İnsanlar karşılaştırmalı ve sakin bir açıklama duyduğunda önyargı hızla yumuşayabiliyor.',
  },
  {
    category: 'no_network',
    shortLabel: 'Çevrem yok',
    rootFear: 'Benim çevrem geniş değil, o yüzden yürümez.',
    reframe: 'Bu itiraz çoğu zaman ilişki kaynağını yanlış tanımlamaktan gelir.',
    nextMove: 'ilk aday havuzunu sade kurmak',
    softQuestion: 'Çevreyi sadece yakın arkadaş olarak düşünmesek, liste daha gerçek görünür mü?',
    proof: 'İnsanlar çevre tanımını genişlettiğinde başlangıçta düşündüğünden çok daha fazla seçeneği olduğunu fark ediyor.',
  },
  {
    category: 'introvert',
    shortLabel: 'İçe dönüklük',
    rootFear: 'Ben çok sosyal ya da girişken biri değilim.',
    reframe: 'Bu iş sadece dışa dönük insanlara göreymiş gibi görünse de asıl ihtiyaç bağ kuran tutarlılıktır.',
    nextMove: 'kişiliğe uygun temas şeklini bulmak',
    softQuestion: 'Daha sakin ve bire bir ilerleyen bir model sana daha uygun olur mu?',
    proof: 'Birçok içe dönük kişi, doğal ve bire bir iletişimle çok daha sürdürülebilir sonuç alıyor.',
  },
  {
    category: 'employed',
    shortLabel: 'Çalışıyorum',
    rootFear: 'Tam zamanlı çalıştığım için bunu yürütemem.',
    reframe: 'Bu çoğu zaman ikinci bir tam zamanlı iş korkusudur.',
    nextMove: 'yan akış gibi ilerleyen düzeni görmek',
    softQuestion: 'Bunu işinin yanına eklenen hafif bir akış gibi kursak daha mümkün görünür mü?',
    proof: 'İnsanlar baştan tam performans beklenmediğini görünce çok daha gerçekçi yaklaşabiliyor.',
  },
  {
    category: 'wait',
    shortLabel: 'Bir düşüneyim',
    rootFear: 'Biraz düşüneyim, şu an net değilim.',
    reframe: 'Bu cümle çoğu zaman hayır değil; kararın henüz yeterince hafif hissettirmemesi demektir.',
    nextMove: 'düşünmeyi kolaylaştıran tek soruyu netleştirmek',
    softQuestion: 'Kararı netleştirmek için şu an en büyük soru işaretin ne?',
    proof: 'İnsanlar neyi düşündüğünü adlandırabildiğinde süreç yeniden akmaya başlıyor.',
  },
  {
    category: 'other',
    shortLabel: 'Genel çekince',
    rootFear: 'İçimde tam oturmayan bir şey var ama net söyleyemiyorum.',
    reframe: 'Bazen net bir itiraz değil, dağınık bir tereddüt olur.',
    nextMove: 'çekincenin adını koymak',
    softQuestion: 'Sence bu daha çok güven, zaman, para yoksa başka bir şey mi?',
    proof: 'İtiraz adını bulduğunda konuşma muğlaklıktan çıkıp çözülebilir hale gelir.',
  },
]

const OBJECTION_PACKS_EN: ObjectionPack[] = [
  {
    category: 'money',
    shortLabel: 'Money concern',
    rootFear: 'I am worried it would stretch my budget.',
    reframe: 'This is often less about money itself and more about the fear of making the wrong decision.',
    nextMove: 'seeing a smaller starting option',
    softQuestion: 'Would it help if we looked at the lowest-risk way to begin?',
    proof: 'Many people relax once they see a smaller, more controlled first step.',
  },
  {
    category: 'time',
    shortLabel: 'Time concern',
    rootFear: 'I am already busy and do not think I can make time for this.',
    reframe: 'Time objections are often really about the fear of extra load.',
    nextMove: 'seeing a lighter weekly rhythm',
    softQuestion: 'Would it feel more realistic if we looked at the lightest weekly version?',
    proof: 'People often imagine the whole system at once; a lighter weekly rhythm usually softens the pressure.',
  },
  {
    category: 'trust',
    shortLabel: 'Trust concern',
    rootFear: 'I do not want to move until I trust it more.',
    reframe: 'That is not a bad sign; it usually means the frame needs to feel calmer and more transparent.',
    nextMove: 'building a simple trust frame',
    softQuestion: 'Would it help if we opened the two trust points that matter most to you first?',
    proof: 'Trust tends to grow through calm and consistent clarity, not stronger claims.',
  },
  {
    category: 'family',
    shortLabel: 'Family approval',
    rootFear: 'I need to think about what my family would say.',
    reframe: 'This usually means they do not want to carry the decision alone yet.',
    nextMove: 'seeing how to explain it simply to family',
    softQuestion: 'Would it help if we made the family explanation much simpler first?',
    proof: 'When someone knows how to explain it at home, the pressure drops fast.',
  },
  {
    category: 'fear',
    shortLabel: 'Fear of failure',
    rootFear: 'I am afraid I would fail or embarrass myself.',
    reframe: 'The real fear here is often visible failure, not actual inability.',
    nextMove: 'defining a safe first step',
    softQuestion: 'Would it feel lighter if the first step was almost risk-free?',
    proof: 'Once the first move looks safe, courage tends to rise naturally.',
  },
  {
    category: 'experience',
    shortLabel: 'No experience',
    rootFear: 'I do not have enough experience for this.',
    reframe: 'This usually means the learning curve feels larger than it really is.',
    nextMove: 'seeing the easiest beginner flow',
    softQuestion: 'Would you like to look at this from a true beginner’s starting point?',
    proof: 'People usually move forward once the beginning feels manageable instead of expert-level.',
  },
  {
    category: 'product',
    shortLabel: 'Product doubt',
    rootFear: 'I am not sure the product is really a fit for me or my circle.',
    reframe: 'This is often not product resistance, but unclear personal relevance.',
    nextMove: 'connecting one concrete benefit',
    softQuestion: 'What would be the most important need to connect first?',
    proof: 'The product starts to feel more real when one benefit is tied directly to a real need.',
  },
  {
    category: 'company',
    shortLabel: 'Company doubt',
    rootFear: 'The company side still feels unclear to me.',
    reframe: 'This is a trust need that should be calmed, not argued with.',
    nextMove: 'explaining the company simply and transparently',
    softQuestion: 'Which part of the company side leaves the biggest question mark for you?',
    proof: 'Two or three clean trust points usually work better than a heavy corporate explanation.',
  },
  {
    category: 'pyramid',
    shortLabel: 'Pyramid concern',
    rootFear: 'This sounds like a pyramid to me.',
    reframe: 'That reaction often comes from bad stories or earlier negative associations.',
    nextMove: 'showing the difference in a plain way',
    softQuestion: 'Would it help if we first named what makes it feel that way to you?',
    proof: 'People often soften quickly when they hear a calm side-by-side explanation rather than a defensive one.',
  },
  {
    category: 'no_network',
    shortLabel: 'No network',
    rootFear: 'I do not have a big enough network for this.',
    reframe: 'This usually comes from defining “network” too narrowly.',
    nextMove: 'building the first prospect pool more simply',
    softQuestion: 'Would the list look more real if we stopped defining network as only close friends?',
    proof: 'Once people widen the definition of their circle, they often see more room than they expected.',
  },
  {
    category: 'introvert',
    shortLabel: 'Introvert concern',
    rootFear: 'I am not a very outgoing or social person.',
    reframe: 'This kind of work is not only for extroverts; it rewards consistency and real connection.',
    nextMove: 'finding a contact style that fits personality',
    softQuestion: 'Would a calmer, more one-to-one style feel like a better fit for you?',
    proof: 'Many quieter people do especially well when they build naturally and consistently.',
  },
  {
    category: 'employed',
    shortLabel: 'I already work full time',
    rootFear: 'I work full time, so I do not think I can run this too.',
    reframe: 'This is often the fear of taking on a second full-time job.',
    nextMove: 'seeing a side-flow version of the work',
    softQuestion: 'Would it feel more possible if this looked like a lighter side flow beside your current work?',
    proof: 'People become far more realistic once they see that full-speed performance is not expected on day one.',
  },
  {
    category: 'wait',
    shortLabel: 'Let me think',
    rootFear: 'Let me think about it. I am not clear yet.',
    reframe: 'That sentence is often not a no; it usually means the decision still feels too heavy.',
    nextMove: 'clarifying the one question behind the delay',
    softQuestion: 'What is the biggest question mark you would need to clear first?',
    proof: 'Once the real question is named, the conversation starts moving again.',
  },
  {
    category: 'other',
    shortLabel: 'General hesitation',
    rootFear: 'Something still does not sit right, but I cannot fully name it.',
    reframe: 'Sometimes it is not a clean objection at all, just a vague hesitation.',
    nextMove: 'putting a name on the concern',
    softQuestion: 'Does this feel more like trust, time, money, or something else?',
    proof: 'Once the hesitation gets a name, the conversation becomes solvable instead of foggy.',
  },
]

export function isSystemAcademyId(id: string) {
  return id.startsWith('sys-academy-')
}

export function isSystemObjectionId(id: string) {
  return id.startsWith('sys-objection-')
}

function buildAcademySystemContent(language: SystemLanguage): AcademyContent[] {
  const subjects = language === 'tr' ? CATEGORY_SUBJECTS_TR : CATEGORY_SUBJECTS_EN
  const blueprints = language === 'tr' ? LESSON_BLUEPRINTS_TR : LESSON_BLUEPRINTS_EN

  return subjects.flatMap((subject) =>
    blueprints.map((blueprint) => ({
      id: `sys-academy-${language}-${subject.category}-${blueprint.slug}`,
      user_id: null,
      type: blueprint.type,
      category: subject.category,
      level: blueprint.level,
      title: blueprint.buildTitle(subject.label),
      summary: blueprint.buildSummary(subject),
      content: blueprint.buildContent(subject),
      video_url: null,
      reading_time_minutes: blueprint.readingTime,
      tags: blueprint.tags(subject),
      language,
      is_system: true,
      is_published: true,
      is_favorite: false,
      view_count: 0,
      created_at: SYSTEM_DATE,
      updated_at: SYSTEM_DATE,
    }))
  )
}

function buildSystemObjections(language: SystemLanguage): Objection[] {
  const packs = language === 'tr' ? OBJECTION_PACKS_TR : OBJECTION_PACKS_EN
  const blueprints = language === 'tr' ? OBJECTION_BLUEPRINTS_TR : OBJECTION_BLUEPRINTS_EN

  return packs.flatMap((pack) =>
    blueprints.map((blueprint) => ({
      id: `sys-objection-${language}-${pack.category}-${blueprint.suffix}`,
      user_id: null,
      category: pack.category,
      objection_text: blueprint.buildQuestion(pack),
      short_label: pack.shortLabel,
      response_text: blueprint.buildResponse(pack),
      response_short: blueprint.buildShort(pack),
      approach: blueprint.buildApproach(pack),
      example_dialog: blueprint.buildExample(pack),
      video_url: null,
      reading_url: null,
      language,
      is_system: true,
      is_favorite: false,
      use_count: 0,
      tags: blueprint.tags(pack),
      created_at: SYSTEM_DATE,
      updated_at: SYSTEM_DATE,
    }))
  )
}

export function getSystemAcademyContents(language: string): AcademyContent[] {
  const normalized: SystemLanguage = language.startsWith('en') ? 'en' : 'tr'
  return buildAcademySystemContent(normalized)
}

export function getSystemAcademyContent(id: string, language: string): AcademyContent | null {
  return getSystemAcademyContents(language).find((item) => item.id === id) ?? null
}

export function getSystemObjections(language: string): Objection[] {
  const normalized: SystemLanguage = language.startsWith('en') ? 'en' : 'tr'
  return buildSystemObjections(normalized)
}

export function getSystemObjection(id: string, language: string): Objection | null {
  return getSystemObjections(language).find((item) => item.id === id) ?? null
}
