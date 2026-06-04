'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'

/** Gün sonu saha notunu kısa, net bir cümleye çevirir (günlük mesaj kotası). */
export async function polishDayJournalAction(
  raw: string,
  lang: 'tr' | 'en' = 'tr',
): Promise<{ text?: string; error?: string }> {
  const trimmed = raw.trim()
  if (!trimmed) return { error: 'empty' }
  if (!process.env.GEMINI_API_KEY) {
    return { error: lang === 'en' ? 'GEMINI_API_KEY is missing.' : 'GEMINI_API_KEY eksik.' }
  }

  const quota = await checkAIQuota('message', { lang })
  if (!quota.ok) return { error: quota.message }

  const task =
    lang === 'en'
      ? 'Turn this into one warm, clear English journal paragraph. Output only the summary, no preamble.'
      : 'Bunu tek paragraf, samimi ve net bir Türkçe günlük özet cümlesine dönüştür. Sadece özeti yaz, başka açıklama ekleme.'

  try {
    const message = await generateMessage({
      name: 'Lider',
      stage: 'takip',
      note: `${lang === 'en' ? "Today's field notes (raw)" : 'Bugünkü saha notlarım (ham)'}:\n${trimmed}\n\n${task}`,
      tone: 'samimi',
      messageType: 'takip',
    })

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
    })

    return { text: message }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
