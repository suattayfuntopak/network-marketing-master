/** Bilingual DB/content fields `{ tr, en }` — UI diline göre seçim. */
export function pickBilingual(
  pair: { tr: string; en?: string | null } | null | undefined,
  lang: 'tr' | 'en'
): string {
  if (!pair) return ''
  if (lang === 'en') return pair.en?.trim() || pair.tr
  return pair.tr
}
