'use client'

import { useState, useEffect } from 'react'
import { X, Bell, Mail, Monitor, Volume2, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/zIndex'

interface NotificationsModalProps {
  onClose: () => void
}

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  read: boolean
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  // Settings in local state / localStorage
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(true)
  const [soundAlerts, setSoundAlerts] = useState(false)

  // Mock list of recent notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Yeni aday eklendi',
      description: 'Selda Kıratlı ekibinize yeni aday olarak katıldı.',
      time: '10 dakika önce',
      read: false,
    },
    {
      id: '2',
      title: 'Takip zamanı geldi',
      description: 'Ahmet Yılmaz ile bugün yapmanız gereken sunum takibi var.',
      time: '2 saat önce',
      read: false,
    },
    {
      id: '3',
      title: 'Sistem Güncellemesi',
      description: 'Geri Al özellikli silme onay mekanizması aktif edildi.',
      time: '1 gün önce',
      read: true,
    },
  ])

  useEffect(() => {
    // Load setting defaults from localStorage if exists
    const emailPref = localStorage.getItem('nmm_notif_email')
    const pushPref = localStorage.getItem('nmm_notif_push')
    const soundPref = localStorage.getItem('nmm_notif_sound')

    if (emailPref !== null) setEmailAlerts(emailPref === 'true')
    if (pushPref !== null) setPushAlerts(pushPref === 'true')
    if (soundPref !== null) setSoundAlerts(soundPref === 'true')

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleToggle(type: 'email' | 'push' | 'sound', current: boolean) {
    const nextVal = !current
    if (type === 'email') {
      setEmailAlerts(nextVal)
      localStorage.setItem('nmm_notif_email', String(nextVal))
    } else if (type === 'push') {
      setPushAlerts(nextVal)
      localStorage.setItem('nmm_notif_push', String(nextVal))
    } else if (type === 'sound') {
      setSoundAlerts(nextVal)
      localStorage.setItem('nmm_notif_sound', String(nextVal))
    }
    toast.success('Bildirim tercihleriniz güncellendi')
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('Tüm bildirimler okundu olarak işaretlendi')
  }

  function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.success('Bildirim silindi')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/50 backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`fixed left-1/2 top-1/2 ${Z.sheet} w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] transition-all`}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-1)]">Bildirimler</h2>
            <p className="text-xs text-[var(--text-3)]">Aday takipleri ve sistem bildirimlerini yönetin</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ayarlar Bölümü */}
        <div className="space-y-3 rounded-2xl bg-[var(--bg-subtle)] p-4 border border-[var(--border)] mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)] mb-2">Tercihler</h3>
          
          {/* E-posta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#534AB7]" />
              <span className="text-sm font-medium text-[var(--text-1)]">E-posta Bildirimleri</span>
            </div>
            <button
              onClick={() => handleToggle('email', emailAlerts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailAlerts ? 'bg-[#534AB7]' : 'bg-[var(--border)]'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Tarayıcı Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-[#534AB7]" />
              <span className="text-sm font-medium text-[var(--text-1)]">Tarayıcı Bildirimleri</span>
            </div>
            <button
              onClick={() => handleToggle('push', pushAlerts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pushAlerts ? 'bg-[#534AB7]' : 'bg-[var(--border)]'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pushAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Sesli Uyarılar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-[#534AB7]" />
              <span className="text-sm font-medium text-[var(--text-1)]">Sesli Uyarılar</span>
            </div>
            <button
              onClick={() => handleToggle('sound', soundAlerts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${soundAlerts ? 'bg-[#534AB7]' : 'bg-[var(--border)]'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${soundAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Son Bildirimler Listesi */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">Son Bildirimler</h3>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-[#534AB7] hover:underline"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tümünü Okundu Yap
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] rounded-2xl">
              <Bell className="h-8 w-8 text-[var(--text-3)]" />
              <p className="text-xs text-[var(--text-3)]">Hiç bildiriminiz yok</p>
            </div>
          ) : (
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`group relative flex items-start justify-between rounded-xl border border-[var(--border)] p-3 transition ${n.read ? 'bg-[var(--bg-card)]' : 'bg-[#f0f4ff]/40 border-[#534AB7]/10 dark:bg-[#534AB7]/5'}`}
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-[#534AB7] shrink-0" />}
                      <p className="text-sm font-semibold text-[var(--text-1)] truncate">{n.title}</p>
                    </div>
                    <p className="text-xs text-[var(--text-2)] mt-0.5 line-clamp-2">{n.description}</p>
                    <span className="text-[10px] text-[var(--text-3)] mt-1.5 block">{n.time}</span>
                  </div>

                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
