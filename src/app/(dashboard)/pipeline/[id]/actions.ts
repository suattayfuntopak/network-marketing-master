'use server'

import Anthropic from '@anthropic-ai/sdk'

export interface CoachState {
  message?: string
  error?: string
}

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
  davet:    'Bir etkinliğe veya sunum seansına davet et.',
  sunum:    'Fırsatı tanıtmak için ön hazırlık mesajı yaz.',
  takip:    'Önceki görüşmenin takibini yap.',
  tesekkur: 'Zaman ve ilgisi için teşekkür et.',
  genel:    'Samimi ve doğal bir iletişim mesajı yaz.',
}

export async function generateCoachMessage(
  _prev: CoachState,
  formData: FormData,
): Promise<CoachState> {
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const note        = (formData.get('note')        as string | null)?.trim() ?? ''
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'

  if (!name || !stage) return { error: 'Kişi bilgisi eksik.' }

  const stageInfo = STAGE_CONTEXT[stage] ?? ''
  const typeInfo  = TYPE_CONTEXT[messageType] ?? ''

  const prompt = `Sen bir network marketing danışmanısın. WhatsApp için kişiye özel, kısa ve Türkçe bir mesaj yaz.

Kişi: ${name}
Süreç Aşaması: ${stage} — ${stageInfo}
Mesaj Amacı: ${messageType} — ${typeInfo}
Kişi hakkında notlar: ${note || 'Yok'}

Kurallar:
- Maksimum 3 kısa paragraf
- 2-3 emoji kullanabilirsin
- Kişisel, sıcak ve doğal ol
- Satış baskısı yapma
- Sadece mesaj metnini yaz, başka açıklama ekleme`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const message = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    return { message }
  } catch {
    return { error: 'Mesaj oluşturulamadı.' }
  }
}
