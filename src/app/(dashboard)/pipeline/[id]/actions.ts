'use server'

import { generateMessage } from '@/lib/ai/generateMessage'

export interface CoachState {
  message?: string
  error?: string
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

  try {
    const message = await generateMessage({ name, stage, note, messageType })
    return { message }
  } catch {
    return { error: 'Mesaj oluşturulamadı.' }
  }
}
