/** Built-in objection bank — IDs 1–20 preserved for localStorage compatibility. */

import type { Itiraz } from '../types'

export type { Itiraz } from '../types'

export const ITIRAZLAR: Itiraz[] = [
  // — Para & Kazanç —
  {
    id: 1,
    kategori: { tr: 'Para & Kazanç', en: 'Money & Earnings' },
    soru: { tr: 'Bu piramit sistemi mi?', en: 'Is this a pyramid / Ponzi scheme?' },
    cevap: {
      tr: 'Hayır. Piramit sistemlerde gerçek ürün/hizmet yoktur ve para yalnızca yeni üye getirmekten kazanılır — bu Türkiye\'de yasadışıdır. Network marketing\'de gerçek ürün veya hizmet satılır; kazanç hem kendi satışlarınızdan hem de ekibinizin satışlarından gelir. Bir soruyu sor: "Ürünü ağ olmasa da satın alır mıydın?" Cevap evetse, bu gerçek bir iş.',
      en: 'No. Pyramid schemes have no real product—earnings come only from recruiting, which is illegal. In legitimate network marketing, real products are sold and earnings come from both your own sales and your team\'s. Ask yourself: "Would I buy this product even without the business?" If yes, it\'s a real business.',
    },
    emoji: '🏛️',
  },
  {
    id: 2,
    kategori: { tr: 'Para & Kazanç', en: 'Money & Earnings' },
    soru: { tr: 'Bundan gerçekten para kazanılır mı?', en: 'Can you actually earn money from this?' },
    cevap: {
      tr: 'Evet — ama herkes kazanamaz, çünkü herkes çalışmaz. Bu bir iş, piyango değil. İlk 6–12 ayda küçük gelir, tutarlı çalışanlar 1–3 yılda önemli kazanç elde eder. Ben de aynı soruyu sormuştum. Rakamları beraber inceleyelim.',
      en: 'Yes — but not everyone does, because not everyone works. This is a business, not a lottery. The first 6–12 months yield modest income; those who stay consistent earn meaningfully within 1–3 years. I asked the same question. Let\'s review real numbers together.',
    },
    emoji: '💰',
  },
  {
    id: 3,
    kategori: { tr: 'Para & Kazanç', en: 'Money & Earnings' },
    soru: { tr: 'Param yok, başlayamam.', en: "I don't have money right now—I can't start." },
    cevap: {
      tr: 'Başlangıç maliyeti çoğu küçük işletmenin çok altında. Üstelik bir işletme kuruyorsun; kira, stok, çalışan masrafı yok. Başlangıç için yatırdığın şey, uzun vadede geri dönüşü olan bir yatırım. İstersen minimum başlangıç seçeneklerine birlikte bakalım.',
      en: "Starting costs are far below most small businesses—no rent, no inventory, no payroll. What you invest upfront is a long-term investment. Let's look at the minimum starter options together.",
    },
    emoji: '🪙',
  },
  {
    id: 4,
    kategori: { tr: 'Para & Kazanç', en: 'Money & Earnings' },
    soru: { tr: 'Yukardakiler zaten kazandı, ben geç kaldım.', en: "Those at the top already made it—I'm too late." },
    cevap: {
      tr: 'Network marketing\'de piyasanın doygunluğu yoktur — çünkü insanlar sürekli değişiyor, tüketim devam ediyor. McDonald\'s\'ın 1955\'te açılan franchise\'ının geç kalındığı söylenseydi, bugün yüz binlerce şube olmazdı. Sıra sende: sen de "erken kalan" biri olabilirsin.',
      en: "There's no market saturation in NM—people constantly change and consumption continues. If McDonald's franchisees in 1955 had thought they were 'too late,' there would be no hundreds of thousands of locations today. Your turn to be the early mover in your circle.",
    },
    emoji: '⏰',
  },
  {
    id: 21,
    kategori: { tr: 'Para & Kazanç', en: 'Money & Earnings' },
    soru: { tr: 'Pasif gelir masallarına inanmıyorum.', en: "I don't believe passive income stories." },
    cevap: {
      tr: 'Haklısın — "pasif gelir" kelimesi bu sektörde çok suistimal edildi. Dürüst çerçeve: başlangıçta aktif çalışma gerekir. Emek + sistem + zaman üçlüsü oluşursa zamanla "artık gelir" yapısı oluşabilir — yani daha az aktif çalışırken kazanç akmaya devam eder. Ben de "pasif gelir" kelimesini kullanmaktan kaçınırım; bunun yerine gerçekçi bir zaman çizelgesi konuşalım.',
      en: "You're right—'passive income' has been badly overused. The honest frame: this is active work upfront. What you build over months is residual income—where the work-to-earnings ratio gradually shifts. It doesn't happen overnight. I don't use 'passive' either. Let's talk about a realistic timeline instead.",
    },
    emoji: '📊',
  },
  {
    id: 22,
    kategori: { tr: 'Para & Kazanç', en: 'Money & Earnings' },
    soru: { tr: 'Ekranda gördüğüm kazanç paylaşımlarına inanmıyorum.', en: "I don't trust income screenshots." },
    cevap: {
      tr: 'Haklısın; abartılı gelir görüntüleri güveni zedeler. Ben de garanti değil, süreç olarak bakarım: ne sıklıkla çalışma, hangi beceri, hangi destek. Rakam konuşulacaksa şirket dokümanına uygun şekilde konuşalım.',
      en: "Same—screenshots can mislead. I prefer walking through realistic activity patterns and pointing to official compensation documentation. If we talk numbers, let's use what the company actually documents.",
    },
    emoji: '📸',
  },
  // — Zaman —
  {
    id: 5,
    kategori: { tr: 'Zaman & Yoğunluk', en: 'Time & Priorities' },
    soru: { tr: 'Vaktim yok.', en: "I'm too busy—I don't have time." },
    cevap: {
      tr: 'Anlıyorum, herkes yoğun. Ama şöyle düşün: haftada 5–7 saat ayırabilir misin? Bu kadar yeter. Çoğu insan bunu ana işinin yanında yapar. Soru "vakit var mı?" değil, "bu hayatı değiştirebilecek bir şey için vakit yaratabilir miyim?"',
      en: "I get it—everyone is busy. Think about it: can you carve out 5–7 hours a week? That's enough. Most people do this alongside their main job. The question isn't 'do I have time?' but 'can I create time for something that could change my life?'",
    },
    emoji: '⏳',
  },
  {
    id: 6,
    kategori: { tr: 'Zaman & Yoğunluk', en: 'Time & Priorities' },
    soru: { tr: 'Şu an çok zor bir dönemdeyim.', en: "I'm going through a really tough time right now." },
    cevap: {
      tr: 'Bunu anlıyorum ve saygı duyuyorum. Belki de şu an değil, ama bu konuşmayı aklının bir köşesine koy. Çok zor dönemler geçer — ve çıkışı kolaylaştıracak bir ek gelir kaynağı tam da bu dönemde anlam kazanır. Hazır olduğunda buradayım.',
      en: "I hear you, and I respect that. Maybe not now—but keep this in the back of your mind. Tough times pass, and having an extra income stream is exactly what can make the recovery easier. I'm here when you're ready.",
    },
    emoji: '🤝',
  },
  {
    id: 23,
    kategori: { tr: 'Zaman & Yoğunluk', en: 'Time & Priorities' },
    soru: { tr: 'İşim var, maaşım yeterli.', en: 'I have a job—my salary is enough.' },
    cevap: {
      tr: 'Harika, bu gerçekten iyi bir pozisyon. Sana sormak istiyorum: Maaşın on yıl sonra da bugünkü hayatını karşılayacak mı? Çoğu kişi bu işi yapmak için işten çıkmıyor — yan gelir veya ikinci bir hat olarak devam ediyor.',
      en: "Great—that's a strong position. One question worth considering: ten years from now, will your salary still fund the lifestyle you want? Most people here keep their career and explore this as optional upside without quitting their job.",
    },
    emoji: '💼',
  },
  {
    id: 24,
    kategori: { tr: 'Zaman & Yoğunluk', en: 'Time & Priorities' },
    soru: { tr: 'Çocuklar küçük, hiç vaktim yok.', en: 'My kids are young—I have zero time.' },
    cevap: {
      tr: 'Bu gerçek bir kısıtlama ve saygı duyuyorum. Ev işleri veya çocuk bakımıyla birlikte sürdürülebilen az sayıda modelden biri. Çocuk programına göre küçük bloklar halinde ilerlenebilir — sabah erken, uyku saati, kısa akşam pencereleri. Şu an imkânsız hissediyorsa beklemek de tamam.',
      en: "That's a real constraint and I respect it. This is one of the few models that can run from home in micro-blocks around your kids' schedule—early mornings, nap windows, short evenings. If even that feels impossible right now, waiting is okay.",
    },
    emoji: '👶',
  },
  // — Güven / Şüphe —
  {
    id: 7,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Arkadaşlarımla ilişkim bozulur.', en: 'This will damage my friendships.' },
    cevap: {
      tr: 'Bu en meşru endişelerden biri. Güzel haber: doğru yapıldığında tam tersi olur. Arkadaşını zorlamıyorsun, sadece faydalı bulduğun bir şeyi paylaşıyorsun. "Hayır" deyince "tamam, anlıyorum" diyorsun — ve ilişki kırılmıyor. Satıcı gibi değil, insan gibi konuşmak yeterli.',
      en: "This is one of the most legitimate concerns. Good news: done right, the opposite happens. You're not forcing anyone—just sharing something you find valuable. When they say 'no,' you say 'totally fine' and the friendship stays intact. Talking like a human, not a salesperson, is all it takes.",
    },
    emoji: '💛',
  },
  {
    id: 8,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Daha önce denemişim, olmadı.', en: 'I tried before and it failed.' },
    cevap: {
      tr: 'Hangi şirketti? Ne kadar süre çalıştın? Çoğu zaman başarısızlık şirketten değil, yöntemden kaynaklanır. Bu sefer yanında bir ekip ve kanıtlanmış bir sistem var. İki dakika anlat, bakalım fark ne.',
      en: "What company? How long did you work it? Most failures come from the method, not the model. This time there's a team beside you and a proven system. Tell me what happened in two minutes—let's find the difference.",
    },
    emoji: '🔄',
  },
  {
    id: 9,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Bu şirkete güvenilir mi?', en: 'Is this company trustworthy?' },
    cevap: {
      tr: 'Haklısın, araştırmak şart. Şirketin kuruluş tarihi, ülkedeki yasal kaydı, ürün sertifikaları ve bağımsız distribütör sayısını birlikte inceleyelim. Sana somut belgeleri paylaşayım — sonra karar ver.',
      en: "You're right to ask. Let's look at founding history, legal registration, product certifications, and independent distributor numbers together. I'll share concrete documents—then you decide.",
    },
    emoji: '🔍',
  },
  {
    id: 10,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Bunu sadece benden para kazanmak için söylüyorsun.', en: "You're only saying this to make money off me." },
    cevap: {
      tr: 'Dürüst olmak gerekirse: evet, bir kazancım olacak — ama bu ancak sen de kazanırsan sürdürülebilir. Senin başarın benim başarım. İstersen rakamları ve komisyon yapısını şeffaf biçimde göstereyim, hiçbir şey gizli değil.',
      en: "Honestly: yes, I do earn if you join—but only sustainably if you earn too. Your success is my success. Let me show you the numbers and commission structure transparently—nothing is hidden.",
    },
    emoji: '🪞',
  },
  {
    id: 25,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Sana güveniyorum ama bu işe pek inanmıyorum.', en: 'I trust you but not this kind of business.' },
    cevap: {
      tr: '"Bu işe inanmıyorum" genellikle üç ayrı şeyi ifade edebilir: (1) iş modeline güvenmiyorum, (2) bu şirkete özgü bir şüphem var, (3) kendi başarabilme kapasiteme inanmıyorum. Hangisi sende daha ağır basıyor? Bu sorunun cevabı konuşmamızın nereye gideceğini belirler. Karar vermeni değil, bilgilenmeni istiyorum.',
      en: "'I don't believe in this business' can mean three things: (1) I don't trust the NM model, (2) I have a specific doubt about this company, (3) I don't believe I could succeed. Which one weighs heaviest for you? That shapes where we go next. I'm not asking for commitment—just curiosity.",
    },
    emoji: '🤔',
  },
  {
    id: 26,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Bu markayı hiç duymadım, tanınmıyor.', en: "I've never heard of this brand." },
    cevap: {
      tr: 'Her yeni marka başlangıçta tanınmayabilir. Önemli olan bugünkü bilinirlik değil; ürün kalitesi ve sürdürülebilir destek. Sertifikalarına ve bağımsız değerlendirmelere birlikte bakalım — sonra düşük riskli bir deneme seçeneği var.',
      en: "New brands often start unknown. What matters isn't current fame—it's product quality and sustainable support. Let's look at certifications and independent reviews together—then there's a low-risk trial option.",
    },
    emoji: '🆕',
  },
  {
    id: 27,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Çevrim içi sunuma güvenmiyorum, yüz yüze olsa belki.', en: "I don't trust online calls—maybe face-to-face." },
    cevap: {
      tr: 'Anlıyorum; güven için yüz yüze görüşmek mümkünse harika. Olamazsa on beş dakika kamera kapalı, önceden net bir gündem ve açık soru-cevap ile ilerleyelim. Kontrol sende.',
      en: "Totally fair—face-to-face beats a screen when possible. If not, let's do fifteen minutes camera-off, with a clear agenda sent upfront and open Q&A. You stay in control throughout.",
    },
    emoji: '💻',
  },
  // — Yetenek / Kimlik —
  {
    id: 11,
    kategori: { tr: 'Yetenek & Kimlik', en: 'Ability & Identity' },
    soru: { tr: 'Ben satıcı değilim, bu bana göre değil.', en: "I'm not a salesperson—this isn't for me." },
    cevap: {
      tr: 'Keşke "satış" kelimesini unuttursam. Burada arkadaşlarınla dürüst konuşmak, faydalı bir şeyi tavsiye etmek var. Her gün zaten tavsiye veriyorsun — hangi restoran, hangi dizi, hangi telefon. Fark şu: bu sefer o tavsiyeden para kazanıyorsun.',
      en: "I wish I could make the word 'sales' disappear. This is honest conversation and recommendation—you already do it every day (restaurants, shows, phones). The only difference: this time that recommendation earns you money.",
    },
    emoji: '🗣️',
  },
  {
    id: 12,
    kategori: { tr: 'Yetenek & Kimlik', en: 'Ability & Identity' },
    soru: { tr: 'Yeterince sosyal değilim.', en: "I'm not social enough." },
    cevap: {
      tr: 'İçe dönük insanlar çok başarılı distribütörler olabilir — çünkü dinlemeyi, derinlemesine ilgilenmeyi iyi bilirler. Sosyallik performans değil, güven inşasıdır. Bu iş büyük sahneler değil, kafe buluşmaları ve WhatsApp görüşmeleri üzerine kurulur. Kendi tarzınla yapabilirsin.',
      en: "Introverts can be excellent distributors—they listen deeply and build trust patiently. Sociability isn't a performance; it's trust-building. This business runs on coffee meetings and WhatsApp chats, not big stages. You can do this on your own terms.",
    },
    emoji: '🌱',
  },
  {
    id: 13,
    kategori: { tr: 'Yetenek & Kimlik', en: 'Ability & Identity' },
    soru: { tr: 'Eğitimim yok, bilgim yok.', en: "I'm not educated enough—I'll fail." },
    cevap: {
      tr: 'Bu iş üniversite diploması değil, öğrenme isteği ister. Başlarken yanında bir mentor, bir sistem ogrenim materyali olacak. Gerekli olan şeyler: iletişim kurabilmek, dinleyebilmek ve öğrenmeye açık olmak. Bu üçü varsa sistem sana gerisini öğretir.',
      en: "This isn't a university exam—it's a willingness to learn. You'll have a mentor, a system, and step-by-step training materials. The actual requirements: can you have a real conversation? Can you listen? Are you open to learning? If yes, the system teaches you the rest.",
    },
    emoji: '📚',
  },
  {
    id: 28,
    kategori: { tr: 'Yetenek & Kimlik', en: 'Ability & Identity' },
    soru: { tr: 'Çevrem çok dar, tanıdığım yok ki.', en: 'My circle is tiny—I barely know anyone.' },
    cevap: {
      tr: 'Bu düşünce çok yaygın — ve neredeyse her zaman yanılgıdır. Bir kağıt al: eski iş arkadaşları, okul arkadaşları, hobi grupları, WhatsApp gruplarındaki isimler, Instagram takipçilerin. Çoğu insan 20–30 isim yazar ve durur, ama zorlasan 100 kolayca çıkar. Önemli olan çevre büyüklüğü değil, ilişki kalitesi ve takip sistemi.',
      en: "This is very common—and almost always a misconception. Grab paper: former colleagues, school friends, hobby groups, WhatsApp contacts, Instagram connections. Most people stop at 20–30 names and pause, but push to 100 and you'll usually find them. Network size matters less than relationship quality and consistent follow-up.",
    },
    emoji: '🌐',
  },
  {
    id: 29,
    kategori: { tr: 'Yetenek & Kimlik', en: 'Ability & Identity' },
    soru: { tr: 'İş yerim/mesleğim gereği sosyal medyada paylaşım yapamam.', en: "My job rules—I can't post on social media." },
    cevap: {
      tr: 'Bu çok makul. Bazı mesleklerde görünürlük kısıtlıdır. O zaman dijital yerine referans, tanıdık ağı ve yüz yüze kısa görüşme modeline geçelim — şirketinin uygun gördüğü çerçevede.',
      en: "That's perfectly reasonable. Some professions limit public visibility. We can build through private referrals, warm introductions, and short personal conversations instead—within your professional boundaries.",
    },
    emoji: '🏢',
  },
  // — Aile / Çevre —
  {
    id: 14,
    kategori: { tr: 'Aile & Çevre', en: 'Family & Network' },
    soru: { tr: 'Ailem karşı çıkıyor.', en: 'My family is against it.' },
    cevap: {
      tr: 'Bu çok normal. Aileler sevdiklerini riske karşı korumak ister. En iyi cevap tartışmak değil, somut sonuç göstermek. Küçük bir adımla başla, ilk kazancını göster — söylemek değil, yaşamak en güçlü ikna aracıdır.',
      en: "Very normal. Families want to protect those they love. The best answer isn't argument—it's showing concrete results. Start small, show your first earnings. Living it is the most powerful persuasion.",
    },
    emoji: '🏠',
  },
  {
    id: 15,
    kategori: { tr: 'Aile & Çevre', en: 'Family & Network' },
    soru: { tr: 'Çevremde kimse bu tür şeylere inanmıyor.', en: 'No one in my circle believes in this kind of thing.' },
    cevap: {
      tr: 'İlk çevren her zaman en zor gruptur — çünkü seni "eski sen" olarak tanıyorlar. Bu iş sadece yakın çevrenle değil, tüm insanlarla yapılır. Ağını genişletmek için yöntemler var; adım adım öğrenirsin.',
      en: "Your closest circle is always the hardest—they know the 'old you.' This business isn't limited to your inner circle. There are concrete methods to expand your network; you learn them step by step.",
    },
    emoji: '🌐',
  },
  {
    id: 30,
    kategori: { tr: 'Aile & Çevre', en: 'Family & Network' },
    soru: { tr: 'Akraba ve tanıdıklarla iş yapmak ilişkimi bozar.', en: 'Doing business with relatives will ruin our relationship.' },
    cevap: {
      tr: 'Bu endişe gerçek ve haklı. Model: zorlamadan, izin isteyerek, olmazsa "ilişkin önce gelir" çerçevesinde. İstersen sadece bilgi isteyenlere ve senin seçtiğin dar çembere odaklanalım. Davet nazik, geri çekilebilir ve seçici olursa ilişki korunur.',
      en: "Valid concern. The ethical approach: consent-based invites, no pressure, and relationship-first framing if they decline. We can focus only on people who ask and those you specifically choose. A gentle, reversible invite preserves relationships.",
    },
    emoji: '👨‍👩‍👧',
  },
  // — Ürün / Sistem —
  {
    id: 16,
    kategori: { tr: 'Ürün & Sistem', en: 'Product & System' },
    soru: { tr: 'Ürünler çok pahalı.', en: 'The products are too expensive.' },
    cevap: {
      tr: 'Fiyat, kaliteyle karşılaştırıldığında değerlendirilmeli. Çoğu NM ürünü konsantre ya da premium formülasyonla gelir — birim başına maliyet zannedilenden düşük çıkar. Seninle birlikte hesaplarsak görürsün.',
      en: "Price should be evaluated against quality. Most NM products come in concentrated or premium formulations—the cost per use is usually lower than it looks. Let's calculate it together and see.",
    },
    emoji: '🧴',
  },
  {
    id: 17,
    kategori: { tr: 'Ürün & Sistem', en: 'Product & System' },
    soru: { tr: 'Bu ürünleri zaten marketlerden alabiliyorum.', en: 'I can already buy similar products at the store.' },
    cevap: {
      tr: 'Belki benzer ürünler var, ama bu ürünlerin formülasyonu, klinik testleri ve arkasındaki destek farklı. Üstelik burada hem kullanıcı hem de iş ortağısın — market sana komisyon ödemiyor.',
      en: "There may be similar products, but the formulation, clinical testing, and support behind these are different. Plus here you're both a user and a business partner—the supermarket doesn't pay you commission.",
    },
    emoji: '🛒',
  },
  {
    id: 18,
    kategori: { tr: 'Ürün & Sistem', en: 'Product & System' },
    soru: { tr: 'Bunu başka şirketler de yapıyor zaten.', en: 'Other companies do the exact same thing.' },
    cevap: {
      tr: 'Evet, rekabet var — ve bu olgunlaşmış bir pazarın işareti. Soru şu: hangi şirket daha güçlü sisteme, daha iyi ürüne ve sana daha iyi destek veren bir ekibe sahip? Bunu beraber karşılaştıralım.',
      en: "Yes, competition exists—that's a sign of a mature market. The question is: which company has the stronger system, better product, and team that supports you best? Let's compare.",
    },
    emoji: '⚖️',
  },
  {
    id: 31,
    kategori: { tr: 'Ürün & Sistem', en: 'Product & System' },
    soru: { tr: 'Kargo, iade veya cayma konusunda endişeliyim.', en: "I'm worried about shipping, returns, or withdrawal rights." },
    cevap: {
      tr: 'Bu çok yerinde. Sipariş, teslimat ve cayma şirket sözleşmesinde net olmalı. İstersen birlikte madde madde bakalım; ben yanlış bilgi vermemek için yazılı kaynağı baz alırım.',
      en: "Smart concern. Shipping, returns, and withdrawal rights should be clearly documented in the company contract. Let's open the written policy together and read it line by line—I'll only work from the official source.",
    },
    emoji: '📦',
  },
  // — Genel —
  {
    id: 19,
    kategori: { tr: 'Genel', en: 'General' },
    soru: { tr: 'Şu an düşünmek istemiyorum.', en: "I don't want to think about it right now." },
    cevap: {
      tr: 'Tamam, hiç sorun değil. Seni zorlamak istemerim. Sadece şunu bırakayım: hazır olduğunda veya aklına takılan sorular olduğunda bana yaz. Kapı her zaman açık.',
      en: "Totally fine—no pressure. I just want to leave this: when you're ready, or if a question comes up, reach out. The door is always open.",
    },
    emoji: '🚪',
  },
  {
    id: 20,
    kategori: { tr: 'Genel', en: 'General' },
    soru: { tr: 'Biraz daha bilgi alabilir miyim?', en: 'Can I get more information?' },
    cevap: {
      tr: 'Tabii! Bu tam istediğim şey. Ne merak ediyorsan sor — ürün mü, kazanç planı mı, sistem mi? Beraber bakalım. Hiçbir sorun aptalca değil, her sorunun cevabı var.',
      en: "Absolutely—that's exactly what I want. Ask whatever you're curious about: product, compensation plan, system? Let's explore together. No question is too small.",
    },
    emoji: '💬',
  },
  {
    id: 32,
    kategori: { tr: 'Genel', en: 'General' },
    soru: { tr: 'Düşüneceğim, daha sonra bakarım.', en: "I'll think about it—maybe later." },
    cevap: {
      tr: '"Düşüneyim"in arkasındaki gerçek soruyu bul. Çoğu zaman "düşüneyim" bir soru işaretinin arkasında saklıdır. Düşünürken en çok ne takıldı aklına — para mı, zaman mı, güven mi?',
      en: "'I'll think about it' usually hides a specific question. While you think, what's sticking most in your mind—money, time, trust, family? Name it and we can address just that part.",
    },
    emoji: '💭',
  },
  {
    id: 33,
    kategori: { tr: 'Genel', en: 'General' },
    soru: { tr: 'Bu tür işlere artık motive olamıyorum.', en: "I can't motivate myself for this anymore." },
    cevap: {
      tr: 'Motivasyon kayması çoğunlukla "neden" sorusunun cevabını yitirmekten gelir. Bu işe başlamadan önce ne için başlamak istemiştiniz — para özgürlüğü mü, zaman mı, bir şeye sahip olma duygusu mu? Somut bir 90 günlük hedef belirle: motivasyon çoğu zaman hedefin ardından gelir, önünden değil.',
      en: "Motivation loss usually comes from losing your 'why.' What were you originally doing this for—financial freedom, more time, something specific you wanted? Set one concrete 90-day goal. Motivation follows clarity; it rarely arrives before it.",
    },
    emoji: '🔋',
  },
  {
    id: 34,
    kategori: { tr: 'Genel', en: 'General' },
    soru: { tr: 'Konuştuğum herkes hayır dedi, bu iş olmaz.', en: "Everyone said no—this won't work." },
    cevap: {
      tr: '"Hayır" almak bu işin doğal bir parçası. İyi sonuç alanlar "hayır"ı işin doğası olarak görüp ritmini ona göre kuruyor. Nasıl konuştun, birlikte bakalım — yaklaşım her şeyi değiştirir.',
      en: "Rejection is a natural part of this work. Strong builders treat 'no' as normal and build their rhythm around it. Let's replay how you approached one conversation—small tweaks often change everything.",
    },
    emoji: '🎯',
  },
  {
    id: 35,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Bu iş (Network Marketing) caiz mi / yasal mı?', en: 'Is this business (Network Marketing) permissible / legitimate?' },
    cevap: {
      tr: 'Harika bir soru. Burada bizim görevimiz fetva vermek değil, işin şeffaf ticaret modelini sunmaktır. Kriterler: (1) Ortada faydalı ve gerçek bir ürün var mı? (2) Kazanç sadece üye kaydından mı, yoksa ürün satış cirosundan mı doğuyor? (3) Sistem adil ve şeffaf mı? Kazancımız ürün satış cirosuna dayandığı için dürüst bir ticarettir; nihai vicdani değerlendirme kararını kendi araştırmanıza bırakıyorum.',
      en: 'A great question. Our role is not to issue rulings, but to present the business model transparently. Criteria: (1) Is there a real, valuable product? (2) Does income come from product sales revenue rather than just recruiting? (3) Is the system fair and transparent? Since our earnings are based on actual product sales, it is a legitimate trade; the final decision is left to your own research and conscience.',
    },
    emoji: '⚖️',
  },
  {
    id: 36,
    kategori: { tr: 'Ürün & Sistem', en: 'Product & System' },
    soru: { tr: 'Bu ürünler gerçekten işe yarıyor mu?', en: 'Do these products actually work?' },
    cevap: {
      tr: 'Şüpheyle başlamak çok sağlıklı — ben de başlamadan önce aynı soruyu sormuştum. Güven üç katmanda kurulur: (1) kişisel deneyim — önce ürünü kendin dene ve farkı hisset; (2) belgelenmiş kanıt — sertifikalar, içerik şeffaflığı ve bağımsız değerlendirmeler; (3) düşük riskli deneme koşulları. Ürüne inanmadan bu işi yapmak hem sürdürülemez hem de etik değil; o yüzden önce ürünü tanıyalım, fark hissedersen gerisi çok daha kolay gelir.',
      en: "Healthy skepticism is a good start—I asked the exact same thing before I began. Trust is built in three layers: (1) personal experience—try the product yourself and feel the difference; (2) documented evidence—certifications, ingredient transparency and independent reviews; (3) low-risk trial terms. Building this business on a product you don't believe in is neither sustainable nor ethical, so let's get to know the product first—once you feel the difference, everything else gets much easier.",
    },
    emoji: '🔬',
  },
  {
    id: 37,
    kategori: { tr: 'Güven & Şüphe', en: 'Trust & Skepticism' },
    soru: { tr: 'Sen de para kazanmıyorsundur zaten.', en: "You probably don't earn money either." },
    cevap: {
      tr: 'Bunu sormaya hakkın var ve dürüst olacağım: bu işte herkes aynı anda aynı miktarı kazanmaz — kazanç emeğe, beceriye ve döneme göre değişir. İstersen ne iddia edip ne iddia etmediğimi açıkça göstereyim ve şirketin resmi kazanç belgelerine birlikte bakalım. Amacım abartı değil, şeffaflık.',
      en: "You're allowed to ask, and I'll be honest: nobody earns \"the same amount\" on demand—income varies with effort, skill and season. If it helps, I'll show you exactly what I do and don't claim, and we can look at the company's official compensation documents together. My goal isn't hype—it's transparency.",
    },
    emoji: '🤨',
  },
]

export const PAGE_SIZE = 10
