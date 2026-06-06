import { formatSimpleNote, parseSimpleNote } from '@/lib/utils/noteParser'

/** Kalıcı moderasyon red şablonu — TR ||| EN (proje i18n kuralı). */
export const DEFAULT_REJECT_REASON_BILINGUAL =
  'İçeriğinizin formatı veya uzunluğu platform rehber kurallarına tam olarak uymadığı için şu aşamada onaylanamamıştır. ||| ' +
  'Your content\'s format or length does not fully meet the platform guidelines, so it cannot be approved at this stage.'

export function resolveLocalizedText(raw: string, lang: 'tr' | 'en'): string {
  const parsed = parseSimpleNote(raw)
  return lang === 'en' ? (parsed.en || parsed.tr) : (parsed.tr || parsed.en)
}

export function defaultRejectReason(lang: 'tr' | 'en'): string {
  return resolveLocalizedText(DEFAULT_REJECT_REASON_BILINGUAL, lang)
}

/** Admin tek dilde yazdıysa bilingual payload üretir. */
export function toBilingualRejectReason(reason: string, adminLang: 'tr' | 'en'): string {
  const trimmed = reason.trim()
  if (!trimmed) return DEFAULT_REJECT_REASON_BILINGUAL
  if (trimmed.includes('|||')) return trimmed

  const base = parseSimpleNote(DEFAULT_REJECT_REASON_BILINGUAL)
  if (adminLang === 'en') {
    return formatSimpleNote(base.tr || trimmed, trimmed)
  }
  return formatSimpleNote(trimmed, base.en || trimmed)
}

export function rejectReasonForEmail(reason: string | undefined, recipientLang: 'tr' | 'en'): string {
  return resolveLocalizedText(reason?.trim() ?? '', recipientLang)
}
