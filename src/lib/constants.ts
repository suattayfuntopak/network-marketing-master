export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Network Marketing Master'
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'
export const DB_PREFIX = import.meta.env.VITE_DB_PREFIX ?? 'nmm_'
export const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET ?? 'nmm-avatars'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/giris',
  REGISTER: '/kayit',
  FORGOT_PASSWORD: '/sifremi-unuttum',
  RESET_PASSWORD: '/sifre-yenile',
  EMAIL_CONFIRM: '/email-dogrulama',
  DASHBOARD: '/pano',
  CONTACTS: '/kontaklar',
  PIPELINE: '/pipeline',
  MESSAGES: '/mesajlar',
  CALENDAR: '/takvim',
  ACADEMY: '/akademi',
  TEAM: '/ekip',
  ANALYTICS: '/analiz',
  SETTINGS: '/ayarlar',
} as const

export const NAV_ITEMS = [
  { title: 'Pano', href: ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
  { title: 'Kontaklar', href: ROUTES.CONTACTS, icon: 'Users' },
  { title: 'Pipeline', href: ROUTES.PIPELINE, icon: 'GitMerge' },
  { title: 'Mesajlar', href: ROUTES.MESSAGES, icon: 'MessageSquare' },
  { title: 'Takvim', href: ROUTES.CALENDAR, icon: 'Calendar' },
  { title: 'Akademi', href: ROUTES.ACADEMY, icon: 'GraduationCap' },
  { title: 'Ekip', href: ROUTES.TEAM, icon: 'Users2', roles: ['leader', 'admin'] },
  { title: 'Analiz', href: ROUTES.ANALYTICS, icon: 'BarChart2' },
  { title: 'Ayarlar', href: ROUTES.SETTINGS, icon: 'Settings' },
] as const
