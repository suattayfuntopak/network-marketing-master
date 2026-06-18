'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { generateLocalFallbackMessage } from '@/lib/domain/aiFallback'

export async function generateQuickMessageAction(input: {
  name: string
  stage: string
  note?: string | null
}): Promise<{ message?: string; error?: string }> {
  if (!input.name) return { error: 'Kişi adı eksik.' }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY eksik, yerel taslak oluşturuluyor.')
    const fallbackMessage = generateLocalFallbackMessage({
      name: input.name,
      stage: input.stage,
      context: input.note ?? '',
      tone: 'samimi',
    })
    return { message: fallbackMessage }
  }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message }

  try {
    const message = await generateMessage({
      name: input.name,
      stage: input.stage,
      note: input.note ?? '',
      tone: 'samimi',
      messageType: 'takip',
    })

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      dailyLimit: quota.isSuperAdmin ? null : quota.limit,
      note: 'message',
      aiModel: GEMINI_FLASH,
    })

    return { message }
  } catch (err: unknown) {
    console.error('Gemini API hatası, yerel taslağa geçiliyor:', err)
    const fallbackMessage = generateLocalFallbackMessage({
      name: input.name,
      stage: input.stage,
      context: input.note ?? '',
      tone: 'samimi',
    })
    return { message: fallbackMessage }
  }
}
