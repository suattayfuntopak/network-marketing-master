import type { CandidateStage } from '@/types/database.types'

export const STAGE_LABEL: Record<CandidateStage, string> = {
  yeni:        'Yeni Aday',
  iletisim:    'İletişime Geçildi',
  davetli:     'Davet Edildi',
  sunum:       'Sunum Yapıldı',
  takip:       'Takipte',
  kararsiz:    'Kararsız',
  katildi:     'Katıldı',
  ilgilenmedi: 'İlgilenmedi',
  kayboldu:    'Kaybedildi',
  pasif:       'Pasif',
}

// Tek kaynak: badge + kart arka planı birlikte
const STAGE_THEME: Record<CandidateStage, { badge: string; card: string }> = {
  yeni:        { badge: 'bg-[#E8F0FE] text-[#1A56DB] dark:bg-[#1e3a5f] dark:text-[#93c5fd]', card: 'bg-[#E8F0FE] dark:bg-[#222E4D]' },
  iletisim:    { badge: 'bg-[#EEEDFE] text-[#534AB7] dark:bg-[#2d2a5e] dark:text-[#a09be8]', card: 'bg-[#EEEDFE] dark:bg-[#2D2A54]' },
  davetli:     { badge: 'bg-[#FEF0EC] text-[#C03E1F] dark:bg-[#4a1a0a] dark:text-[#fca572]', card: 'bg-[#FEF0EC] dark:bg-[#47221A]' },
  sunum:       { badge: 'bg-[#E0F2FE] text-[#0369A1] dark:bg-[#0a2f3e] dark:text-[#7dd3fc]', card: 'bg-[#E0F2FE] dark:bg-[#1A384F]' },
  takip:       { badge: 'bg-[#FAEEDA] text-[#854F0B] dark:bg-[#3d2200] dark:text-[#fcd34d]', card: 'bg-[#FAEEDA] dark:bg-[#42341A]' },
  kararsiz:    { badge: 'bg-[#FBEAF0] text-[#72243E] dark:bg-[#3d0a1a] dark:text-[#fda4af]', card: 'bg-[#FBEAF0] dark:bg-[#421A2C]' },
  katildi:     { badge: 'bg-[#D1FAE5] text-[#065F46] dark:bg-[#052e16] dark:text-[#6ee7b7]', card: 'bg-[#D1FAE5] dark:bg-[#143B27]' },
  ilgilenmedi: { badge: 'bg-[#F3F4F6] text-[#6B7280] dark:bg-[#1f2937] dark:text-[#9ca3af]', card: 'bg-[#F3F4F6] dark:bg-[#2A2E38]' },
  kayboldu:    { badge: 'bg-[#F3F4F6] text-[#9CA3AF] dark:bg-[#111827] dark:text-[#6b7280]', card: 'bg-[#F3F4F6] dark:bg-[#20242D]' },
  pasif:       { badge: 'bg-[#F0FDF4] text-[#16A34A] dark:bg-[#052e16] dark:text-[#4ade80]', card: 'bg-[#F0FDF4] dark:bg-[#0d2b1a]' },
}

export const STAGE_COLOR: Record<CandidateStage, string> = Object.fromEntries(
  Object.entries(STAGE_THEME).map(([k, v]) => [k, v.badge])
) as Record<CandidateStage, string>

export const FOLLOW_DAYS: Partial<Record<CandidateStage, number>> = {
  yeni: 2, iletisim: 3, davetli: 2, takip: 3, sunum: 1, kararsiz: 7,
}

export const STAGE_ORDER: CandidateStage[] = [
  'yeni', 'iletisim', 'davetli', 'sunum', 'takip',
  'kararsiz', 'katildi', 'ilgilenmedi', 'pasif', 'kayboldu',
]

export const STAGES_FORM: { value: CandidateStage; label: string }[] =
  STAGE_ORDER.map(v => ({ value: v, label: STAGE_LABEL[v] }))

export const ACTIVE_STAGES: CandidateStage[] = [
  'yeni', 'iletisim', 'davetli', 'sunum', 'takip', 'kararsiz',
]

export const HOT_STAGES: CandidateStage[] = ['davetli', 'takip', 'sunum']

export const STAGE_CARD_BG: Record<CandidateStage, string> = Object.fromEntries(
  Object.entries(STAGE_THEME).map(([k, v]) => [k, v.card])
) as Record<CandidateStage, string>
