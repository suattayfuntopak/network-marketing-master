export function generateLocalFallbackMessage({
  name,
  stage,
  context,
  tone = 'samimi',
  warmth = 'ilik',
}: {
  name: string
  stage: string
  context?: string
  tone?: string
  warmth?: string
}): string {
  const firstName = name.split(' ')[0] || name

  // Tone adjustments (default to samimi)
  const isFormal = tone === 'profesyonel' || tone === 'mesafeli'
  const isHot = warmth === 'sicak'
  const isCold = warmth === 'soguk'

  let baseText = ''

  switch (stage) {
    case 'yeni':
      baseText = isFormal
        ? `Merhaba ${firstName} Hanım/Bey, umarım iyisinizdir. Sizinle profesyonel iş birlikleri ve yeni fırsatlar üzerine kısa bir görüşme yapmak isterim. Müsait bir zamanınızda görüşebilir miyiz?`
        : `Selam ${firstName}, nasılsın? İş/kariyer alanında harika bir fırsat üzerine konuşuyorduk bazı arkadaşlarla, aklıma direkt sen geldin. Uygun bir zamanda kısa bir kahve sohbeti yapalım mı?`;
      break
    case 'iletisim':
      baseText = isFormal
        ? `Merhaba ${firstName}, daha önce bahsettiğim sektörel gelişmelerle ilgili fikirlerinizi merak ediyorum. Konuyu değerlendirme fırsatınız oldu mu?`
        : `Selam ${firstName}, nasılsın? Geçen gün bahsettiğim projeyi inceleme veya üzerine düşünme şansın oldu mu? Aklına takılan herhangi bir detayı netleştirmek isterim.`;
      break
    case 'davetli':
      baseText = isFormal
        ? `Merhaba ${firstName}, planladığımız sunum / bilgilendirme toplantımızın zamanı yaklaşıyor. Katılım durumunuzu teyit etmek isterim. Görüşmek üzere.`
        : `Selam ${firstName}! Sunum/toplantı saatimiz yaklaşıyor, takvimini kontrol edebildin mi? Heyecanlı ve verimli bir görüşme olacak, sabırsızlıkla bekliyorum.`;
      break
    case 'sunum':
      baseText = isFormal
        ? `Merhaba ${firstName}, gerçekleştirdiğimiz sunumun ardından kafanızda netleşmeyen noktalar olup olmadığını sormak istedim. Projenin iş modelinize uygunluğu hakkında ne düşünüyorsunuz?`
        : `Selam ${firstName}, sunum nasıl geldi sana? Kafana yatan veya 'şurasını tam anlamadım' dediğin yerler oldu mu? Senin vizyonunla bu projede çok güzel şeyler yapabileceğimize inanıyorum.`;
      break
    case 'takip':
      baseText = isFormal
        ? `Merhaba ${firstName}, karar sürecinizi kolaylaştırmak adına ek bilgiye ihtiyaç duyup duymadığınızı sormak istedim. Süreci birlikte nasıl ilerletebiliriz?`
        : `Selam ${firstName}! Karar sürecinde acele etmeni hiç istemem, ama süreci netleştirmek adına kafanı kurcalayan bir şey varsa konuşabiliriz. Ne durumdayız, nasıl ilerleyelim?`;
      break
    case 'kararsiz':
      baseText = isFormal
        ? `Merhaba ${firstName}, karar verme aşamasında bazı tereddütleriniz olduğunu hissediyorum. Size daha şeffaf bilgiler sunarak destek olmak isterim.`
        : `Selam ${firstName}, karar vermek bazen kafa karıştırıcı olabilir, çok normal. Kafandaki soru işaretlerini birlikte masaya yatırıp netleştirelim mi? Görüşün benim için önemli.`;
      break
    case 'katildi':
      baseText = isFormal
        ? `Tebrik ederim ${firstName}, ekibimize hoş geldiniz! Başarılı bir iş ortaklığı yürüteceğimize inancım tam. Yol haritamızı belirlemek için ilk planlama toplantımızı ne zaman yapalım?`
        : `Harika bir başlangıç ${firstName}! Ekibe katıldığın için çok mutluyum, birlikte harika işler çıkaracağız. İlk adımları planlamak ve yol haritamızı çizmek için ne zaman müsait olursun?`;
      break
    case 'ilgilenmedi':
      baseText = isFormal
        ? `Zaman ayırdığınız için teşekkür ederim ${firstName}. Kararınıza saygı duyuyorum. İleride profesyonel yollarımızın tekrar kesişmesini dilerim. Sağlıcakla kalın.`
        : `Zaman ayırdığın için çok teşekkürler ${firstName}. Kararına son derece saygı duyuyorum, canın sağ olsun. Kapımız her zaman açık, kendine çok iyi bak!`;
      break
    case 'pasif':
      baseText = isFormal
        ? `Merhaba ${firstName}, uzun süredir iletişim kuramadık. Çalışmalarınızda her şeyin yolunda olduğunu umuyorum. Güncel durumunuzla ilgili konuşmak isterseniz buradayım.`
        : `Selam ${firstName}, epeydir sesin çıkmadı, her şey yolundadır umarım? Hayat nasıl gidiyor, işler güçler nasıl? Müsait bir ara mutlaka haberleşelim, özlettin kendini.`;
      break
    case 'kayboldu':
      baseText = isFormal
        ? `Merhaba ${firstName}, süreçlerimiz şu an için askıda kalmış görünse de her zaman iletişime açık olduğumu belirtmek isterim. Başarılar dilerim.`
        : `Selam ${firstName}, gündemler yoğunlaştı ve biraz koptuk sanırım, hiç sorun değil. Her zaman buradayım, ne zaman istersen yazabilirsin. Kendine çok iyi bak!`;
      break
    default:
      baseText = `Selam ${firstName}, nasılsın? İş birliğimiz ve sürecimiz hakkında konuşmak, güncel durumlarımızı değerlendirmek üzere haberleşmek istedim.`
  }

  // Adjust message based on warmth if applicable
  if (isHot && !isFormal) {
    baseText += ' Seni ekibimde görmek için sabırsızlanıyorum! 🔥'
  } else if (isCold && !isFormal) {
    baseText += ' Müsait olduğunda, acele etmeden dönüş yapabilirsin. ❄️'
  }

  if (context && context.trim().length > 0) {
    baseText += `\n\n(Not: ${context.trim()})`
  }

  return baseText
}

