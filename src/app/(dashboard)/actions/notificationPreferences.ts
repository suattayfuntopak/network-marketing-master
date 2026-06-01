'use server'

import { createClient } from '@/lib/supabase/server'

export type NotificationPreferences = {
  email: boolean
  push: boolean
  sound: boolean
}

const DEFAULTS: NotificationPreferences = {
  email: true,
  push: true,
  sound: true,
}

/** Sunucuda satır yoksa `null` — istemci localStorage ile devam eder. */
export async function getNotificationPreferencesAction(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('nmm_notification_preferences')
    .select('email_enabled, push_enabled, sound_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    email: data.email_enabled,
    push: data.push_enabled,
    sound: data.sound_enabled,
  }
}

export async function updateNotificationPreferencesAction(
  prefs: NotificationPreferences,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  const { error } = await supabase
    .from('nmm_notification_preferences')
    .upsert({
      user_id: user.id,
      email_enabled: prefs.email,
      push_enabled: prefs.push,
      sound_enabled: prefs.sound,
      updated_at: new Date().toISOString(),
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
