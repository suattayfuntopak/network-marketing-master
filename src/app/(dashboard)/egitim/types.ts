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
  /** İçerik biçimi: madde-madde "konu" (varsayılan) ya da uzun-form "makale". */
  format?: 'topic' | 'article'
  /** Uzun-form makale gövdesi (TR). Sade biçim: boş satır=paragraf, `## `=ara başlık, `- `=madde, `> `=alıntı. */
  govde?: string
  /** Uzun-form makale gövdesi (kalıcı EN çevirisi). */
  govdeEn?: string
  kategoriId: string
  kategoriBaslik: string
  kategoriBaslikEn?: string
  kategoriRenk: string
  isCustom?: boolean
  isDeleted?: boolean
  tags?: string[]
}
