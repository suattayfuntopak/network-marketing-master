'use server'

import { createClient } from '@/lib/supabase/server'
import { generateMessage } from '@/lib/ai/generateMessage'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { parseSimpleNote, formatSimpleNote } from '@/lib/utils/noteParser'
import { todayKey } from '@/lib/domain/dayRitual'

export async function getDayJournalAction(
  journalDate: string = todayKey(),
): Promise<{ content: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data, error } = await supabase
    .from('nmm_day_journal')
    .select('content')
    .eq('user_id', user.id)
    .eq('journal_date', journalDate)
    .maybeSingle()

  if (error) return { error: error.message }
  return { content: data?.content ?? '' }
}

export async function saveDayJournalAction(
  content: string,
  journalDate: string = todayKey(),
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const trimmed = content.trim()
  if (!trimmed) {
    const { error } = await supabase
      .from('nmm_day_journal')
      .delete()
      .eq('user_id', user.id)
      .eq('journal_date', journalDate)
    if (error) return { error: error.message }
    return { ok: true }
  }

  const { error } = await supabase.from('nmm_day_journal').upsert(
    {
      user_id: user.id,
      journal_date: journalDate,
      content: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,journal_date' },
  )

  if (error) return { error: error.message }
  return { ok: true }
}

/** Tek dildeki metni mevcut bilingual kayıtla birleştirir. */
export async function mergeDayJournalLangAction(
  text: string,
  lang: 'tr' | 'en',
  journalDate: string = todayKey(),
): Promise<{ ok: true } | { error: string }> {
  const existing = await getDayJournalAction(journalDate)
  const parsed = 'content' in existing ? parseSimpleNote(existing.content) : { tr: '', en: '' }
  const merged =
    lang === 'en'
      ? formatSimpleNote(parsed.tr, text)
      : formatSimpleNote(text, parsed.en)
  return saveDayJournalAction(merged, journalDate)
}

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

    await mergeDayJournalLangAction(message, lang)

    return { text: message }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
