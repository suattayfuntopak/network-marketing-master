export interface Itiraz {
  id: number
  kategori: { tr: string; en: string }
  soru: { tr: string; en: string }
  cevap?: { tr: string; en: string }
  emoji: string
  kisaCevap?: string
  detayliCevap?: string
  yaklasim?: string
  ornekDiyalog?: string
  tags?: string[]
}

export type CustomItiraz = Itiraz