export function generateLocalCoachAnswer(question: string, lang: 'tr' | 'en' = 'tr'): string {
  const q = question.toLowerCase()
  const isEn = lang === 'en'

  if (isEn) {
    if (q.includes('no money') || q.includes('price') || q.includes('expensive')) {
      return `Here is a tip for the "No Money/Too Expensive" objection:
1. Empathy: "I completely understand. When I first saw this, I also had to think about the budget."
2. Reframe: "Let me ask you this: If you were 100% sure this project would solve your financial issues in 6-12 months, would you find a way to start?"
3. Trust: Focus on education, showing that they can start at a pace comfortable for them, without any pressure.`
    }
    if (q.includes('no time') || q.includes('busy')) {
      return `Here is a tip for the "No Time" objection:
1. Empathy: "I understand. We are all extremely busy with life and work."
2. Reframe: "Actually, this business is designed for busy people. If we could build this in just 4-5 hours a week around your current schedule to get your time back, would you want to see how?"
3. Focus on leverage: Show how team compounding helps reclaim time.`
    }
    if (q.includes('pyramid') || q.includes('scam')) {
      return `Here is a tip for the "Is this a pyramid scheme?" objection:
1. Empathy: "I appreciate you asking. With so many things online, it's smart to be cautious."
2. Reframe: "In pyramid schemes, money flows from recruiting people with no real product. Here, we only earn commissions on real products being moved to customers. It's a legitimate direct-sales model registered legally."
3. Proof: Offer to share legal documentation and details on product value.`
    }
    return `The AI Coach service is currently busy or offline. 
However, remember the golden rule of Network Marketing coaching:
1. Listen carefully to prospect concerns.
2. Empathize and align (Feel, Felt, Found).
3. Ask clarifying questions rather than defending.
4. Keep the presentation simple and rely on tools, not your own explanations.`
  }

  // Turkish
  if (q.includes('para') || q.includes('pahalı') || q.includes('bütçe')) {
    return `Yapay Zeka Koçu şu an çevrimdışı, ancak onaylı İtiraz Bankası'ndaki "Param Yok / Pahalı" yaklaşımını senin için hazırladım:
1. Empati Kur: "Seni çok iyi anlıyorum. Ben de ilk duyduğumda bütçemi ayarlayıp ayarlayamayacağımı düşünmüştüm."
2. Yeniden Çerçevele: "Sana şunu sorsam: Eğer bu işin 6-12 ay içinde senin finansal sıkıntılarını çözeceğine %100 inansaydın, başlamak için bir yolunu bulur muydun?"
3. Şeffaflık: Ürünlerin değerini ve harcanan paranın bir gider değil, kendi işini kurmak için bir yatırım olduğunu vurgula. Kararı tamamen adaya bırak.`
  }
  if (q.includes('zaman') || q.includes('vakit') || q.includes('meşgul')) {
    return `Yapay Zeka Koçu şu an çevrimdışı, ancak onaylı İtiraz Bankası'ndaki "Zamanım Yok / Çok Meşgulüm" yaklaşımını senin için hazırladım:
1. Empati Kur: "Çok haklısın, günümüzde hepimiz yoğun bir koşturmaca içindeyiz."
2. Yeniden Çerçevele: "Aslında bu iş tam olarak zamanı olmayanlar için tasarlandı. Mevcut işini aksatmadan, haftada sadece 4-5 saatlik doğru bir planlamayla zaman özgürlüğünü kazanmak isteseydin, bunu nasıl yapabileceğimizi görmek ister miydin?"
3. Kaldıraç Etkisi: Takım kurarak zamanı nasıl katlayabileceğini ve zaman özgürlüğüne nasıl ulaşacağını göster.`
  }
  if (q.includes('piramit') || q.includes('titan') || q.includes('saadet') || q.includes('zincir')) {
    return `Yapay Zeka Koçu şu an çevrimdışı, ancak onaylı İtiraz Bankası'ndaki "Piramit / Saadet Zinciri mi?" yaklaşımını senin için hazırladım:
1. Empati Kur: "Bu soruyu sorman çok normal, dışarıda kafa karıştırıcı çok fazla yapı var. Temkinli olman harika."
2. Yeniden Çerçevele: "Piramit sistemlerde ortada gerçek bir ürün yoktur, sadece insan üye yaparak para kazanılır ve bu yasa dışıdır. Bizim işimizde ise doğrudan satış modeliyle tamamen yasal, faturalı ürünlerin satışı üzerinden gelir elde edilir."
3. Resmi Belge: Şirketin yasal izinlerini, doğrudan satış derneği üyeliklerini ve ürün sertifikalarını paylaşmayı teklif et.`
  }
  if (q.includes('çevre') || q.includes('kimseyi tanımıyorum')) {
    return `Yapay Zeka Koçu şu an çevrimdışı, ancak "Çevrem Yok" itirazı için şu adımları izleyebilirsin:
1. Empati Kur: "Çok normal bir endişe. Ben de başlarken çevremdeki insanların bu işle ilgilenmeyeceğini düşünmüştüm."
2. Yeniden Çerçevele: "Sana bu işi mevcut çevrene satış yapmak için değil, sosyal medya ve doğru listeleme teknikleriyle sıfırdan profesyonel bir çevre inşa etmek için kullanabileceğini göstersem, nasıl olurdu?"
3. Yöntem: Aday listesi oluşturma teknikleri ve sosyal medya ile aday bulma eğitimlerimizden bahset.`
  }

  return `Yapay Zeka Koçu şu an çevrimdışı veya yanıt veremiyor. 
Ancak Network Marketing genel ilkelerine göre sana şu önerileri sunabilirim:
1. Adaylarla ilişkinde asla baskıcı veya ısrarcı olma (Karar adaya ait olmalı).
2. "Bence" demek yerine her zaman üçüncü şahıs araçlarını (sunum videosu, broşür, sponsor desteği) kullan.
3. Düzenli takip yap: Adayların %80'i 4. ile 12. takip arasında katılır.
4. Günlük hedeflerine odaklan ve tutarlılık göster.`
}
