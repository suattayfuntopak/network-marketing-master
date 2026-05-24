'use server'

import { generateMessage } from '@/lib/ai/generateMessage'

export async function generateQuickMessageAction(input: {
  name: string
  stage: string
  note?: string | null
}): Promise<{ message?: string; error?: string }> {
  if (!input.name) return { error: 'Kişi adı eksik.' }
  try {
    const message = await generateMessage({
      name: input.name,
      stage: input.stage,
      note: input.note ?? '',
      tone: 'samimi',
      messageType: 'takip',
    })
    return { message }
  } catch {
    return { error: 'Mesaj oluşturulamadı.' }
  }
}
