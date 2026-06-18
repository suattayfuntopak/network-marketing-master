'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuthUserId, requireAuthUserIdOrNull } from '@/lib/supabase/requireAuth'
import type { NotificationType } from '@/types/database.types'

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

export async function fetchNotificationsAction(): Promise<NotificationItem[]> {
  const supabase = await createClient()
  const userId = await requireAuthUserIdOrNull()
  if (!userId) return []

  const { data, error } = await supabase
    .from('nmm_notifications')
    // O-6: NotificationItem alanlarını açıkça seç — '*' yerine tip-hizalı ve dar.
    .select('id, user_id, title_tr, title_en, description_tr, description_en, type, read, created_at, candidate_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[notifications] fetch error:', error)
    return []
  }

  return data ?? []
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase
    .from('nmm_notifications')
    .update({ read: true })
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase
    .from('nmm_notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function deleteNotificationAction(id: string): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase
    .from('nmm_notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
