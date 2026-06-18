import type { NotificationType } from '@/types/database.types'
import { ODEME_PLANS_PATH } from '@/lib/domain/paymentRoutes'

type NotificationRouteInput = {
  type: NotificationType
  candidate_id?: string | null
  title_tr?: string | null
  title_en?: string | null
}

/** Davet kabulü / yeni ortak bildirimi → günlük huni özeti. */
export function isTeamJoinNotification(n: Pick<NotificationRouteInput, 'title_tr' | 'title_en'>): boolean {
  const tr = (n.title_tr ?? '').toLowerCase()
  const en = (n.title_en ?? '').toLowerCase()
  return tr.includes('yeni ortak katıldı') || en.includes('new partner joined')
}

/** Deneme sonu / plan yükseltme bildirimi → plan karşılaştırma sayfası. */
export function isTrialUpgradeNotification(n: Pick<NotificationRouteInput, 'title_tr' | 'title_en'>): boolean {
  const tr = (n.title_tr ?? '').toLowerCase()
  const en = (n.title_en ?? '').toLowerCase()
  return (
    tr.includes('denemen yarın') ||
    tr.includes('denemene 3 gün') ||
    tr.includes('deneme bitti') ||
    en.includes('trial ends tomorrow') ||
    en.includes('trial ended') ||
    en.includes('days left on your trial')
  )
}

/** Bildirim toast/modal tıklamasında gidilecek rota. */
export function notificationTargetHref(n: NotificationRouteInput): string {
  if (n.candidate_id) return `/pipeline/${n.candidate_id}`

  if (isTeamJoinNotification(n)) return '/saha-ozetim?tab=daily'

  if (isTrialUpgradeNotification(n)) return ODEME_PLANS_PATH

  const routeByType: Record<NotificationType, string> = {
    user: '/ekip',
    calendar: '/takvim',
    alert: '/ekip',
    bell: '/pano',
    info: '/pano',
    overdue_followup: '/takvim',
  }

  return routeByType[n.type] ?? '/pano'
}
