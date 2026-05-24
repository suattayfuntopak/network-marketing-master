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
  yeni:        'bg-[#E8F0FE] text-[#1A56DB]',
  iletisim:    'bg-[#EEEDFE] text-[#534AB7]',
  davetli:     'bg-[#FEF0EC] text-[#C03E1F]',
  sunum:       'bg-[#E1F5EE] text-[#0F6E56]',
  takip:       'bg-[#FAEEDA] text-[#854F0B]',
  kararsiz:    'bg-[#FBEAF0] text-[#72243E]',
  katildi:     'bg-[#E1F5EE] text-[#0F6E56]',
  ilgilenmedi: 'bg-[#F3F4F6] text-[#6B7280]',
  kayboldu:    'bg-[#F3F4F6] text-[#9CA3AF]',
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
