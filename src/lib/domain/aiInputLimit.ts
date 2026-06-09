/** Tek seferde modele giden kullanıcı serbest metni üst sınırı (~1.500 token hedefi). */
export const AI_USER_INPUT_MAX_CHARS = 1500

/** Roleplay geçmişi + not özeti gibi birleşik bağlam üst sınırı. */
export const AI_AGGREGATE_CONTEXT_MAX_CHARS = 6000

export function clampAIUserInput(text: string, max = AI_USER_INPUT_MAX_CHARS): string {
  if (!text) return text
  return text.length <= max ? text : text.slice(0, max)
}

export function aiInputTooLongMessage(lang: 'tr' | 'en' = 'tr', max = AI_USER_INPUT_MAX_CHARS): string {
  return lang === 'en'
    ? `Please keep your text under ${max} characters.`
    : `Metin en fazla ${max} karakter olabilir.`
}

export function rejectIfAIInputTooLong(
  text: string,
  lang: 'tr' | 'en' = 'tr',
  max = AI_USER_INPUT_MAX_CHARS,
): string | null {
  return text.length > max ? aiInputTooLongMessage(lang, max) : null
}

/** Uzun roleplay geçmişinde en son kısmı koru. */
export function trimAggregateContext(text: string, max = AI_AGGREGATE_CONTEXT_MAX_CHARS): string {
  if (text.length <= max) return text
  return `…\n${text.slice(-max)}`
}
