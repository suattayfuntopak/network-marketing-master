'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { MessageCircleQuestion, Search, X, ChevronDown, Copy, Check, Star, CheckCircle2, Circle, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useProgressSync } from '@/hooks/useProgressSync'
import { useSearchParams } from 'next/navigation'
import { Z } from '@/lib/zIndex'

interface Itiraz {
  id: number
  kategori: { tr: string; en: string }
  soru: { tr: string; en: string }
  cevap: { tr: string; en: string }
  emoji: string
}

// IDs 1-20 preserved from original for localStorage compatibility
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
]

const PAGE_SIZE = 10

function getKategoriler(lang: 'tr' | 'en') {
  const base = ['Tümü', 'Favoriler']
  const baseEn = ['All', 'Favorites']
  const uniq = Array.from(new Set(ITIRAZLAR.map(i => lang === 'en' ? i.kategori.en : i.kategori.tr)))
  return lang === 'en' ? [...baseEn, ...uniq] : [...base, ...uniq]
}

function ItirazlarPageContent() {
  const { lang } = useTranslation()
  const searchParams = useSearchParams()
  const {
    readObjections: read,
    favObjections: favs,
    toggleObjectionRead,
    toggleObjectionFav,
  } = useProgressSync()

  const [search, setSearch] = useState('')
  const [acikId, setAcikId] = useState<number | null>(null)
  const [aktifKategori, setAktifKategori] = useState(0)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Custom objections state & form variables
  const [customItirazlar, setCustomItirazlar] = useState<any[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [newSoru, setNewSoru] = useState('')
  const [newKategori, setNewKategori] = useState('Genel')
  const [newKisaCevap, setNewKisaCevap] = useState('')
  const [newDetayliCevap, setNewDetayliCevap] = useState('')
  const [newYaklasim, setNewYaklasim] = useState('')
  const [newOrnekDiyalog, setNewOrnekDiyalog] = useState('')
  const [newEmoji, setNewEmoji] = useState('🛡️')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nmm_custom_objections_v1')
      if (stored) {
        setCustomItirazlar(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const tumItirazlar = useMemo(() => {
    return [...ITIRAZLAR, ...customItirazlar]
  }, [customItirazlar])

  const KATEGORILER = useMemo(() => {
    const base = lang === 'en' ? ['All', 'Favorites'] : ['Tümü', 'Favoriler']
    const uniq = Array.from(new Set(tumItirazlar.map(i => lang === 'en' ? i.kategori.en : i.kategori.tr)))
    return [...base, ...uniq]
  }, [tumItirazlar, lang])

  useEffect(() => { setPage(1) }, [search, aktifKategori, lang])

  function toggleFav(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    toggleObjectionFav(id)
  }

  function toggleRead(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    toggleObjectionRead(id)
  }

  async function copyCevap(cevap: string, id: number, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(cevap)
      setCopiedId(id)
      toast.success(lang === 'en' ? 'Answer copied!' : 'Cevap kopyalandı!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error(lang === 'en' ? 'Copy failed' : 'Kopyalama başarısız')
    }
  }

  function toggle(id: number) {
    setAcikId(prev => (prev === id ? null : id))
  }

  function handleAddObjection(e: React.FormEvent) {
    e.preventDefault()
    if (!newSoru.trim()) return

    const newObj: any = {
      id: Date.now(),
      kategori: { tr: newKategori, en: newKategori },
      soru: { tr: newSoru, en: newSoru },
      emoji: newEmoji || '🛡️',
      kisaCevap: newKisaCevap,
      detayliCevap: newDetayliCevap,
      yaklasim: newYaklasim,
      ornekDiyalog: newOrnekDiyalog,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    }

    const updated = [newObj, ...customItirazlar]
    setCustomItirazlar(updated)
    localStorage.setItem('nmm_custom_objections_v1', JSON.stringify(updated))
    
    // Reset form
    setNewSoru('')
    setNewKisaCevap('')
    setNewDetayliCevap('')
    setNewYaklasim('')
    setNewOrnekDiyalog('')
    setNewTags('')
    setNewEmoji('🛡️')
    setFormOpen(false)
    toast.success(lang === 'en' ? 'Objection added successfully!' : 'İtiraz başarıyla eklendi!')
  }

  const filtrelenmis = useMemo(() => {
    const q = search.toLowerCase().trim()
    const label = KATEGORILER[aktifKategori]
    const isFavFilter = label === 'Favoriler' || label === 'Favorites'
    const isAll = label === 'Tümü' || label === 'All'

    return tumItirazlar.filter(i => {
      if (isFavFilter) return favs.has(i.id)
      const kategoriEslesti = isAll || i.kategori.tr === label || i.kategori.en === label
      if (!kategoriEslesti) return false
      if (!q) return true
      const soru = lang === 'en' ? i.soru.en : i.soru.tr
      const cevap = lang === 'en' ? i.cevap?.en || i.cevap || '' : i.cevap?.tr || i.cevap || ''
      const kisa = i.kisaCevap || ''
      const detay = i.detayliCevap || ''
      const yakl = i.yaklasim || ''
      const diyalog = i.ornekDiyalog || ''
      return soru.toLowerCase().includes(q) || cevap.toLowerCase().includes(q) || kisa.toLowerCase().includes(q) || detay.toLowerCase().includes(q) || yakl.toLowerCase().includes(q) || diyalog.toLowerCase().includes(q)
    })
  }, [search, aktifKategori, favs, lang, KATEGORILER, tumItirazlar])

  useEffect(() => {
    const topicIdStr = searchParams.get('id')
    if (topicIdStr) {
      const topicId = parseInt(topicIdStr, 10)
      if (!isNaN(topicId)) {
        const idx = filtrelenmis.findIndex(t => t.id === topicId)
        if (idx !== -1) {
          const targetPage = Math.floor(idx / PAGE_SIZE) + 1
          setPage(targetPage)
          setAcikId(topicId)
          setTimeout(() => {
            const el = document.getElementById(`konu-${topicId}`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 300)
        }
      }
    }
  }, [searchParams, filtrelenmis])

  const totalPages = Math.ceil(filtrelenmis.length / PAGE_SIZE)
  const pageItems = filtrelenmis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const favCount = favs.size
  const readCount = read.size
  const isFavoritesEmpty = (KATEGORILER[aktifKategori] === 'Favoriler' || KATEGORILER[aktifKategori] === 'Favorites') && favCount === 0

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      {/* Başlık */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1F3] dark:bg-[#3d0a1a]">
              <MessageCircleQuestion className="h-5 w-5 text-[#9B1D47] dark:text-[#fda4af]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-1)]">
                {lang === 'en' ? 'Objection Answers' : 'İtirazlara Cevaplar'}
              </h1>
              <p className="text-sm text-[var(--text-3)]">
                {lang === 'en' ? 'Great answers to the most common objections you face in the field' : 'Sahada en sık karşılaştığın itirazlara verilecek harika cevaplar'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#9B1D47] hover:bg-[#801438] text-white px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{lang === 'en' ? 'Add Objection' : 'İtiraz Ekle'}</span>
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#FFE4EA] dark:border-[#3d0a1a] bg-[#FFF1F3] dark:bg-[#3d0a1a]/60 px-4 py-3">
          <span className="text-2xl">🛡️</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#9B1D47] dark:text-[#fda4af]">
              {tumItirazlar.length} {lang === 'en' ? 'objections' : 'itiraz'} · {KATEGORILER.length - 2} {lang === 'en' ? 'categories' : 'kategori'}
            </p>
            <p className="text-[11px] text-[#9B1D47]/70 dark:text-[#fda4af]/70">
              {lang === 'en' ? '⭐ pin it, 📋 copy it, ✅ mark as read' : '⭐ ile sabitle, 📋 ile kopyala, ✅ okundu işaretle'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {favCount > 0 && (
              <span className="rounded-full bg-[#9B1D47] px-2.5 py-1 text-[10px] font-bold text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]">
                {favCount} {lang === 'en' ? 'fav' : 'favori'}
              </span>
            )}
            {readCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white dark:bg-emerald-500">
                <CheckCircle2 className="h-3 w-3" />
                {readCount}/{tumItirazlar.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Arama */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'en' ? 'Search objections or answers...' : 'İtiraz veya cevap içinde ara...'}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-10 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)] transition"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Kategori filtreleri */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide no-swipe" data-no-swipe="true">
        {KATEGORILER.map((k, idx) => (
          <button
            key={k}
            onClick={() => setAktifKategori(idx)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              aktifKategori === idx
                ? 'bg-[#9B1D47] text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#9B1D47] dark:hover:border-[#fda4af]'
            }`}
          >
            {(k === 'Favoriler' || k === 'Favorites') && <Star className="h-3 w-3" />}
            {k}
            {(k === 'Favoriler' || k === 'Favorites') && favCount > 0 && (
              <span className={`rounded-full px-1.5 text-[9px] font-bold ${aktifKategori === idx ? 'bg-white/20' : 'bg-[#9B1D47]/10 text-[#9B1D47] dark:text-[#fda4af]'}`}>
                {favCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sonuç sayısı */}
      {search && (
        <p className="mb-3 text-xs text-[var(--text-3)]">
          {filtrelenmis.length} {lang === 'en' ? 'results found' : 'sonuç bulundu'}
        </p>
      )}

      {/* Favoriler boş uyarısı */}
      {isFavoritesEmpty && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">⭐</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">
            {lang === 'en' ? 'No favorites yet' : 'Henüz favori yok'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-2)]">
            {lang === 'en' ? 'Tap ⭐ next to an objection to save it' : 'İtirazların yanındaki ⭐ ile sabitleyebilirsin'}
          </p>
        </div>
      )}

      {/* İtiraz listesi */}
      {!isFavoritesEmpty && filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">🔍</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">
            {lang === 'en' ? 'No matching objections' : 'Eşleşen itiraz bulunamadı'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-2)]">
            {lang === 'en' ? 'Try different keywords' : 'Farklı kelimelerle arama yap'}
          </p>
        </div>
      ) : !isFavoritesEmpty && (
        <>
          <ul className="space-y-3">
            {pageItems.map(itiraz => {
              const acik = acikId === itiraz.id
              const isFav = favs.has(itiraz.id)
              const isRead = read.has(itiraz.id)
              const copied = copiedId === itiraz.id
              const soru = lang === 'en' ? itiraz.soru.en : itiraz.soru.tr
              const cevap = lang === 'en' ? itiraz.cevap?.en || itiraz.cevap || '' : itiraz.cevap?.tr || itiraz.cevap || ''
              const kategori = lang === 'en' ? itiraz.kategori.en : itiraz.kategori.tr
              const isCustom = customItirazlar.some(c => c.id === itiraz.id)
              return (
                <li key={itiraz.id} id={`konu-${itiraz.id}`}>
                  <div
                    className={`rounded-2xl border transition-all duration-200 ${
                      acik
                        ? 'border-[#9B1D47]/30 dark:border-[#fda4af]/30 bg-[var(--bg-card)] shadow-md'
                        : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[#9B1D47]/30 dark:hover:border-[#fda4af]/30 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => toggle(itiraz.id)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className={`shrink-0 text-xl leading-none transition-opacity ${isRead ? 'opacity-40' : ''}`}>{itiraz.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1D47] dark:text-[#fda4af] mb-0.5">
                          {kategori}
                        </p>
                        <p className={`text-sm font-semibold leading-snug ${isRead ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'}`}>
                          "{soru}"
                        </p>
                      </div>
                      
                      {/* Okundu toggle */}
                      <button
                        onClick={e => toggleRead(itiraz.id, e)}
                        title={isRead ? (lang === 'en' ? 'Mark as unread' : 'Okunmadı olarak işaretle') : (lang === 'en' ? 'Mark as read' : 'Okundu olarak işaretle')}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                          isRead
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--text-3)] hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        {isRead ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>

                      {/* Silme Butonu (Sadece Custom İtirazlar için) */}
                      {isCustom && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (confirm(lang === 'en' ? 'Are you sure you want to delete this objection?' : 'Bu itirazı silmek istediğinize emin misiniz?')) {
                              const updated = customItirazlar.filter(c => c.id !== itiraz.id)
                              setCustomItirazlar(updated)
                              localStorage.setItem('nmm_custom_objections_v1', JSON.stringify(updated))
                              toast.success(lang === 'en' ? 'Objection deleted.' : 'İtiraz silindi.')
                            }
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-3)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all hover:scale-105"
                          title={lang === 'en' ? 'Delete Objection' : 'İtirazı Sil'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Favori butonu */}
                      <button
                        onClick={e => toggleFav(itiraz.id, e)}
                        title={isFav ? (lang === 'en' ? 'Remove from favorites' : 'Favorilerden çıkar') : (lang === 'en' ? 'Add to favorites' : 'Favorilere ekle')}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                          isFav
                            ? 'bg-[#9B1D47]/10 text-[#9B1D47] dark:bg-[#fda4af]/10 dark:text-[#fda4af]'
                            : 'text-[var(--text-3)] hover:text-[#9B1D47] dark:hover:text-[#fda4af]'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
                        strokeWidth={2}
                      />
                    </button>

                    {/* Cevap — açılır panel */}
                    {acik && (
                      <div className="border-t border-[#9B1D47]/10 dark:border-[#fda4af]/10 px-4 pb-4 pt-3 bg-[var(--bg-subtle)]/10 rounded-b-2xl animate-in fade-in duration-200">
                        <div className="flex gap-2">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F3] dark:bg-[#3d0a1a]">
                            <span className="text-[10px]">💡</span>
                          </div>
                          <div className="flex-1 text-sm leading-relaxed text-[var(--text-2)] space-y-3">
                            {itiraz.cevap ? (
                              <p>{cevap}</p>
                            ) : (
                              <>
                                {itiraz.kisaCevap && (
                                  <div>
                                    <h5 className="text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af] uppercase tracking-wider mb-0.5">Kısa Saha Cevabı</h5>
                                    <p className="italic font-medium">"{itiraz.kisaCevap}"</p>
                                  </div>
                                )}
                                {itiraz.detayliCevap && (
                                  <div>
                                    <h5 className="text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af] uppercase tracking-wider mb-0.5">Detaylı Cevap</h5>
                                    <p className="whitespace-pre-wrap">{itiraz.detayliCevap}</p>
                                  </div>
                                )}
                                {itiraz.yaklasim && (
                                  <div className="bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border)] mt-2">
                                    <h5 className="text-[10px] font-bold text-[var(--text-2)] uppercase tracking-wider mb-1 flex items-center gap-1">🛡️ Yaklaşım</h5>
                                    <p className="text-xs text-[var(--text-3)] leading-relaxed">{itiraz.yaklasim}</p>
                                  </div>
                                )}
                                {itiraz.ornekDiyalog && (
                                  <div className="bg-[#FFF1F3]/40 dark:bg-[#3d0a1a]/20 p-3 rounded-xl border border-[#FFE4EA] dark:border-[#3d0a1a]/40 mt-2">
                                    <h5 className="text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af] uppercase tracking-wider mb-1 flex items-center gap-1">💬 Örnek Diyalog</h5>
                                    <p className="text-xs italic leading-relaxed whitespace-pre-wrap">"{itiraz.ornekDiyalog}"</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {(() => {
                          const copyValue = itiraz.cevap ? cevap : `${itiraz.kisaCevap ? `Kısa Cevap:\n${itiraz.kisaCevap}\n\n` : ''}${itiraz.detayliCevap ? `Detaylı Cevap:\n${itiraz.detayliCevap}\n\n` : ''}${itiraz.ornekDiyalog ? `Örnek Diyalog:\n${itiraz.ornekDiyalog}` : ''}`.trim()
                          return (
                            <div className="mt-3 ml-7 flex flex-wrap items-center gap-2">
                              {/* Kopyala */}
                              <button
                                onClick={e => copyCevap(copyValue, itiraz.id, e)}
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                  copied
                                    ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e] dark:text-[#4ade80]'
                                    : 'bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#FFF1F3] hover:text-[#9B1D47] dark:hover:bg-[#3d0a1a] dark:hover:text-[#fda4af]'
                                }`}
                              >
                                {copied
                                  ? <><Check className="h-3 w-3" /> {lang === 'en' ? 'Copied!' : 'Kopyalandı!'}</>
                                  : <><Copy className="h-3 w-3" /> {lang === 'en' ? 'Copy Answer' : 'Cevabı Kopyala'}</>
                                }
                              </button>

                              {/* WhatsApp ile Gönder */}
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(copyValue)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1.5 rounded-xl bg-[#E7FBF0] dark:bg-[#0d2e1a]/50 px-3 py-1.5 text-xs font-semibold text-[#1a9e4f] dark:text-[#4ade80] transition-all hover:bg-[#d4f7e4] dark:hover:bg-[#0d2e1a]"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.523 5.845L0 24l6.335-1.508A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 01-5.031-1.386l-.361-.214-3.761.896.953-3.651-.235-.374A9.778 9.778 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                                </svg>
                                {lang === 'en' ? 'Send via WhatsApp' : 'WhatsApp İle Gönder'}
                              </a>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => { setPage(p); setAcikId(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all ${
                    page === p
                      ? 'bg-[#9B1D47] text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]'
                      : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#9B1D47] dark:hover:border-[#fda4af]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Kendi İtirazını Ekle Pop-up Formu */}
      {formOpen && (
        <div className={`fixed inset-0 ${Z.fullscreen} flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200`}>
          <div className="relative w-full max-w-xl md:max-w-2xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 md:p-7 shadow-2xl overflow-y-auto my-auto max-h-[85vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200 space-y-4 md:space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-base md:text-lg font-bold text-[var(--text-1)]">{lang === 'en' ? 'Add Objection' : 'İtiraz Ekle'}</h2>
                <p className="text-[11px] md:text-xs text-[var(--text-3)] font-medium mt-0.5">
                  Sahada duyduğun yeni itirazları kısa ve detaylı cevaplarıyla birlikte bankaya ekleyebilirsin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex items-center gap-1 text-[11px] md:text-xs font-bold text-[var(--text-3)] hover:text-[#9B1D47] dark:hover:text-[#fda4af] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Formu Kapat</span>
              </button>
            </div>

            <form onSubmit={handleAddObjection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* İtiraz Soru */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">İtiraz (Soru)</label>
                  <input
                    type="text"
                    required
                    value={newSoru}
                    onChange={e => setNewSoru(e.target.value)}
                    placeholder="Örn. Bu iş uzun vadede yorucu gelmiyor mu?"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition"
                  />
                </div>
                {/* Kategori */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Kategori</label>
                  <select
                    value={newKategori}
                    onChange={e => setNewKategori(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition"
                  >
                    <option value="Para & Kazanç">Para & Kazanç</option>
                    <option value="Zaman & Yoğunluk">Zaman & Yoğunluk</option>
                    <option value="Güven & Şüphe">Güven & Şüphe</option>
                    <option value="Yetenek & Kimlik">Yetenek & Kimlik</option>
                    <option value="Aile & Çevre">Aile & Çevre</option>
                    <option value="Ürün & Sistem">Ürün & Sistem</option>
                    <option value="Genel">Genel</option>
                  </select>
                </div>
              </div>

              {/* Kısa Cevap */}
              <div className="space-y-1">
                <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Kısa Cevap</label>
                <textarea
                  rows={3}
                  value={newKisaCevap}
                  onChange={e => setNewKisaCevap(e.target.value)}
                  placeholder="Kısa ve hızlı saha cevabı..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition resize-none"
                />
              </div>

              {/* Detaylı Cevap */}
              <div className="space-y-1">
                <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Detaylı Cevap</label>
                <textarea
                  rows={4}
                  value={newDetayliCevap}
                  onChange={e => setNewDetayliCevap(e.target.value)}
                  placeholder="Detaylı cevap metni..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Yaklaşım */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Yaklaşım</label>
                  <textarea
                    rows={3}
                    value={newYaklasim}
                    onChange={e => setNewYaklasim(e.target.value)}
                    placeholder="Bu itirazı nasıl ele almak gerektiğini yaz..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition resize-none"
                  />
                </div>
                {/* Örnek Diyalog */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Örnek Diyalog</label>
                  <textarea
                    rows={3}
                    value={newOrnekDiyalog}
                    onChange={e => setNewOrnekDiyalog(e.target.value)}
                    placeholder="Kısa örnek konuşma..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emoji Seçimi */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Emoji</label>
                  <select
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition"
                  >
                    <option value="🛡️">🛡️ Kalkan</option>
                    <option value="⚖️">⚖️ Terazi</option>
                    <option value="💰">💰 Para Torbası</option>
                    <option value="⏳">⏳ Kum Saati</option>
                    <option value="🤝">🤝 El Sıkışma</option>
                    <option value="🗣️">🗣️ Konuşma</option>
                    <option value="🚪">🚪 Kapı</option>
                    <option value="🕌">🕌 Cami</option>
                  </select>
                </div>

                {/* Etiketler */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Etiketler (Virgülle Ayır)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="örn. güven, fiyat, zamanlama"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold transition active:scale-95 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#9B1D47] hover:bg-[#801438] text-white px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  + Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default function ItirazlarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-3)]">Yükleniyor...</div>}>
      <ItirazlarPageContent />
    </Suspense>
  )
}
