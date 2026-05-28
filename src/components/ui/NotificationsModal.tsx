'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Bell, Mail, Monitor, Volume2, CheckCircle2, AlertCircle, Info, UserPlus, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import { useNotifications } from '@/hooks/useNotifications'
import { createClient } from '@/lib/supabase/client'

interface NotificationsModalProps {
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  icon: 'bell' | 'alert' | 'info' | 'user' | 'calendar'
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = []

const NOTIF_DISMISSED_KEY = 'nmm_notif_dismissed_ids'
const NOTIF_READ_KEY = 'nmm_notif_read_ids'

export function loadNotifications(): NotificationItem[] {
  try {
    const dismissed = new Set<string>(JSON.parse(localStorage.getItem(NOTIF_DISMISSED_KEY) ?? '[]'))
    const read = new Set<string>(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) ?? '[]'))
    return DEFAULT_NOTIFICATIONS
      .filter(n => !dismissed.has(n.id))
      .map(n => ({ ...n, read: read.has(n.id) || n.read }))
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

function persistRead(notifications: NotificationItem[]) {
  const readIds = notifications.filter(n => n.read).map(n => n.id)
  localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(readIds))
}

function persistDismissed(ids: string[]) {
  try {
    const existing = new Set<string>(JSON.parse(localStorage.getItem(NOTIF_DISMISSED_KEY) ?? '[]'))
    ids.forEach(id => existing.add(id))
    localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify([...existing]))
  } catch {}
}

function NotifIcon({ type, size = 'sm' }: { type: NotificationItem['icon']; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  if (type === 'alert')    return <AlertCircle    className={`${cls} text-amber-500`} />
  if (type === 'user')     return <UserPlus       className={`${cls} text-[#534AB7]`} />
  if (type === 'calendar') return <CalendarClock  className={`${cls} text-[#0F6E56]`} />
  if (type === 'info')     return <Info           className={`${cls} text-[#534AB7]`} />
  return <Bell className={`${cls} text-[#534AB7]`} />
}

function NotifIconBg({ type }: { type: NotificationItem['icon'] }) {
  if (type === 'calendar') return 'bg-[#E1F5EE]'
  if (type === 'alert')    return 'bg-amber-50 dark:bg-amber-950/20'
  return 'bg-[#EEEDFE]'
}

export function playNotificationSound() {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    // Note 1 (C5)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
    
    // Note 2 (E5) delayed
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    gain2.gain.setValueAtTime(0, ctx.currentTime)
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1)
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc2.start(ctx.currentTime + 0.1)
    osc2.stop(ctx.currentTime + 0.4)
  } catch (err) {
    console.error('Audio synthesis failed:', err)
  }
}

function formatTimeAgo(dateString: string, lang: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return lang === 'en' ? 'just now' : 'az önce'
  } else if (minutes < 60) {
    return lang === 'en' ? `${minutes}m ago` : `${minutes} dk önce`
  } else if (hours < 24) {
    return lang === 'en' ? `${hours}h ago` : `${hours} saat önce`
  } else {
    return lang === 'en' ? `${days}d ago` : `${days} gün önce`
  }
}

