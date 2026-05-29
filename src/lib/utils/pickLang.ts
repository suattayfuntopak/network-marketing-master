/** Statik çift alan (ör. senaryo titleTr / titleEn). */
export function pickLangField(tr: string, en: string, lang: 'tr' | 'en'): string {
  if (lang === 'en') return en.trim() || tr
  return tr
}

/** Bilingual DB/content fields `{ tr, en }` — UI diline göre seçim. */
export function pickBilingual(
  pair: { tr: string; en?: string | null } | null | undefined,
  lang: 'tr' | 'en'
): string {
  if (!pair) return ''
  if (lang === 'en') return pair.en?.trim() || pair.tr
  return pair.tr
}
