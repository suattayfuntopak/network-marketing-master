export type AkademiTab = 'training' | 'videos' | 'objections'

export function parseAkademiTab(value: string | null | undefined): AkademiTab {
  if (value === 'videos') return 'videos'
  if (value === 'objections') return 'objections'
  return 'training'
}

export function akademiHref(tab: AkademiTab, id?: string | number | null): string {
  const params = new URLSearchParams()
  if (tab === 'videos') params.set('tab', 'videos')
  else if (tab === 'objections') params.set('tab', 'objections')
  if (id != null && id !== '') params.set('id', String(id))
  const q = params.toString()
  return q ? `/egitim?${q}` : '/egitim'
}
