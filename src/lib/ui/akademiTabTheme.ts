import type { AkademiTab } from '@/lib/domain/akademiTab'

/** Vaktin Varsa sekmeleri + Eğitim İlerlemem alt navigasyon. Video sekmesi: video
 *  butonu rengi (light brand / dark pembe-gül). İtiraz: itiraz kartı bordo aksanı. */
export const AKADEMI_TAB_THEME: Record<
  AkademiTab,
  {
    activeTabClass: string
    addButtonClass: string
    navButtonClass: string
    textClass: string
    progressBarClass: string
  }
> = {
  training: {
    activeTabClass: 'bg-theme-training text-white shadow-sm',
    addButtonClass: 'bg-theme-training hover:bg-theme-training-hover text-white',
    navButtonClass:
      'border-[#2962FF]/35 bg-[#448AFF]/10 text-[#2962FF] hover:bg-[#448AFF]/20 dark:border-[#448AFF]/40 dark:bg-[#448AFF]/15 dark:text-[#93c5fd]',
    textClass: 'text-[#2962FF] dark:text-[#93c5fd]',
    progressBarClass: 'bg-[#2962FF]',
  },
  videos: {
    activeTabClass: `bg-gradient-to-br from-pink-600 to-rose-500 text-white shadow-sm shadow-pink-500/15`,
    addButtonClass: 'bg-gradient-to-br from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white',
    navButtonClass:
      'border-rose-500/35 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400',
    textClass: 'text-rose-600 dark:text-rose-400',
    progressBarClass: 'bg-rose-500',
  },
  objections: {
    activeTabClass: 'bg-theme-objections text-theme-objections-text-dark shadow-sm',
    addButtonClass: 'bg-theme-objections hover:bg-theme-objections-hover text-theme-objections-text-dark',
    navButtonClass:
      'border-[#16A34A]/35 bg-[#22C55E]/10 text-[#16A34A] hover:bg-[#22C55E]/20 dark:border-[#fda4af]/40 dark:bg-[#fda4af]/15 dark:text-[#fda4af]',
    textClass: 'text-[#16A34A] dark:text-[#fda4af]',
    progressBarClass: 'bg-[#16A34A] dark:bg-[#fda4af]',
  },
}

export const AKADEMI_TABS: readonly {
  key: AkademiTab
  labelKey: string
  labelKeyMobile: string
}[] = [
  { key: 'training', labelKey: 'akademi.tabContentBank', labelKeyMobile: 'akademi.tabContentBankShort' },
  { key: 'videos', labelKey: 'akademi.tabVideos', labelKeyMobile: 'akademi.tabVideosShort' },
  { key: 'objections', labelKey: 'akademi.tabObjections', labelKeyMobile: 'akademi.tabObjectionsShort' },
]
