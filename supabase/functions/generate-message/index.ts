// Supabase Edge Function: generate-message
// Deploy: supabase functions deploy generate-message
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const categoryDescriptions: Record<string, string> = {
  first_contact: 'İlk temas — kişiyle ilk defa iletişim kuruyorsun',
  warm_up: 'Bağ kurma — ilişkiyi ısıtmak için yazıyorsun',
  value_share: 'Değer paylaşımı — bir şey öğretiyor veya hediye ediyorsun',
  invitation: 'Davet — sunum, etkinlik veya bilgi toplantısına davet',
  follow_up: 'Takip — önceki görüşme veya sunum sonrası takip',
  objection_handling: 'İtiraz yönetimi — itirazına cevap veriyorsun',
  closing: 'Karar aşaması — kararını netleştirmek için yazıyorsun',
  after_no: '"Hayır" sonrası — reddettikten sonra ilişkiyi korumak',
  reactivation: 'Yeniden bağlanma — uzun süredir görüşmediğin biri',
  birthday: 'Doğum günü — samimi bir tebrik mesajı',
  thank_you: 'Teşekkür — bir iyilik, satın alma veya destekten sonra',
  onboarding: 'Yeni üye karşılama — ekibe katılan birine hoş geldin',
}

const systemPrompt = `Sen bir network marketing distribütörünün mesaj yazma asistanısın.
Görevin: Distribütörün kontağına gönderebileceği DOĞAL, SAMİMİ ve İLİŞKİ ODAKLI mesajlar yazmak.

ASLA şunları yapma:
- Manipülatif dil kullanma
- "Hayatını değiştirecek fırsat", "kaçırma", "son şans" gibi spam ifadeler
- Aşırı heyecanlı ünlem (!!!)
- Direkt satış pitch'i
- Linkler ekleme (kullanıcı kendi ekleyecek)
- Acelecilik veya baskı
- Büyük harflerle vurgu (SATIŞ YAP gibi)

HER ZAMAN şunları yap:
- Kişinin durumuna gerçekten referans ver (meslek, çocuk, hobiler)
- Önce bağ kur, sonra konuya gel
- Açık uçlu soru sor, monolog yapma
- Doğal, arkadaşça Türkçe kullan
- Çıkış kapısı bırak ("istemezsen tamamen normal")
- Mesaj başına TEK bir aksiyon hedefle
- WhatsApp için kısa tut (3-4 cümle max), email için daha uzun olabilir`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { contactSnapshot, category, channel, tone, userInput } = body

    const contact = contactSnapshot ?? {}

    const toneDescriptions: Record<string, string> = {
      friendly: 'samimi, sıcak, arkadaşça',
      professional: 'profesyonel, saygılı, net',
      curious: 'meraklı, düşündürücü, soru odaklı',
      empathetic: 'empatik, anlayışlı, destekleyici',
      confident: 'kendinden emin, güven veren, sakin',
      humorous: 'hafif esprili, neşeli, doğal',
    }

    const userPrompt = `Kontak bilgileri:
- Ad: ${contact.full_name ?? 'Kontak'}
- Meslek: ${contact.occupation ?? 'belirtilmemiş'}
- Şehir: ${contact.city ?? 'belirtilmemiş'}
- İlişki türü: ${contact.relationship ?? 'tanıdık'}
- Hedefleri: ${contact.goals?.join(', ') ?? 'bilinmiyor'}
- Sıkıntıları: ${contact.pain_points?.join(', ') ?? 'bilinmiyor'}
- İlgi alanları: ${contact.interests?.join(', ') ?? 'bilinmiyor'}
- Son etkileşim notu: ${contact.lastInteractionNote ?? 'henüz yok'}
- Mevcut aşaması: ${contact.stage ?? 'bilinmiyor'}
- Sıcaklık skoru: ${contact.warmth_score ?? 50}/100

Görev:
- Kategori: ${category} — ${categoryDescriptions[category] ?? category}
- Kanal: ${channel}
- Ton: ${tone} (${toneDescriptions[tone] ?? tone})
- Ek bağlam: ${userInput ?? 'yok'}

3 farklı versiyon üret. Her versiyon farklı bir açılış stratejisi kullansın.
Örnek: 1. soru ile başla, 2. ortak referansa değin, 3. değer paylaşımıyla aç.

SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "variants": [
    { "approach": "Soru ile başlat", "message": "..." },
    { "approach": "Ortak referans", "message": "..." },
    { "approach": "Değer paylaşımı", "message": "..." }
  ]
}`

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: { variants: Array<{ approach: string; message: string }> }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
    } catch {
      parsed = {
        variants: [{ approach: 'AI yanıtı', message: rawText }],
      }
    }

    return new Response(
      JSON.stringify({
        variants: parsed.variants,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('[generate-message] error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
