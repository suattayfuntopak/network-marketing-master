'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getClientUserId } from '@/lib/supabase/authUserClient'
import { playNotificationSound } from '@/lib/ui/notificationSound'
import { isNotificationSoundEnabled } from '@/lib/ui/notificationPrefsStorage'
import { isTeamJoinNotification, notificationTargetHref } from '@/lib/domain/notificationRoutes'
import { queryKeys } from '@/lib/query/keys'
import { invalidateHubMetrics } from '@/lib/query/invalidateHubMetrics'
import { getHubDailySelfAction } from '@/app/(dashboard)/crown/hubSelfActions'
import type { NotificationType } from '@/types/database.types'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useRouter } from 'next/navigation'

export interface NotificationItem {
  id: string
  user_id: string
  title_tr: string
  title_en: string
  description_tr: string
  description_en: string
  type: NotificationType
  read: boolean
  created_at: string
  candidate_id: string | null
}

async function fetchNotifications(): Promise<NotificationItem[]> {
  const supabase = createClient()
  const userId = await getClientUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('nmm_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[useNotifications] fetch error:', error)
    return []
  }

  return data ?? []
}

export function useNotifications(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createClient(), [])
  const { lang, t } = useTranslation()
  const router = useRouter()
  const enabled = options?.enabled !== false

  // Realtime kanalını dil/çeviri/router değişiminde YENİDEN kurmamak için bunları
  // ref'te tut. Aksi halde her dil değişiminde websocket kanalı yıkılıp yeniden
  // abone oluyordu (gereksiz bağlantı churn'ü). Callback güncel değerleri ref'ten okur.
  const langRef = useRef(lang)
  const tRef = useRef(t)
  const routerRef = useRef(router)
  // Ref'leri render sonrası güncelle (render sırasında ref yazımı react-hooks/refs
  // ihlali). Realtime callback async tetiklendiği için bir kare gecikme önemsiz.
  useEffect(() => {
    langRef.current = lang
    tRef.current = t
    routerRef.current = router
  })

  const query = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: fetchNotifications,
    staleTime: 30000,
    enabled,
  })

  // Realtime: yalnızca bildirim sorgusu aktifken abone ol
  useEffect(() => {
    if (!enabled) return
    let channel: RealtimeChannel | null = null

    getClientUserId().then((userId) => {
      if (!userId) return

      channel = supabase
        .channel(`nmm_notifications_realtime:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'nmm_notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePostgresInsertPayload<NotificationItem>) => {
            const newNotif = payload.new
            if (!newNotif) return

            // Güncel dil/çeviri/router — ref'ten (effect bunlara bağlı değil).
            const lang = langRef.current
            const t = tRef.current
            const router = routerRef.current

            // 1. Invalidate query to refresh UI lists and badge count instantly
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })

            // Ekip / davet / pipeline bildirimlerinde sponsor hunisini tazele
            if (newNotif.type === 'user' || newNotif.type === 'alert') {
              invalidateHubMetrics(queryClient)
            }

            // 2. Play beautiful synthesized notification chime
            if (isNotificationSoundEnabled()) {
              playNotificationSound()
            }

            // 3. Show stunning interactive toast notification
            const title = lang === 'en' ? newNotif.title_en : newNotif.title_tr
            const description = lang === 'en' ? newNotif.description_en : newNotif.description_tr
            const targetHref = notificationTargetHref({
              type: newNotif.type,
              candidate_id: newNotif.candidate_id,
              title_tr: newNotif.title_tr,
              title_en: newNotif.title_en,
            })
            const actionLabel = newNotif.candidate_id
              ? t('pagesUi.viewInPipeline')
              : isTeamJoinNotification(newNotif)
                ? t('pagesUi.viewDailySummary')
                : t('shellUi.view')

            const showToast = (desc: string) => {
              toast(title, {
                description: desc,
                duration: 6000,
                action: {
                  label: actionLabel,
                  onClick: () => {
                    router.push(targetHref)
                  },
                },
              })
            }

            if (isTeamJoinNotification(newNotif)) {
              void getHubDailySelfAction(0).then((hub) => {
                const a = hub?.dailyActuals
                const kpi =
                  a != null
                    ? t('dashboard.joinNotifKpi', {
                        arama: a.arama,
                        tanisma: a.tanisma,
                        sunum: a.sunum,
                        yeniUye: a.yeniUye,
                      })
                    : null
                showToast(kpi ? `${description}\n${kpi}` : description)
              })
            } else {
              showToast(description)
            }
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [queryClient, supabase, enabled])

  // Mutation: Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const userId = await getClientUserId()
      if (!userId) return

      await supabase
        .from('nmm_notifications')
        .update({ read: true })
        .eq('user_id', userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })

  // Mutation: Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('nmm_notifications')
        .update({ read: true })
        .eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })

  // Mutation: Dismiss/Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('nmm_notifications')
        .delete()
        .eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })

  const unreadCount = (query.data ?? []).filter(n => !n.read).length

  return {
    ...query,
    notifications: query.data ?? [],
    unreadCount,
    markAllRead: markAllReadMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  }
}
