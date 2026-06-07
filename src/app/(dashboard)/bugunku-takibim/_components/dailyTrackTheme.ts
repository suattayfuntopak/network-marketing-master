import { panoAccent } from '@/lib/ui/panoAccent'

/** Pano launcher `teal` — Bugün Ne Yaptım sayfası vurgu renkleri. */
export const dailyTrackAccent = {
  ...panoAccent('teal'),
  bannerText: 'text-[var(--text-1)]',
} as const
