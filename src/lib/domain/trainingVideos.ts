/**
 * Curated training videos (YouTube nocookie embed).
 * Replace youtubeId values with your own channel content when ready.
 */

export type TrainingVideoDef = {
  key: string
  youtubeId: string
  titleTr: string
  titleEn: string
  descriptionTr: string
  descriptionEn: string
  durationMin: number
  /** Optional link to text training topic id (e.g. z1). */
  relatedTrainingId?: string
  categoryTr: string
  categoryEn: string
}

export const TRAINING_VIDEOS: TrainingVideoDef[] = [
  {
    key: 'vid-mindset',
    youtubeId: 'qp0HIF3SfL4',
    titleTr: 'Neden ile başla (liderlik zihniyeti)',
    titleEn: 'Start with why (leadership mindset)',
    descriptionTr: 'Motivasyon ve ikna için “neden” çerçevesi — zihniyet modülüne destek.',
    descriptionEn: 'The “why” framework for motivation — supports the mindset module.',
    durationMin: 18,
    relatedTrainingId: 'z1',
    categoryTr: 'Zihniyet',
    categoryEn: 'Mindset',
  },
  {
    key: 'vid-stress',
    youtubeId: 'eIho2S0ZahI',
    titleTr: 'Stresi yönetmek',
    titleEn: 'Make stress your ally',
    descriptionTr: 'Saha baskısında sakin kalma — iletişim öncesi hazırlık.',
    descriptionEn: 'Staying calm under field pressure — before outreach.',
    durationMin: 14,
    relatedTrainingId: 'z3',
    categoryTr: 'Zihniyet',
    categoryEn: 'Mindset',
  },
  {
    key: 'vid-motivation',
    youtubeId: 'Ge7c7otDlgQ',
    titleTr: 'Motivasyonun bilimi',
    titleEn: 'The puzzle of motivation',
    descriptionTr: 'Ödül-ceza yerine özerklik, ustalık ve amaç — ekip koçluğu.',
    descriptionEn: 'Autonomy, mastery, purpose — for coaching your team.',
    durationMin: 10,
    categoryTr: 'Ekip',
    categoryEn: 'Team',
  },
  {
    key: 'vid-communication',
    youtubeId: '8jPQjjsBbIc',
    titleTr: 'İnsanların dinlemek istediği şekilde konuş',
    titleEn: 'How to speak so people listen',
    descriptionTr: 'Davet ve sunum öncesi ses tonu, tempo ve netlik.',
    descriptionEn: 'Voice, pace, and clarity before invites and presentations.',
    durationMin: 10,
    relatedTrainingId: 'i1',
    categoryTr: 'İletişim',
    categoryEn: 'Communication',
  },
  {
    key: 'vid-teamwork',
    youtubeId: 'Ryu75TpC018',
    titleTr: 'Takım çalışması',
    titleEn: 'Teamwork foundations',
    descriptionTr: 'Güven ve rol netliği — ekip büyütme pratiği.',
    descriptionEn: 'Trust and role clarity when growing a team.',
    durationMin: 12,
    categoryTr: 'Ekip',
    categoryEn: 'Team',
  },
  {
    key: 'vid-goals',
    youtubeId: 'KpzZZfXkoqk',
    titleTr: 'Hedef koyma ve takip',
    titleEn: 'Setting and tracking goals',
    descriptionTr: '90 günlük saha planı ile uyumlu hedef disiplini.',
    descriptionEn: 'Goal discipline aligned with your 90-day field plan.',
    durationMin: 11,
    relatedTrainingId: 's1',
    categoryTr: 'Strateji',
    categoryEn: 'Strategy',
  },
]

export const CANONICAL_VIDEO_COUNT = TRAINING_VIDEOS.length

export function getTrainingVideoByKey(key: string): TrainingVideoDef | undefined {
  return TRAINING_VIDEOS.find(v => v.key === key)
}

export function localizedVideoTitle(v: TrainingVideoDef, lang: 'tr' | 'en'): string {
  return lang === 'en' ? v.titleEn : v.titleTr
}

export function localizedVideoDescription(v: TrainingVideoDef, lang: 'tr' | 'en'): string {
  return lang === 'en' ? v.descriptionEn : v.descriptionTr
}
