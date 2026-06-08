import type { NotificationPreferences } from '@/app/(dashboard)/actions/notificationPreferences'

export const NOTIF_PREFS_STORAGE_KEYS = {
  email: 'nmm_notif_email',
  push: 'nmm_notif_push',
  sound: 'nmm_notif_sound',
  overdueEmailFrequency: 'nmm_notif_overdue_freq',
} as const

const DEFAULT_PREFS: NotificationPreferences = {
  email: true,
  push: true,
  sound: true,
  overdueEmailFrequency: 'daily',
}

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  return raw === 'true'
}

/** Client-side cache — realtime ses/push kontrolleri bunu okur. */
export function readNotificationPrefsFromStorage(): NotificationPreferences {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(NOTIF_PREFS_STORAGE_KEYS.overdueEmailFrequency) : null
  const overdueEmailFrequency: 'daily' | 'weekly' = raw === 'weekly' ? 'weekly' : 'daily'
  return {
    email: readBool(NOTIF_PREFS_STORAGE_KEYS.email, DEFAULT_PREFS.email),
    push: readBool(NOTIF_PREFS_STORAGE_KEYS.push, DEFAULT_PREFS.push),
    sound: readBool(NOTIF_PREFS_STORAGE_KEYS.sound, DEFAULT_PREFS.sound),
    overdueEmailFrequency,
  }
}

export function writeNotificationPrefsToStorage(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIF_PREFS_STORAGE_KEYS.email, String(prefs.email))
  localStorage.setItem(NOTIF_PREFS_STORAGE_KEYS.push, String(prefs.push))
  localStorage.setItem(NOTIF_PREFS_STORAGE_KEYS.sound, String(prefs.sound))
  localStorage.setItem(NOTIF_PREFS_STORAGE_KEYS.overdueEmailFrequency, prefs.overdueEmailFrequency)
}

export function isNotificationSoundEnabled(): boolean {
  return readNotificationPrefsFromStorage().sound
}

export function isNotificationPushEnabled(): boolean {
  return readNotificationPrefsFromStorage().push
}
