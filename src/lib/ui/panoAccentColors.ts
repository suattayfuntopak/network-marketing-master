/** Pano launcher crown gradient köşe renkleri — landing ve pazarlama yüzeyleri için. */
export const PANO_ACCENT = {
  teal: { from: '#90E894', to: '#009688', text: '#009688', bg: 'rgba(0,150,136,0.12)' },
  amber: { from: '#FFD54B', to: '#FF9A00', text: '#FF9A00', bg: 'rgba(255,154,0,0.12)' },
  indigo: { from: '#9D81FF', to: '#5D44C9', text: '#5D44C9', bg: 'rgba(93,68,201,0.12)' },
  purple: { from: '#54C1F0', to: '#0095DD', text: '#0095DD', bg: 'rgba(0,149,221,0.12)' },
} as const

export const PANO_ACCENT_CYCLE = [PANO_ACCENT.teal, PANO_ACCENT.indigo, PANO_ACCENT.amber, PANO_ACCENT.teal] as const
