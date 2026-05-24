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
  sunum:       'bg-[#E0F2FE] text-[#0369A1] dark:bg-[#0a2f3e] dark:text-[#7dd3fc]',
  takip:       'bg-[#FAEEDA] text-[#854F0B] dark:bg-[#3d2200] dark:text-[#fcd34d]',
  kararsiz:    'bg-[#FBEAF0] text-[#72243E] dark:bg-[#3d0a1a] dark:text-[#fda4af]',
  katildi:     'bg-[#D1FAE5] text-[#065F46] dark:bg-[#052e16] dark:text-[#6ee7b7]',
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

// Kart arka plan renkleri — çok hafif pastel, light + dark mode
export const STAGE_CARD_BG: Record<CandidateStage, string> = {
  yeni:        'bg-[#f0f4ff] dark:bg-[#1b2240]',
  iletisim:    'bg-[#f3f2fe] dark:bg-[#1f1d44]',
  davetli:     'bg-[#fff4f0] dark:bg-[#311510]',
  sunum:       'bg-[#f0f9ff] dark:bg-[#081e2e]',
  takip:       'bg-[#fffbf0] dark:bg-[#2a1e00]',
  kararsiz:    'bg-[#fff0f5] dark:bg-[#2e0f1c]',
  katildi:     'bg-[#f0fdf4] dark:bg-[#041f0f]',
  ilgilenmedi: 'bg-[#f5f6f8] dark:bg-[#191c22]',
  kayboldu:    'bg-[#f3f4f6] dark:bg-[#141618]',
}
