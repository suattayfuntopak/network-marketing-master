export type YazarTab = 'yazar' | 'kocluk' | 'prova' | 'uyum' | 'studyo'

export function parseYazarTab(value: string | null | undefined): YazarTab {
  if (value === 'kocluk' || value === 'prova' || value === 'uyum' || value === 'studyo') return value
  return 'yazar'
}

export function yazarHref(tab: YazarTab): string {
  if (tab === 'yazar') return '/yazar'
  return `/yazar?tab=${tab}`
}
