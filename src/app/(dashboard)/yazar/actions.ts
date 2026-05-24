'use server'

import { generateMessage } from '@/lib/ai/generateMessage'

export interface YazarFormState {
  message?: string
  error?: string
}

export async function generateMessageAction(
  _prev: YazarFormState,
  formData: FormData
): Promise<YazarFormState> {
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const context     = (formData.get('context')     as string | null)?.trim() ?? ''
  const tone        = (formData.get('tone')        as string | null)?.trim() ?? 'samimi'
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'

  if (!name) return { error: 'Kişi adı zorunlu.' }

  try {
    const message = await generateMessage({ name, stage, context, tone, messageType })
    return { message }
  } catch {
    return { error: 'Mesaj oluşturulamadı. ANTHROPIC_API_KEY ayarlı mı?' }
  }
}
