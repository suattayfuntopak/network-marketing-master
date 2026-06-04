export type YazarTab = 'yazar' | 'kocluk' | 'prova' | 'uyum'

export function parseYazarTab(value: string | null | undefined): YazarTab {
  if (value === 'kocluk' || value === 'prova' || value === 'uyum') return value
  return 'yazar'
}

export function yazarHref(tab: YazarTab): string {
  if (tab === 'yazar') return '/yazar'
  return `/yazar?tab=${tab}`
}
