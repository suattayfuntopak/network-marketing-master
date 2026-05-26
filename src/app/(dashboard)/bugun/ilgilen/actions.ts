'use server'

import { generateMessage } from '@/lib/ai/generateMessage'

export async function generateQuickMessageAction(input: {
  name: string
  stage: string
  note?: string | null
}): Promise<{ message?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }
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
  } catch (err: any) {
    return { error: 'Mesaj oluşturulamadı: ' + (err?.message || String(err)) }
  }
}
