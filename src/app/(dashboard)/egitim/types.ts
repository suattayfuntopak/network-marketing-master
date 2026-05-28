export interface TrainingTopic {
  id: string
  baslik: string
  emoji: string
  sure: string
  seviye: string
  ozet: string
  maddeler: string[]
  kategoriId: string
  kategoriBaslik: string
  kategoriRenk: string
  isCustom?: boolean
  tags?: string[]
}
