export interface TrainingTopic {
  id: string
  baslik: string
  baslikEn?: string
  emoji: string
  sure: string
  seviye: string
  ozet: string
  ozetEn?: string
  maddeler: string[]
  maddelerEn?: string[]
  kategoriId: string
  kategoriBaslik: string
  kategoriBaslikEn?: string
  kategoriRenk: string
  isCustom?: boolean
  isDeleted?: boolean
  tags?: string[]
}
