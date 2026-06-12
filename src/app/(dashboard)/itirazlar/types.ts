export interface Itiraz {
  id: number
  kategori: { tr: string; en: string }
  soru: { tr: string; en: string }
  cevap?: { tr: string; en: string }
  emoji: string
  kisaCevap?: string
  kisaCevapEn?: string
  detayliCevap?: string
  detayliCevapEn?: string
  yaklasim?: string
  yaklasimEn?: string
  ornekDiyalog?: string
  ornekDiyalogEn?: string
  tags?: string[]
  isCustom?: boolean
  isDeleted?: boolean
}

export type CustomItiraz = Itiraz
