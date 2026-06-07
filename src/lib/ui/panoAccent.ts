import type { ButtonColor } from '@/components/ui/SquareButton'

/** Pano crown kutusu → sayfa içi vurgu renkleri (hub ikon, banner, buton, hover). */
export type PanoPageAccent = {
  icon: string
  banner: string
  bannerIcon: string
  inputFocus: string
  saveBtn: string
  btnHover: string
  /** Metin vurgusu (ilerleme %, linkler) */
  text: string
  textDark: string
  border: string
  surface: string
  surfaceHover: string
  progress: string
}

const purple: PanoPageAccent = {
  icon: 'bg-gradient-to-br from-[#54C1F0] to-[#0095DD] text-white',
  banner:
    'border-[#0095DD]/25 bg-gradient-to-br from-[#54C1F0]/15 to-[#0095DD]/10 hover:from-[#54C1F0]/20 hover:to-[#0095DD]/15 dark:border-[#0095DD]/35 dark:from-[#54C1F0]/10 dark:to-[#0095DD]/10',
  bannerIcon: 'text-[#0095DD] dark:text-[#54C1F0]',
  inputFocus: 'focus:border-[#0095DD] focus:ring-[#54C1F0]/35',
  saveBtn: 'bg-gradient-to-br from-[#54C1F0] to-[#0095DD] hover:brightness-105 active:scale-[0.99]',
  btnHover: 'hover:border-[#0095DD]/30 hover:bg-[#54C1F0]/10',
  text: 'text-[#0095DD]',
  textDark: 'text-[#0095DD] dark:text-[#54C1F0]',
  border: 'border-[#0095DD]/25',
  surface: 'bg-[#54C1F0]/10 dark:bg-[#0095DD]/10',
  surfaceHover: 'hover:bg-[#54C1F0]/15 dark:hover:bg-[#0095DD]/15',
  progress: 'bg-gradient-to-r from-[#54C1F0] to-[#0095DD]',
}

const teal: PanoPageAccent = {
  icon: 'bg-gradient-to-br from-[#90E894] to-[#009688] text-white',
  banner:
    'border-[#009688]/25 bg-gradient-to-br from-[#90E894]/15 to-[#009688]/10 hover:from-[#90E894]/20 hover:to-[#009688]/15 dark:border-[#009688]/35 dark:from-[#90E894]/10 dark:to-[#009688]/10',
  bannerIcon: 'text-[#009688] dark:text-[#90E894]',
  inputFocus: 'focus:border-[#009688] focus:ring-[#90E894]/35',
  saveBtn: 'bg-gradient-to-br from-[#90E894] to-[#009688] hover:brightness-105 active:scale-[0.99]',
  btnHover: 'hover:border-[#009688]/30 hover:bg-[#90E894]/10',
  text: 'text-[#009688]',
  textDark: 'text-[#009688] dark:text-[#90E894]',
  border: 'border-[#009688]/25',
  surface: 'bg-[#90E894]/15 dark:bg-[#009688]/15',
  surfaceHover: 'hover:bg-[#90E894]/25 dark:hover:bg-[#009688]/20',
  progress: 'bg-gradient-to-r from-[#90E894] to-[#009688]',
}

const blue: PanoPageAccent = {
  icon: 'bg-gradient-to-br from-[#448AFF] to-[#2962FF] text-white',
  banner:
    'border-[#2962FF]/25 bg-gradient-to-br from-[#448AFF]/15 to-[#2962FF]/10 hover:from-[#448AFF]/20 hover:to-[#2962FF]/15 dark:border-[#2962FF]/35 dark:from-[#448AFF]/10 dark:to-[#2962FF]/10',
  bannerIcon: 'text-[#2962FF] dark:text-[#448AFF]',
  inputFocus: 'focus:border-[#2962FF] focus:ring-[#448AFF]/35',
  saveBtn: 'bg-gradient-to-br from-[#448AFF] to-[#2962FF] hover:brightness-105 active:scale-[0.99]',
  btnHover: 'hover:border-[#2962FF]/30 hover:bg-[#448AFF]/10',
  text: 'text-[#1A56DB]',
  textDark: 'text-[#1A56DB] dark:text-[#93c5fd]',
  border: 'border-[#2962FF]/25',
  surface: 'bg-[#448AFF]/10 dark:bg-[#2962FF]/15',
  surfaceHover: 'hover:bg-[#448AFF]/15 dark:hover:bg-[#2962FF]/20',
  progress: 'bg-gradient-to-r from-[#448AFF] to-[#2962FF]',
}

const chick: PanoPageAccent = {
  icon: 'bg-gradient-to-br from-[#FFD966] to-[#FF9900] text-white',
  banner:
    'border-[#FF9900]/25 bg-gradient-to-br from-[#FFD966]/20 to-[#FF9900]/10 hover:from-[#FFD966]/25 hover:to-[#FF9900]/15 dark:border-[#FF9900]/35 dark:from-[#FFD966]/10 dark:to-[#FF9900]/10',
  bannerIcon: 'text-[#FF9900] dark:text-[#FFD966]',
  inputFocus: 'focus:border-[#FF9900] focus:ring-[#FFD966]/35',
  saveBtn: 'bg-gradient-to-br from-[#FFD966] to-[#FF9900] hover:brightness-105 active:scale-[0.99]',
  btnHover: 'hover:border-[#FF9900]/30 hover:bg-[#FFD966]/15',
  text: 'text-[#854D0E]',
  textDark: 'text-[#854D0E] dark:text-[#FACC15]',
  border: 'border-[#FF9900]/25',
  surface: 'bg-[#FFD966]/20 dark:bg-[#FF9900]/15',
  surfaceHover: 'hover:bg-[#FFD966]/30 dark:hover:bg-[#FF9900]/20',
  progress: 'bg-gradient-to-r from-[#FFD966] to-[#FF9900]',
}

export const PANO_PAGE_ACCENT: Partial<Record<ButtonColor, PanoPageAccent>> = {
  purple,
  teal,
  blue,
  chick,
}

export function panoAccent(color: ButtonColor): PanoPageAccent {
  return PANO_PAGE_ACCENT[color] ?? purple
}
