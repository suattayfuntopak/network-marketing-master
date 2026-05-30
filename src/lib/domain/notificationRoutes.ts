import type { NotificationType } from '@/types/database.types'

type NotificationRouteInput = {
  type: NotificationType
  candidate_id?: string | null
}

/** Bildirim toast/modal tıklamasında gidilecek rota. */
export function notificationTargetHref(n: NotificationRouteInput): string {
  if (n.candidate_id) return `/pipeline/${n.candidate_id}`

  const routeByType: Record<NotificationType, string> = {
    user: '/ekip',
    calendar: '/takvim',
    alert: '/ekip',
    bell: '/pano',
    info: '/pano',
  }

  return routeByType[n.type] ?? '/pano'
}
