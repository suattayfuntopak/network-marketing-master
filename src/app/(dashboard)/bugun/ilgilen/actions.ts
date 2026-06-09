'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { GEMINI_FLASH } from '@/lib/ai/models'

export async function generateQuickMessageAction(input: {
  name: string
  stage: string
  note?: string | null
}): Promise<{ message?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }
  if (!input.name) return { error: 'Kişi adı eksik.' }

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
      note: 'message',
      aiModel: GEMINI_FLASH,
    })

    return { message }
  } catch (err: unknown) {
    return { error: 'Mesaj oluşturulamadı: ' + ((err instanceof Error ? err.message : String(err))) }
  }
}
