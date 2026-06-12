import type { AkademiTab } from '@/lib/domain/akademiTab'
import { PRO_CTA_GRADIENT_ACTIVE_DARK_SM } from '@/lib/ui/brandGradients'

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
    activeTabClass: 'bg-[#3730A3] dark:bg-gradient-to-br dark:from-[#448AFF] dark:to-[#2962FF] text-white shadow-sm',
    addButtonClass: 'bg-[#3730A3] hover:bg-[#28227d] dark:bg-[#2962FF] dark:hover:bg-[#1e4ed8] text-white',
    navButtonClass:
      'border-[#2962FF]/35 bg-[#448AFF]/10 text-[#2962FF] hover:bg-[#448AFF]/20 dark:border-[#448AFF]/40 dark:bg-[#448AFF]/15 dark:text-[#93c5fd]',
    textClass: 'text-[#2962FF] dark:text-[#93c5fd]',
    progressBarClass: 'bg-[#2962FF]',
  },
  videos: {
    activeTabClass: `bg-[#16A34A] dark:bg-brand text-white shadow-sm ${PRO_CTA_GRADIENT_ACTIVE_DARK_SM}`,
    addButtonClass: 'bg-[#EA580C] hover:bg-[#c2410c] dark:bg-none dark:bg-gradient-to-r dark:from-pink-600 dark:to-rose-500 dark:hover:from-pink-700 dark:hover:to-rose-600 text-white',
    navButtonClass:
      'border-[#16A34A]/35 bg-[#22C55E]/10 text-[#16A34A] hover:bg-[#22C55E]/20 dark:border-[#FB923C]/40 dark:bg-[#FB923C]/15 dark:text-[#fdba74]',
    textClass: 'text-[#16A34A] dark:text-[#fdba74]',
    progressBarClass: 'bg-[#16A34A] dark:bg-[#EA580C]',
  },
  objections: {
    activeTabClass: 'bg-gradient-to-br from-[#B91C5C] to-[#9B1D47] text-white dark:bg-none dark:bg-[#fda4af] dark:text-[#3d0a1a] shadow-sm',
    addButtonClass: 'bg-gradient-to-br from-[#B91C5C] to-[#9B1D47] hover:opacity-95 dark:bg-none dark:bg-[#fda4af] dark:hover:bg-[#fbacbe] dark:text-[#3d0a1a] text-white',
    navButtonClass:
      'border-[#B91C5C]/35 bg-[#B91C5C]/10 text-[#B91C5C] hover:bg-[#B91C5C]/20 dark:border-[#fda4af]/40 dark:bg-[#fda4af]/15 dark:text-[#fda4af]',
    textClass: 'text-[#9B1D47] dark:text-[#fda4af]',
    progressBarClass: 'bg-[#9B1D47] dark:bg-[#fda4af]',
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
