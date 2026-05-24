import type { CandidateStage } from '@/types/database.types'

export const STAGE_LABEL: Record<CandidateStage, string> = {
  yeni:        'Yeni Aday',
  iletisim:    'İletişime Geçildi',
  davetli:     'Toplantıya Davet Edildi',
  sunum:       'Sunum Yapıldı',
  takip:       'Takipte',
  kararsiz:    'Kararsız',
  katildi:     'Katıldı',
  ilgilenmedi: 'İlgilenmedi',
  kayboldu:    'Kayboldu',
}

export const STAGE_COLOR: Record<CandidateStage, string> = {
  yeni:        'bg-[#E8F0FE] text-[#1A56DB] dark:bg-[#1e3a5f] dark:text-[#93c5fd]',
  iletisim:    'bg-[#EEEDFE] text-[#534AB7] dark:bg-[#2d2a5e] dark:text-[#a09be8]',
  davetli:     'bg-[#FEF0EC] text-[#C03E1F] dark:bg-[#4a1a0a] dark:text-[#fca572]',
  sunum:       'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3a2a] dark:text-[#6ee7b7]',
  takip:       'bg-[#FAEEDA] text-[#854F0B] dark:bg-[#3d2200] dark:text-[#fcd34d]',
  kararsiz:    'bg-[#FBEAF0] text-[#72243E] dark:bg-[#3d0a1a] dark:text-[#fda4af]',
  katildi:     'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3a2a] dark:text-[#6ee7b7]',
  ilgilenmedi: 'bg-[#F3F4F6] text-[#6B7280] dark:bg-[#1f2937] dark:text-[#9ca3af]',
  kayboldu:    'bg-[#F3F4F6] text-[#9CA3AF] dark:bg-[#111827] dark:text-[#6b7280]',
}

export const FOLLOW_DAYS: Partial<Record<CandidateStage, number>> = {
  yeni: 2, iletisim: 3, davetli: 2, takip: 3, sunum: 1, kararsiz: 7,
}

export const STAGE_ORDER: CandidateStage[] = [
  'yeni', 'iletisim', 'davetli', 'sunum', 'takip',
  'kararsiz', 'katildi', 'ilgilenmedi', 'kayboldu',
]

export const STAGES_FORM: { value: CandidateStage; label: string }[] =
  STAGE_ORDER.map(v => ({ value: v, label: STAGE_LABEL[v] }))

export const ACTIVE_STAGES: CandidateStage[] = [
  'yeni', 'iletisim', 'davetli', 'sunum', 'takip', 'kararsiz',
]

export const HOT_STAGES: CandidateStage[] = ['davetli', 'takip', 'sunum']
