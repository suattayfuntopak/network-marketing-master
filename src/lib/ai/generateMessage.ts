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
        text: `Sen bir network marketing danışmanısın. WhatsApp için kısa, samimi ve Türkçe mesajlar yazıyorsun.\n\nKurallar:\n- Maksimum 3 kısa paragraf\n- 2-3 emoji kullanabilirsin\n- Kişisel, sıcak ve doğal ol\n- Satış baskısı yapma\n- Sadece mesaj metnini yaz, başka açıklama ekleme`,
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
