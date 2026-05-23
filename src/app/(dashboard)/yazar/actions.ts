'use server'

import Anthropic from '@anthropic-ai/sdk'

export interface YazarFormState {
  message?: string
  error?: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STAGE_CONTEXT: Record<string, string> = {
  yeni:     'Bu kişiyle henüz iletişim kurulmadı. İlk temas mesajı yazılacak.',
  iletisim: 'Bu kişiyle daha önce iletişim kuruldu. Takip mesajı yazılacak.',
  takip:    'Bu kişi takip aşamasında. Tekrar hatırlatma mesajı yazılacak.',
  sunum:    'Bu kişiye sunum yapıldı. Geri bildirim isteği ya da sonraki adım mesajı yazılacak.',
  kararsiz: 'Bu kişi kararsız. Şüphelerini gidermeye yönelik nazik bir mesaj yazılacak.',
}

export async function generateMessageAction(
  _prev: YazarFormState,
  formData: FormData
): Promise<YazarFormState> {
  const name    = (formData.get('name')    as string | null)?.trim() ?? ''
  const stage   = (formData.get('stage')   as string | null)?.trim() ?? ''
  const context = (formData.get('context') as string | null)?.trim() ?? ''
  const tone    = (formData.get('tone')    as string | null)?.trim() ?? 'samimi'

  if (!name || !stage) return { error: 'Ad ve aşama zorunlu.' }

  const stageInfo = STAGE_CONTEXT[stage] ?? ''

  const prompt = `Sen bir network marketing danışmanısın. WhatsApp için kısa, samimi ve Türkçe bir mesaj yaz.

Alıcı: ${name}
Aşama: ${stage} — ${stageInfo}
Ek bilgi: ${context || 'Yok'}
Ton: ${tone}

Kurallar:
- Maksimum 3 kısa paragraf
- Emoji kullanabilirsin ama abartma (2-3 yeterli)
- Doğal ve kişisel görünsün
- Satış baskısı yapma
- Sadece mesaj metnini yaz, açıklama ekleme`

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
    return { error: 'Mesaj oluşturulamadı. ANTHROPIC_API_KEY ayarlı mı?' }
  }
}
