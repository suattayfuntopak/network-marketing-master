'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'

export async function generateCoachingMessageAction(input: {
  memberName: string
  activityLevel: 'active' | 'recent' | 'silent'
  daysSinceActivity: number | null
  targetUserId?: string
  customContext?: string
}): Promise<{ message?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik.' }
  }
  if (!input.memberName) return { error: 'Üye adı eksik.' }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message }

  const { activityLevel, daysSinceActivity } = input
  const tone = activityLevel === 'silent' ? 'empatik' : 'motive_edici'
  const messageType = activityLevel === 'silent' ? 'yeniden_bag' : 'yeni_uye_karsilama'
  const baseContext =
    activityLevel === 'active'
      ? 'Bu kişi ekip üyendir (aday değil). Bu hafta aktif sahada çalışıyor — kısa motivasyon ve destek mesajı yaz.'
      : activityLevel === 'recent'
        ? 'Bu kişi ekip üyendir (aday değil). Son günlerde sahada biraz yavaşladı — nazikçe enerji ver, nasıl gidiyor diye sor.'
        : daysSinceActivity === null
          ? 'Bu kişi ekip üyendir (aday değil). Henüz hiç giriş yapmamış — sıcak bir şekilde başlamalarını teşvik et.'
          : `Bu kişi ekip üyendir (aday değil). ${daysSinceActivity} gündür aktif değil — endişeyle değil sevgiyle yeniden bağlantı kur.`

  const context = input.customContext?.trim()
    ? `${baseContext}\n\nLider'in kişisel mesaj stili / şablon notu: ${input.customContext.trim()}`
    : baseContext

  try {
    const message = await generateMessage({
      name: input.memberName,
      stage: 'katildi',
      note: '',
      context,
      tone,
      messageType,
      warmth: 'sicak',
    })

    const preview = message.slice(0, 120).replace(/\n/g, ' ')
    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      noteTr: input.targetUserId ? `coaching:${input.targetUserId}:${preview}` : undefined,
    })

    return { message }
  } catch (err: unknown) {
    return { error: 'Mesaj oluşturulamadı: ' + (err instanceof Error ? err.message : String(err)) }
  }
}
