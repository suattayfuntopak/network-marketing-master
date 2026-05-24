'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Bell, Mail, Monitor, Volume2, CheckCircle2, AlertCircle, Info, UserPlus, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/zIndex'

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

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Takip zamanı geldi',
    description: 'Ahmet Yılmaz ile bugün yapmanız gereken sunum takibi var. Son görüşmenizden bu yana 3 gün geçti. Hemen iletişime geçin!',
    time: '2 saat önce',
    read: false,
    icon: 'calendar',
  },
  {
    id: '2',
    title: 'Yeni aday eklendi',
    description: 'Selda Kıratlı ekibinize yeni aday olarak katıldı. Profil sayfasını ziyaret ederek ilk görüşme notlarınızı ekleyebilirsiniz.',
    time: '10 dakika önce',
    read: false,
    icon: 'user',
  },
  {
    id: '3',
    title: 'Sistem Güncellemesi',
    description: 'Geri Al özellikli silme mekanizması aktif edildi. Artık adayları silerken 5 saniyelik geri alma süresi tanınıyor.',
    time: '1 gün önce',
    read: true,
    icon: 'info',
  },
]

const NOTIF_DISMISSED_KEY = 'nmm_notif_dismissed_ids'
const NOTIF_READ_KEY = 'nmm_notif_read_ids'

function loadNotifications(): NotificationItem[] {
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

export function NotificationsModal({ onClose, onUnreadCountChange }: NotificationsModalProps) {
  const [emailAlerts, setEmailAlerts]   = useState(true)
  const [pushAlerts, setPushAlerts]     = useState(true)
  const [soundAlerts, setSoundAlerts]   = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS)
  const [selected, setSelected] = useState<NotificationItem | null>(null)

  // Bildirim sayısı değişince üst bileşeni bildir
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    onUnreadCountChange?.(count)
  }, [notifications, onUnreadCountChange])

  useEffect(() => {
    const emailPref = localStorage.getItem('nmm_notif_email')
    const pushPref  = localStorage.getItem('nmm_notif_push')
    const soundPref = localStorage.getItem('nmm_notif_sound')
    if (emailPref !== null) setEmailAlerts(emailPref === 'true')
    if (pushPref  !== null) setPushAlerts(pushPref   === 'true')
    if (soundPref !== null) setSoundAlerts(soundPref === 'true')

    // Restore persisted read/dismissed state
    setNotifications(loadNotifications())

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selected) setSelected(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  function handleToggle(type: 'email' | 'push' | 'sound', current: boolean) {
    const next = !current
    if (type === 'email')  { setEmailAlerts(next);  localStorage.setItem('nmm_notif_email', String(next)) }
    if (type === 'push')   { setPushAlerts(next);   localStorage.setItem('nmm_notif_push',  String(next)) }
    if (type === 'sound')  { setSoundAlerts(next);  localStorage.setItem('nmm_notif_sound', String(next)) }
    toast.success('Tercihleriniz güncellendi')
  }

  function openNotification(n: NotificationItem) {
    setSelected(n)
    setNotifications(prev => {
      const updated = prev.map(x => x.id === n.id ? { ...x, read: true } : x)
      persistRead(updated)
      return updated
    })
  }

  function markAllRead() {
    persistDismissed(notifications.map(n => n.id))
    setNotifications([])
    toast.success('Tüm bildirimler temizlendi')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/50 backdrop-blur-sm`} onClick={onClose} />

      {/* Ana Modal */}
      <div className={`fixed left-1/2 top-1/2 ${Z.sheet} w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)]`}
           style={{ maxHeight: '90dvh', overflowY: 'auto' }}>

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
                {notifications.map(n => (
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
    </>
  )
}
