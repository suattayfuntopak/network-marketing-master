'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  deleteNotificationAction,
  fetchNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationItem,
} from '@/app/(dashboard)/actions/notifications'
import { playNotificationSound } from '@/lib/ui/notificationSound'
import { isNotificationSoundEnabled } from '@/lib/ui/notificationPrefsStorage'
import { isTeamJoinNotification, isTrialUpgradeNotification, isModerationApprovalNotification, notificationTargetHref } from '@/lib/domain/notificationRoutes'
import { parseNotificationDescription } from '@/lib/domain/moderationNotificationLink'
import { trialNotificationPhase } from '@/lib/domain/trialLifecycle'
import { logSeePlansClick } from '@/lib/domain/seePlansAnalytics'
import { queryKeys } from '@/lib/query/keys'
import { invalidateHubMetrics } from '@/lib/query/invalidateHubMetrics'
import { getHubDailySelfAction } from '@/app/(dashboard)/crown/hubSelfActions'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useRouter } from 'next/navigation'

export function useNotifications(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createClient(), [])
  const { lang, t } = useTranslation()
  const router = useRouter()
  const enabled = options?.enabled !== false

  const query = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: fetchNotificationsAction,
    staleTime: 30000,
    enabled,
  })

  // Realtime: yalnızca bildirim sorgusu aktifken abone ol
  useEffect(() => {
    if (!enabled) return
    let channel: RealtimeChannel | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      channel = supabase
        .channel(`nmm_notifications_realtime:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'nmm_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresInsertPayload<NotificationItem>) => {
            const newNotif = payload.new
            if (!newNotif) return

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
            const rawDescription = lang === 'en' ? newNotif.description_en : newNotif.description_tr
            const description = parseNotificationDescription(rawDescription).text
            const targetHref = notificationTargetHref({
              type: newNotif.type,
              candidate_id: newNotif.candidate_id,
              title_tr: newNotif.title_tr,
              title_en: newNotif.title_en,
              description_en: newNotif.description_en,
              description_tr: newNotif.description_tr,
            })
            const actionLabel = newNotif.candidate_id
              ? t('pagesUi.viewInPipeline')
              : isTeamJoinNotification(newNotif)
                ? t('pagesUi.viewDailySummary')
                : isTrialUpgradeNotification(newNotif)
                  ? t('shellUi.seePlansCta')
                  : isModerationApprovalNotification(newNotif)
                    ? t('pagesUi.viewApprovedContent')
                    : t('shellUi.view')

            const navigateFromToast = () => {
              if (isTrialUpgradeNotification(newNotif)) {
                logSeePlansClick(
                  trialNotificationPhase(newNotif.title_tr, newNotif.title_en),
                  'notification',
                )
              }
              router.push(targetHref)
            }

            const showToast = (desc: string) => {
              toast(title, {
                description: desc,
                duration: 6000,
                action: {
                  label: actionLabel,
                  onClick: navigateFromToast,
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
  }, [queryClient, supabase, lang, router, t, enabled])

  // Mutation: Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })

  // Mutation: Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationReadAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })

  // Mutation: Dismiss/Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationAction,
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
