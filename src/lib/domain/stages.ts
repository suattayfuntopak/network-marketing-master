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

/**
 * Pano launcher (SquareButton colorMap) ile hizalı aşama renkleri.
 * STAGE_ORDER’da yan yana aynı aile gelmez; 2 sütunlu huni düzeninde
 * takip|kararsiz ve diğer komşular da farklı tonlarda.
 */
const STAGE_THEME: Record<CandidateStage, { badge: string; card: string }> = {
  yeni: {
    badge: 'bg-[#E8F0FE] text-[#1A56DB] dark:bg-[#0a1f4d] dark:text-[#93c5fd]',
    card: 'bg-[#E8F0FE] text-[#1A56DB] dark:bg-[#0a1f4d]/40 dark:text-[#93c5fd]',
  },
  iletisim: {
    badge: 'bg-brand-subtle text-brand dark:bg-[#2d2a5e] dark:text-[#a09be8]',
    card: 'bg-brand-subtle text-brand dark:bg-[#2d2a5e]/40 dark:text-[#a09be8]',
  },
  davetli: {
    badge: 'bg-[#FEF0EC] text-[#C03E1F] dark:bg-[#3d1409] dark:text-[#fca87d]',
    card: 'bg-[#FEF0EC] text-[#C03E1F] dark:bg-[#3d1409]/40 dark:text-[#fca87d]',
  },
  sunum: {
    badge: 'bg-[#ECFEFF] text-[#0891B2] dark:bg-[#083344] dark:text-[#22D3EE]',
    card: 'bg-[#ECFEFF] text-[#0891B2] dark:bg-[#083344]/40 dark:text-[#22D3EE]',
  },
  takip: {
    badge: 'bg-[#FAEEDA] text-[#854F0B] dark:bg-[#3a2200] dark:text-[#fbbf24]',
    card: 'bg-[#FAEEDA] text-[#854F0B] dark:bg-[#3a2200]/40 dark:text-[#fbbf24]',
  },
  kararsiz: {
    badge: 'bg-crown-subtle text-crown',
    card: 'bg-crown-subtle text-crown',
  },
  katildi: {
    badge: 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e] dark:text-[#4ade80]',
    card: 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e]/40 dark:text-[#4ade80]',
  },
  ilgilenmedi: {
    badge: 'bg-[#EEF2FF] text-[#3730A3] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]',
    card: 'bg-[#EEF2FF] text-[#3730A3] dark:bg-[#1e1b4b]/40 dark:text-[#a5b4fc]',
  },
  pasif: {
    badge: 'bg-[#FEF9C3] text-[#854D0E] dark:bg-[#453A0B] dark:text-[#FACC15]',
    card: 'bg-[#FEF9C3] text-[#854D0E] dark:bg-[#453A0B]/40 dark:text-[#FACC15]',
  },
  kayboldu: {
    badge: 'bg-[#FFF1F3] text-[#9B1D47] dark:bg-[#3d0a1a] dark:text-[#fda4af]',
    card: 'bg-[#FFF1F3] text-[#9B1D47] dark:bg-[#3d0a1a]/40 dark:text-[#fda4af]',
  },
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

const STAGE_LABEL_EN: Record<CandidateStage, string> = {
  yeni:        'New Prospect',
  iletisim:    'Contacted',
  davetli:     'Invited',
  sunum:       'Presentation Done',
  takip:       'Follow-up',
  kararsiz:    'Undecided',
  katildi:     'Joined',
  ilgilenmedi: 'Not Interested',
  kayboldu:    'Lost',
  pasif:       'Passive',
}

export function getStageLabel(stage: CandidateStage, lang: string): string {
  return lang === 'en' ? (STAGE_LABEL_EN[stage] || stage) : (STAGE_LABEL[stage] || stage)
}
