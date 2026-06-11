'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Bell, Mail, Monitor, Volume2, CheckCircle2, AlertCircle, Info, UserPlus, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { playNotificationSound } from '@/lib/ui/notificationSound'
import { useTranslation } from '@/providers/LanguageProvider'
import { useNotifications } from '@/hooks/useNotifications'
import { isTeamJoinNotification, notificationTargetHref } from '@/lib/domain/notificationRoutes'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { useWorkspace } from '@/hooks/useWorkspace'
import type { NotificationType } from '@/types/database.types'

interface NotificationsModalProps {
  onClose: () => void
}

/** Bildirim ikon türü — oku/sil durumu Supabase'de (nmm_notifications), localStorage yok. */
type NotifIconType = 'bell' | 'alert' | 'info' | 'user' | 'calendar'

/** UI katmanında render için dönüştürülmüş bildirim nesnesi */
interface UiNotification {
  id: string
  title: string
  title_tr: string
  title_en: string
  description: string
  time: string
  read: boolean
  icon: NotifIconType
  type: NotificationType
  candidate_id: string | null
  isDb: boolean
}

function NotifIcon({ type, size = 'sm' }: { type: NotifIconType; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  if (type === 'alert')    return <AlertCircle    className={`${cls} text-amber-500`} />
  if (type === 'user')     return <UserPlus       className={`${cls} text-brand`} />
  if (type === 'calendar') return <CalendarClock  className={`${cls} text-[#0F6E56]`} />
  if (type === 'info')     return <Info           className={`${cls} text-brand`} />
  return <Bell className={`${cls} text-brand`} />
}

function NotifIconBg({ type }: { type: NotifIconType }) {
  if (type === 'calendar') return 'bg-[#E1F5EE]'
  if (type === 'alert')    return 'bg-amber-50 dark:bg-amber-950/20'
  return 'bg-brand-subtle'
}

function PreferenceToggle({
  checked,
  disabled,
  onToggle,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? 'bg-brand' : 'bg-[var(--border)]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out will-change-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function formatTimeAgo(
  dateString: string,
  t: (keyPath: string, variables?: Record<string, string | number>) => string,
): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return t('shellUi.justNow')
  } else if (minutes < 60) {
    return t('shellUi.minutesAgo', { count: minutes })
  } else if (hours < 24) {
    return t('shellUi.hoursAgo', { count: hours })
  } else {
    return t('shellUi.daysAgo', { count: days })
  }
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { lang, t } = useTranslation()
  const router = useRouter()
  const [mounted] = useState(() => typeof window !== 'undefined')
  const { data: ws } = useWorkspace()
  const userEmail = ws?.email ?? ''
  const [selected, setSelected]         = useState<UiNotification | null>(null)

  useBodyScrollLock()

  const { prefs, isLoading: prefsLoading, isSaving: prefsSaving, savePrefs } =
    useNotificationPreferences()

  const {
    notifications: dbNotifications,
    unreadCount: dbUnreadCount,
    markAllRead: dbMarkAllRead,
    markAsRead: dbMarkAsRead,
  } = useNotifications()

  // Bildirimler tamamen Supabase'den (oku/sil durumu DB'de) — localStorage yok.
  const notifications: UiNotification[] = dbNotifications.map(n => ({
    id: n.id,
    title: lang === 'en' ? n.title_en : n.title_tr,
    title_tr: n.title_tr,
    title_en: n.title_en,
    description: lang === 'en' ? n.description_en : n.description_tr,
    time: formatTimeAgo(n.created_at, t),
    read: n.read,
    icon: n.type as NotifIconType,
    type: n.type,
    candidate_id: n.candidate_id,
    isDb: true,
  }))

  const unreadCount = dbUnreadCount

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (selected) setSelected(null)
      else onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  async function handleFrequencyChange(freq: 'daily' | 'weekly') {
    if (prefsSaving || prefsLoading) return
    try {
      await savePrefs({ ...prefs, overdueEmailFrequency: freq })
      toast.success(t('common.notificationSuccess'))
    } catch (err) {
      console.error('[NotificationsModal] frequency save failed:', err)
      toast.error(t('common.error'))
    }
  }

  async function handleToggle(type: 'email' | 'push' | 'sound') {
    if (prefsSaving || prefsLoading) return

    const key = type === 'email' ? 'email' : type === 'push' ? 'push' : 'sound'
    const next = !prefs[key]
    const nextPrefs = { ...prefs, [key]: next }

    try {
      await savePrefs(nextPrefs)

      if (type === 'email' && next) {
        toast.info(t('shellUi.emailAlertsEnabled', { email: userEmail }))
      }
      if (type === 'push' && next && 'Notification' in window) {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') {
          toast.success(t('shellUi.browserNotifEnabled'))
          new Notification('Network Marketing Master', {
            body: t('shellUi.systemNotifEnabled'),
            icon: '/logo.png',
          })
        } else {
          toast.warning(t('shellUi.permissionDenied'))
        }
      }
      if (type === 'sound' && next) {
        playNotificationSound()
      }

      toast.success(t('common.notificationSuccess'))
    } catch (err) {
      console.error('[NotificationsModal] preference save failed:', err)
      toast.error(t('common.error'))
    }
  }

  function openNotification(n: UiNotification) {
    setSelected(n)
    dbMarkAsRead(n.id)
    if (prefs.sound) {
      playNotificationSound()
    }
  }

  function markAllRead() {
    dbMarkAllRead()
    toast.success(t('shellUi.allMarkedRead'))
  }

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 ${Z.sheet} flex items-center justify-center p-4`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Ana Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] transition-all"
           style={{ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}>

        {/* Başlık */}
        <div className={`sticky top-0 ${Z.cardControls} flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-5 py-4`}>
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-[var(--text-2)]" />
            <h2 className="text-base font-bold text-[var(--text-1)]">Bildirimler</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 items-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Bildirim Listesi */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Son Bildirimler</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-semibold text-brand transition hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tümünü Okundu Yap
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-10">
                <Bell className="h-8 w-8 text-[var(--text-3)]" />
                <p className="text-xs font-semibold text-[var(--text-3)]">Okunmamış bildiriminiz yok</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {notifications.slice(0, 5).map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotification(n)}
                      className={`group w-full rounded-xl border p-3.5 text-left transition-all hover:shadow-sm active:scale-[0.99]
                        ${n.read
                          ? 'border-[var(--border)] bg-[var(--bg-card)] opacity-70 hover:opacity-100'
                          : 'border-brand/20 bg-[#f0f4ff]/60 dark:bg-brand/8 hover:border-brand/40'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* İkon */}
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${NotifIconBg({ type: n.icon })}`}>
                          <NotifIcon type={n.icon} />
                        </div>

                        {/* İçerik */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {!n.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                            )}
                            <p className={`truncate text-sm font-semibold ${n.read ? 'text-[var(--text-2)]' : 'text-[var(--text-1)]'}`}>
                              {n.title}
                            </p>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-3)]">{n.description}</p>
                          <p className="mt-1 text-[10px] text-[var(--text-3)]">{n.time}</p>
                        </div>

                        {/* Okundu indicator */}
                        {n.read && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
                {notifications.length > 5 && (
                  <li className="pt-1 text-center text-[10px] font-semibold text-[var(--text-3)]">
                    Son 5 bildirim gösteriliyor
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Ayırıcı */}
          <div className="border-t border-[var(--border)]" />

          {/* Tercihler */}
          <div className="space-y-3 rounded-2xl bg-[var(--bg-subtle)] p-4 border border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Tercihler</p>
            {[
              { type: 'email' as const, icon: Mail,    label: t('shellUi.prefEmailLabel'), val: prefs.email },
              { type: 'push'  as const, icon: Monitor, label: t('shellUi.prefPushLabel'),  val: prefs.push  },
              { type: 'sound' as const, icon: Volume2, label: t('shellUi.prefSoundLabel'), val: prefs.sound },
            ].map(({ type, icon: Icon, label, val }) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-brand" />
                  <span className="text-sm font-medium text-[var(--text-1)]">{label}</span>
                </div>
                <PreferenceToggle
                  label={label}
                  checked={val}
                  disabled={prefsLoading || prefsSaving}
                  onToggle={() => void handleToggle(type)}
                />
              </div>
            ))}
            {prefs.email && (
              <div className="flex items-center justify-between pl-7">
                <span className="text-xs font-medium text-[var(--text-2)]">{t('shellUi.overdueFreqLabel')}</span>
                <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden text-xs font-semibold">
                  {(['daily', 'weekly'] as const).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      disabled={prefsLoading || prefsSaving}
                      onClick={() => void handleFrequencyChange(freq)}
                      className={`px-3 py-1.5 transition-colors disabled:opacity-50 ${
                        prefs.overdueEmailFrequency === freq
                          ? 'bg-brand text-white'
                          : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      {freq === 'daily' ? t('shellUi.overdueFreqDaily') : t('shellUi.overdueFreqWeekly')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bildirim Detay Popup */}
      {selected && (
        <>
          <div
            className={`fixed inset-0 ${Z.confirmBackdrop} bg-black/60 backdrop-blur-sm`}
            onClick={() => setSelected(null)}
          />
          <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center p-4`}>
            <div
              className="w-full max-w-[27rem] rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
            {/* Renkli Üst Şerit */}
            <div className={`h-1.5 w-full ${
              selected.icon === 'calendar' ? 'bg-gradient-to-r from-[#0F6E56] to-emerald-400' :
              selected.icon === 'alert'    ? 'bg-gradient-to-r from-amber-400 to-yellow-300' :
              'bg-gradient-to-r from-brand to-indigo-400'
            }`} />

            <div className="p-6">
              {/* İkon + Başlık */}
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${NotifIconBg({ type: selected.icon })}`}>
                  <NotifIcon type={selected.icon} size="lg" />
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--text-1)]">{selected.title}</p>
                  <p className="text-xs text-[var(--text-3)]">{selected.time}</p>
                </div>
              </div>

              {/* Açıklama */}
              <p className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-sm leading-relaxed text-[var(--text-2)]">
                {selected.description}
              </p>

              {/* Okundu rozeti + aksiyon */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#0F6E56]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Okundu olarak işaretlendi
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {selected.candidate_id ? (
                    <button
                      type="button"
                      onClick={() => {
                        router.push(notificationTargetHref({
                          type: selected.type,
                          candidate_id: selected.candidate_id,
                          title_tr: selected.title_tr,
                          title_en: selected.title_en,
                        }))
                        setSelected(null)
                        onClose()
                      }}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-brand/25 bg-brand/[0.07] px-3 py-1.5 text-xs font-semibold leading-tight text-brand transition-colors hover:border-brand/40 hover:bg-brand/12 active:scale-[0.98] dark:border-brand/35 dark:bg-brand/15 dark:hover:bg-brand/22"
                    >
                      {t('pagesUi.viewInPipeline')}
                    </button>
                  ) : isTeamJoinNotification(selected) ? (
                    <button
                      type="button"
                      onClick={() => {
                        router.push(notificationTargetHref({
                          type: selected.type,
                          candidate_id: selected.candidate_id,
                          title_tr: selected.title_tr,
                          title_en: selected.title_en,
                        }))
                        setSelected(null)
                        onClose()
                      }}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-brand/25 bg-brand/[0.07] px-3 py-1.5 text-xs font-semibold leading-tight text-brand transition-colors hover:border-brand/40 hover:bg-brand/12 active:scale-[0.98] dark:border-brand/35 dark:bg-brand/15 dark:hover:bg-brand/22"
                    >
                      {t('pagesUi.viewDailySummary')}
                    </button>
                  ) : null}
                  <button
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold leading-tight text-white transition-colors hover:bg-[#453da0] active:scale-[0.98]"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
