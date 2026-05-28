'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { playNotificationSound } from '@/components/ui/NotificationsModal'
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
  type: 'bell' | 'alert' | 'info' | 'user' | 'calendar'
  read: boolean
  created_at: string
}

async function fetchNotifications(): Promise<NotificationItem[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('nmm_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[useNotifications] fetch error:', error)
    return []
  }

  return data ?? []
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createClient(), [])
  const { lang, t } = useTranslation()
  const router = useRouter()

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30000, // 30 seconds
  })

  // Realtime subscriber for in-app written and audio alerts
  useEffect(() => {
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
            queryClient.invalidateQueries({ queryKey: ['notifications'] })

            // 2. Play beautiful synthesized notification chime
            const isSoundEnabled = localStorage.getItem('nmm_notif_sound') !== 'false'
            if (isSoundEnabled) {
              playNotificationSound()
            }

            // 3. Show stunning interactive toast notification
            const title = lang === 'en' ? newNotif.title_en : newNotif.title_tr
            const description = lang === 'en' ? newNotif.description_en : newNotif.description_tr

            // Route notifications to the screen most relevant to their type.
            // Defaults to /pano (dashboard home) for unknown types.
            const routeByType: Record<NotificationItem['type'], string> = {
              user: '/ekip',
              calendar: '/takvim',
              alert: '/odeme',
              bell: '/pano',
              info: '/pano',
            }
            const targetHref = routeByType[newNotif.type] ?? '/pano'

            toast(title, {
              description,
              duration: 6000,
              action: {
                label: t('shellUi.view'),
                onClick: () => {
                  router.push(targetHref)
                },
              },
            })
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [queryClient, supabase, lang, router])

  // Mutation: Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('nmm_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
