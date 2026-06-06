import { formatSimpleNote } from '@/lib/utils/noteParser'
import { DEFAULT_REJECT_REASON_BILINGUAL } from './moderationDefaults'

export type RejectReasonTranslators = {
  translateTrToEn: (text: string) => Promise<string>
  translateEnToTr: (text: string) => Promise<string>
}

/** Admin tek dilde yazdıysa kalıcı TR|||EN üretir (test edilebilir çekirdek). */
export async function buildBilingualRejectReason(
  reason: string,
  adminLang: 'tr' | 'en',
  translators: RejectReasonTranslators,
): Promise<string> {
  const trimmed = reason.trim()
  if (!trimmed) return DEFAULT_REJECT_REASON_BILINGUAL
  if (trimmed.includes('|||')) return trimmed

  if (adminLang === 'tr') {
    const en = await translators.translateTrToEn(trimmed)
    return formatSimpleNote(trimmed, en)
  }

  const tr = await translators.translateEnToTr(trimmed)
  return formatSimpleNote(tr, trimmed)
}
