'use server'

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STAGE_CONTEXT: Record<string, string> = {
  yeni:        'İlk kez iletişim kurulacak kişi.',
  iletisim:    'İletişime geçilmiş, tanışma aşamasında.',
  davetli:     'Toplantıya veya sunuma davet edilmiş.',
  sunum:       'Sunum yapılmış, karar aşamasında.',
  takip:       'Aktif takip sürecinde, düzenli iletişim gerekiyor.',
  kararsiz:    'Henüz karar vermemiş, tereddütleri var.',
  katildi:     'Ekibe katılmış, onboarding sürecinde.',
  ilgilenmedi: 'Şu an ilgilenmedi, kapı açık tutulmalı.',
  kayboldu:    'İletişim kesilmiş, yeniden bağlantı kurulmaya çalışılıyor.',
}

const TYPE_CONTEXT: Record<string, string> = {
  genel:    'Genel iletişim — doğal ve samimi selamlama.',
  davet:    'Bir etkinliğe veya sunum seansına davet et.',
  sunum:    'Fırsatı tanıtmak için ön hazırlık mesajı yaz.',
  takip:    'Önceki görüşmenin takibini yap.',
  tesekkur: 'Zaman ve ilgisi için teşekkür et.',
}

export interface GenerateMessageInput {
  name: string
  stage?: string
  note?: string
  context?: string
  tone?: string
  messageType?: string
}

export async function generateMessage(input: GenerateMessageInput): Promise<string> {
  const {
    name,
    stage = '',
    note = '',
    context = '',
    tone = 'samimi',
    messageType = 'genel',
  } = input

  if (!name) throw new Error('Kişi adı zorunlu.')

  const stageInfo = stage ? (STAGE_CONTEXT[stage] ?? '') : ''
  const typeInfo  = TYPE_CONTEXT[messageType] ?? ''

  const stageStr = stage && stageInfo ? `Aşama: ${stage} — ${stageInfo}\n` : ''
  const noteStr  = note    ? `Notlar: ${note}\n`      : ''
  const ctxStr   = context ? `Ek bilgi: ${context}\n` : ''

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: `Sen bir network marketing danışmanısın. Üç görevin var:

1. MESAJ ÜRETME: Kişi adı, boru hattı aşaması ve ek bilgiler verildiğinde o kişiye WhatsApp'tan gönderilecek Türkçe mesaj yaz. Kısa (max 3 paragraf), samimi, 2-3 emoji, satış baskısı yok.

2. NM SORU-CEVAP: Ek Bilgi alanında network marketing, MLM, doğrudan satış, ekip büyütme, ürün tanıtımı, kişisel gelişim, pasif gelir veya bu sektörle ilgili bir soru sorulursa kısa ve pratik Türkçe cevap ver.

3. KONU DIŞI: Ek Bilgi'de yukarıdakilerle tamamen ilgisiz bir istek varsa (haberler, tarih, yemek, yazılım, matematik vb.) sadece şunu yaz: "Bu konuda yardımcı olamıyorum 😊 Network marketing ile ilgili sorularında veya mesaj hazırlamanda her zaman buradayım!"

Her durumda sadece yanıtı veya mesajı yaz, başka açıklama ekleme.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Alıcı: ${name}\n${stageStr}Mesaj Türü: ${messageType} — ${typeInfo}\n${noteStr}${ctxStr}Ton: ${tone}`,
      },
    ],
  })

  const message = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()

  if (!message) throw new Error('Boş yanıt döndü.')
  return message
}
