export const STAGE_LABELS = {
  new: 'Yeni',
  contacted: 'İletişim Kuruldu',
  interested: 'İlgileniyor',
  presenting: 'Sunum Yapıldı',
  thinking: 'Düşünüyor',
  joined: 'Katıldı',
  lost: 'Kaybedildi',
} as const

export const STAGE_COLORS = {
  new: 'gray',
  contacted: 'blue',
  interested: 'purple',
  presenting: 'amber',
  thinking: 'orange',
  joined: 'emerald',
  lost: 'red',
} as const

export const SOURCE_LABELS = {
  manual: 'Manuel',
  referral: 'Tavsiye',
  social_media: 'Sosyal Medya',
  event: 'Etkinlik',
  cold_outreach: 'Soğuk Temas',
  import: 'İçe Aktarma',
  other: 'Diğer',
} as const

export const CONTACT_TYPE_LABELS = {
  prospect: 'Aday',
  customer: 'Müşteri',
  distributor: 'Distribütör',
  lost: 'Kayıp',
} as const

export const INTERACTION_TYPE_LABELS = {
  note: 'Not',
  call: 'Telefon',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  email: 'Email',
  sms: 'SMS',
  meeting: 'Görüşme',
  presentation: 'Sunum',
  objection: 'İtiraz',
  stage_change: 'Aşama Değişimi',
  warmth_change: 'Sıcaklık Değişimi',
  system: 'Sistem',
} as const

export const TAG_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
}

export function getWarmthKey(score: number): string {
  if (score >= 80) return 'veryHot'
  if (score >= 60) return 'hot'
  if (score >= 40) return 'warm'
  if (score >= 20) return 'cold'
  return 'veryCold'
}

export function getDisplayWarmthScore(score: number, stage?: string | null): number {
  if (stage === 'lost') return 0
  return Math.max(0, Math.min(100, score))
}

export function getWarmthLabel(score: number): string {
  if (score >= 80) return 'Çok Sıcak'
  if (score >= 60) return 'Sıcak'
  if (score >= 40) return 'Ilık'
  if (score >= 20) return 'Soğuk'
  return 'Çok Soğuk'
}

export function getWarmthColor(score: number): string {
  if (score >= 80) return 'red'
  if (score >= 60) return 'orange'
  if (score >= 40) return 'amber'
  if (score >= 20) return 'blue'
  return 'gray'
}

export function getWarmthGradient(score: number): string {
  if (score >= 80) return 'from-red-400 to-red-600'
  if (score >= 60) return 'from-orange-400 to-orange-600'
  if (score >= 40) return 'from-amber-400 to-amber-600'
  if (score >= 20) return 'from-blue-400 to-blue-600'
  return 'from-gray-300 to-gray-400'
}

export const PAGE_SIZE = 20

export const CSV_COLUMN_MAP: Record<string, string> = {
  'ad soyad': 'full_name',
  'isim': 'full_name',
  'name': 'full_name',
  'full name': 'full_name',
  'telefon': 'phone',
  'phone': 'phone',
  'whatsapp': 'whatsapp',
  'telegram': 'telegram',
  'email': 'email',
  'e-posta': 'email',
  'instagram': 'instagram',
  'şehir': 'city',
  'city': 'city',
  'meslek': 'occupation',
  'occupation': 'occupation',
  'notlar': 'notes',
  'notes': 'notes',
  'ilişki': 'relationship',
  'relationship': 'relationship',
  'kaynak': 'source',
  'source': 'source',
}
