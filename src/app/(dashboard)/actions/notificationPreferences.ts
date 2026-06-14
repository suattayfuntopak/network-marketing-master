'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'

export type NotificationPreferences = {
  email: boolean
  push: boolean
  sound: boolean
  overdueEmailFrequency: 'daily' | 'weekly'
}

/** Sunucuda satır yoksa `null` — istemci localStorage ile devam eder. */
export async function getNotificationPreferencesAction(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('nmm_notification_preferences')
    .select('email_enabled, push_enabled, sound_enabled, overdue_email_frequency')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    email: data.email_enabled,
    push: data.push_enabled,
    sound: data.sound_enabled,
    overdueEmailFrequency: (data.overdue_email_frequency as 'daily' | 'weekly') ?? 'daily',
  }
}

export async function updateNotificationPreferencesAction(
  prefs: NotificationPreferences,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  const { error } = await supabase
    .from('nmm_notification_preferences')
    .upsert({
      user_id: user.id,
      email_enabled: prefs.email,
      push_enabled: prefs.push,
      sound_enabled: prefs.sound,
      overdue_email_frequency: prefs.overdueEmailFrequency,
      updated_at: new Date().toISOString(),
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