export function NotificationsModal({ onClose, onUnreadCountChange }: NotificationsModalProps) {
  const { lang } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [emailAlerts, setEmailAlerts]   = useState(true)
  const [pushAlerts, setPushAlerts]     = useState(true)
  const [soundAlerts, setSoundAlerts]   = useState(true)
  const [userEmail, setUserEmail]       = useState('')
  const [localNotifs, setLocalNotifs]   = useState<any[]>([])
  const [selected, setSelected]         = useState<any | null>(null)

  const {
    notifications: dbNotifications,
    unreadCount: dbUnreadCount,
    markAllRead: dbMarkAllRead,
    markAsRead: dbMarkAsRead,
    deleteNotification: dbDeleteNotification
  } = useNotifications()

  // Derive notifications from DB and Local Storage
  const mappedDbNotifications = dbNotifications.map(n => ({
    id: n.id,
    title: lang === 'en' ? n.title_en : n.title_tr,
    description: lang === 'en' ? n.description_en : n.description_tr,
    time: formatTimeAgo(n.created_at, lang),
    read: n.read,
    icon: n.type as 'bell' | 'alert' | 'info' | 'user' | 'calendar',
    isDb: true
  }))

  const notifications = [
    ...mappedDbNotifications,
    ...localNotifs.map(n => ({ ...n, isDb: false }))
  ]

  const unreadCount = dbUnreadCount + localNotifs.filter(n => !n.read).length

  // Report local unread count changes to Header so total matches
  useEffect(() => {
    const localCount = localNotifs.filter(n => !n.read).length
    onUnreadCountChange?.(localCount)
  }, [localNotifs, onUnreadCountChange])

  useEffect(() => {
    setMounted(true)
    
    // Fetch authenticated user session to sync preferences persistently
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? '')
        const prefs = user.user_metadata?.preferences
        if (prefs) {
          if (prefs.email !== undefined) {
            setEmailAlerts(prefs.email)
            localStorage.setItem('nmm_notif_email', String(prefs.email))
          }
          if (prefs.push !== undefined) {
            setPushAlerts(prefs.push)
            localStorage.setItem('nmm_notif_push', String(prefs.push))
          }
          if (prefs.sound !== undefined) {
            setSoundAlerts(prefs.sound)
            localStorage.setItem('nmm_notif_sound', String(prefs.sound))
          }
        } else {
          // If no cloud metadata, load from localStorage with fallback to true
          const emailPref = localStorage.getItem('nmm_notif_email')
          const pushPref  = localStorage.getItem('nmm_notif_push')
          const soundPref = localStorage.getItem('nmm_notif_sound')
          setEmailAlerts(emailPref !== 'false')
          setPushAlerts(pushPref !== 'false')
          setSoundAlerts(soundPref !== 'false')
        }
      }
    })

    // Restore persisted read/dismissed state
    setLocalNotifs(loadNotifications())

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selected) setSelected(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  async function handleToggle(type: 'email' | 'push' | 'sound', current: boolean) {
    const next = !current
    let nextEmail = emailAlerts
    let nextPush = pushAlerts
    let nextSound = soundAlerts

    const supabase = createClient()

    if (type === 'email')  { 
      setEmailAlerts(next);  
      nextEmail = next;
      localStorage.setItem('nmm_notif_email', String(next));
      if (next) {
        toast.info(lang === 'en' ? `Email alerts enabled for ${userEmail}` : `E-posta bildirimleri ${userEmail} için aktif edildi`)
      }
    }
    if (type === 'push')   { 
      setPushAlerts(next);   
      nextPush = next;
      localStorage.setItem('nmm_notif_push',  String(next));
      if (next && 'Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            toast.success(lang === 'en' ? 'Browser notifications enabled!' : 'Tarayıcı bildirimleri aktif edildi!')
            new Notification('Network Marketing Master', {
              body: lang === 'en' ? 'System notifications successfully enabled.' : 'Sistem bildirimleri başarıyla aktif edildi.',
              icon: '/logo.png'
            })
          } else {
            toast.warning(lang === 'en' ? 'Permission denied by browser.' : 'Tarayıcı izni reddedildi.')
          }
        })
      }
    }
    if (type === 'sound')  { 
      setSoundAlerts(next);  
      nextSound = next;
      localStorage.setItem('nmm_notif_sound', String(next));
      if (next) {
        playNotificationSound()
      }
    }

    // Persist preferences in Supabase Auth user_metadata
    try {
      await supabase.auth.updateUser({
        data: {
          preferences: {
            email: nextEmail,
            push: nextPush,
            sound: nextSound
          }
        }
      })
    } catch (err) {
      console.error('[NotificationsModal] Failed to sync preferences to auth metadata:', err)
    }

    toast.success('Tercihleriniz güncellendi')
  }

  function openNotification(n: any) {
    setSelected(n)
    if (n.isDb) {
      dbMarkAsRead(n.id)
    } else {
      setLocalNotifs(prev => {
        const updated = prev.map(x => x.id === n.id ? { ...x, read: true } : x)
        persistRead(updated)
        return updated
      })
    }

    // Play chime sound directly matching React state soundAlerts
    if (soundAlerts) {
      playNotificationSound()
    }
  }

  function markAllRead() {
    // Clear local storage notifications
    persistDismissed(localNotifs.map(n => n.id))
    setLocalNotifs([])

    // Mark database notifications as read
    dbMarkAllRead()

    toast.success(lang === 'en' ? 'All notifications marked as read' : 'Tüm bildirimler okundu yapıldı')
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
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
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
                  className="flex items-center gap-1 text-xs font-semibold text-[#534AB7] transition hover:underline"
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
                          : 'border-[#534AB7]/20 bg-[#f0f4ff]/60 dark:bg-[#534AB7]/8 hover:border-[#534AB7]/40'
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
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#534AB7]" />
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
              { type: 'email' as const, icon: Mail,    label: 'E-posta Bildirimleri',  val: emailAlerts },
              { type: 'push'  as const, icon: Monitor, label: 'Tarayıcı Bildirimleri', val: pushAlerts  },
              { type: 'sound' as const, icon: Volume2, label: 'Sesli Uyarılar',        val: soundAlerts },
            ].map(({ type, icon: Icon, label, val }) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#534AB7]" />
                  <span className="text-sm font-medium text-[var(--text-1)]">{label}</span>
                </div>
                <button
                  onClick={() => handleToggle(type, val)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${val ? 'bg-[#534AB7]' : 'bg-[var(--border)]'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
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
          <div className={`fixed left-1/2 top-1/2 ${Z.confirm} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] overflow-hidden`}>
            {/* Renkli Üst Şerit */}
            <div className={`h-1.5 w-full ${
              selected.icon === 'calendar' ? 'bg-gradient-to-r from-[#0F6E56] to-emerald-400' :
              selected.icon === 'alert'    ? 'bg-gradient-to-r from-amber-400 to-yellow-300' :
              'bg-gradient-to-r from-[#534AB7] to-indigo-400'
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

              {/* Okundu rozeti */}
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0F6E56]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Okundu olarak işaretlendi
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl bg-[#534AB7] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#453da0] active:scale-95"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
