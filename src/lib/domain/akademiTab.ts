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

/** Eğitim ilerlemem → video sekmesi: ilgili videoyu vurgula ve otomatik aç/oynat. */
export function akademiVideoContinueHref(videoKey: string): string {
  const params = new URLSearchParams({
    tab: 'videos',
    highlight: videoKey,
    autoplay: '1',
  })
  return `/egitim?${params.toString()}`
}
