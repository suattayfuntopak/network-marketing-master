import type { NotificationType } from '@/types/database.types'

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

/** Bildirim toast/modal tıklamasında gidilecek rota. */
export function notificationTargetHref(n: NotificationRouteInput): string {
  if (n.candidate_id) return `/pipeline/${n.candidate_id}`

  if (isTeamJoinNotification(n)) return '/bugunku-takibim'

  const routeByType: Record<NotificationType, string> = {
    user: '/ekip',
    calendar: '/takvim',
    alert: '/ekip',
    bell: '/pano',
    info: '/pano',
  }

  return routeByType[n.type] ?? '/pano'
}
