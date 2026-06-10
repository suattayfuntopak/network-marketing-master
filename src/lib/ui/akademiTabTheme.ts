import type { AkademiTab } from '@/lib/domain/akademiTab'

/** Vaktin Varsa sekmeleri + Eğitim İlerlemem alt navigasyon — mavi / turuncu / yeşil. */
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
    activeTabClass: 'bg-gradient-to-br from-[#448AFF] to-[#2962FF] text-white shadow-sm',
    addButtonClass: 'bg-[#2962FF] hover:bg-[#1e4ed8] text-white',
    navButtonClass:
      'border-[#2962FF]/35 bg-[#448AFF]/10 text-[#2962FF] hover:bg-[#448AFF]/20 dark:border-[#448AFF]/40 dark:bg-[#448AFF]/15 dark:text-[#93c5fd]',
    textClass: 'text-[#2962FF] dark:text-[#93c5fd]',
    progressBarClass: 'bg-[#2962FF]',
  },
  videos: {
    activeTabClass: 'bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white shadow-sm',
    addButtonClass: 'bg-[#EA580C] hover:bg-[#c2410c] text-white',
    navButtonClass:
      'border-[#EA580C]/35 bg-[#FB923C]/10 text-[#EA580C] hover:bg-[#FB923C]/20 dark:border-[#FB923C]/40 dark:bg-[#FB923C]/15 dark:text-[#fdba74]',
    textClass: 'text-[#EA580C] dark:text-[#fdba74]',
    progressBarClass: 'bg-[#EA580C]',
  },
  objections: {
    activeTabClass: 'bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white shadow-sm',
    addButtonClass: 'bg-[#16A34A] hover:bg-[#15803d] text-white',
    navButtonClass:
      'border-[#16A34A]/35 bg-[#22C55E]/10 text-[#16A34A] hover:bg-[#22C55E]/20 dark:border-[#22C55E]/40 dark:bg-[#22C55E]/15 dark:text-[#86efac]',
    textClass: 'text-[#16A34A] dark:text-[#86efac]',
    progressBarClass: 'bg-[#16A34A]',
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
