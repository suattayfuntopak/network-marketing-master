// Supabase Edge Function: generate-message
// Deploy: supabase functions deploy generate-message
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk'

type AIMessageErrorCode =
  | 'missing_config'
  | 'network_error'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limit'
  | 'invalid_request'
  | 'function_runtime_error'
  | 'unknown_error'

interface ErrorResponseBody {
  code: AIMessageErrorCode
  message: string
  details?: string
}

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

const VALID_CATEGORIES = new Set(Object.keys(categoryDescriptions))
const VALID_CHANNELS = new Set(['whatsapp', 'telegram', 'sms', 'email', 'instagram_dm', 'any'])
const VALID_TONES = new Set(['friendly', 'professional', 'curious', 'empathetic', 'confident', 'humorous'])

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(status: number, code: AIMessageErrorCode, message: string, details?: string) {
  const payload: ErrorResponseBody = { code, message }
  if (details) payload.details = details
  return jsonResponse(payload, status)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'invalid_request', 'Unsupported request method.', 'method_not_allowed')
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse(400, 'invalid_request', 'Request body is invalid.', 'invalid_json')
    }

    if (!isRecord(body)) {
      return errorResponse(400, 'invalid_request', 'Request body is invalid.', 'body_must_be_object')
    }

    const { contactSnapshot, category, channel, tone, userInput } = body

    if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
      return errorResponse(400, 'invalid_request', 'Message category is invalid.', 'invalid_category')
    }

    if (typeof channel !== 'string' || !VALID_CHANNELS.has(channel)) {
      return errorResponse(400, 'invalid_request', 'Message channel is invalid.', 'invalid_channel')
    }

    if (typeof tone !== 'string' || !VALID_TONES.has(tone)) {
      return errorResponse(400, 'invalid_request', 'Message tone is invalid.', 'invalid_tone')
    }

    if (userInput !== undefined && typeof userInput !== 'string') {
      return errorResponse(400, 'invalid_request', 'Additional context is invalid.', 'invalid_user_input')
    }

    if (contactSnapshot !== undefined) {
      if (!isRecord(contactSnapshot)) {
        return errorResponse(400, 'invalid_request', 'Contact context is invalid.', 'invalid_contact_snapshot')
      }

      if (contactSnapshot.goals !== undefined && contactSnapshot.goals !== null && !isStringArray(contactSnapshot.goals)) {
        return errorResponse(400, 'invalid_request', 'Contact goals are invalid.', 'invalid_contact_goals')
      }

      if (contactSnapshot.pain_points !== undefined && contactSnapshot.pain_points !== null && !isStringArray(contactSnapshot.pain_points)) {
        return errorResponse(400, 'invalid_request', 'Contact pain points are invalid.', 'invalid_contact_pain_points')
      }

      if (contactSnapshot.interests !== undefined && contactSnapshot.interests !== null && !isStringArray(contactSnapshot.interests)) {
        return errorResponse(400, 'invalid_request', 'Contact interests are invalid.', 'invalid_contact_interests')
      }
    }

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

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      console.error('[generate-message] Missing config: ANTHROPIC_API_KEY')
      return errorResponse(503, 'missing_config', 'AI message generation is not configured.', 'missing_anthropic_api_key')
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    let response
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
    } catch (err) {
      const status = typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status)
        : undefined
      const providerMessage = err instanceof Error ? err.message : 'Unknown provider error'

      if (status === 400 || status === 422) {
        console.error('[generate-message] Invalid provider request:', { status, providerMessage })
        return errorResponse(400, 'invalid_request', 'The AI request could not be processed.', 'provider_invalid_request')
      }

      if (status === 401) {
        console.error('[generate-message] Provider unauthorized:', { status, providerMessage })
        return errorResponse(502, 'unauthorized', 'AI service authorization failed.', 'provider_unauthorized')
      }

      if (status === 403) {
        console.error('[generate-message] Provider forbidden:', { status, providerMessage })
        return errorResponse(502, 'forbidden', 'AI service access is denied.', 'provider_forbidden')
      }

      if (status === 429) {
        console.error('[generate-message] Provider rate limited:', { status, providerMessage })
        return errorResponse(429, 'rate_limit', 'AI service is temporarily rate limited.', 'provider_rate_limited')
      }

      console.error('[generate-message] Provider runtime error:', { status, providerMessage })
      return errorResponse(502, 'function_runtime_error', 'AI service is currently unavailable.', 'provider_runtime_error')
    }

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    if (!rawText.trim()) {
      console.error('[generate-message] Empty model response')
      return errorResponse(502, 'function_runtime_error', 'AI service returned an empty response.', 'empty_model_response')
    }

    let parsed: { variants: Array<{ approach: string; message: string }> }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
    } catch {
      parsed = {
        variants: [{ approach: 'AI yanıtı', message: rawText }],
      }
    }

    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      console.error('[generate-message] Invalid variants payload')
      return errorResponse(502, 'function_runtime_error', 'AI service returned an invalid response.', 'invalid_variants_payload')
    }

    return jsonResponse({
      variants: parsed.variants,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    })
  } catch (err) {
    console.error('[generate-message] unexpected error:', err)
    return errorResponse(500, 'unknown_error', 'Unexpected error while generating AI message.', 'unexpected_runtime_error')
  }
})
