'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, User, Settings, Bell, ChevronDown, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { logoutAction } from '../_shared-actions'
import { ProfileModal } from '@/components/ui/ProfileModal'
import { NotificationsModal } from '@/components/ui/NotificationsModal'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { clearNmmLocalStorage } from '@/lib/ui/userScopedStorage'
import { ACCOUNT_ALERT_SEEN_KEY } from '@/app/(dashboard)/pano/_components/AccountStatusAlert'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'

export function UserMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)
  const { data: ws } = useWorkspace()

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const initials = ws?.fullName
    ? ws.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const avatarUrl = ws?.avatarUrl ?? null
  const showUpgrade = ws && !ws.isSuperAdmin && ws.licenseType === 'free'

  async function handleLogoutConfirm() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutConfirmOpen(false)
    setOpen(false)
    try {
      // logoutAction scope:'global' — tüm cihazlardaki oturumları sunucuda kapatır.
      await logoutAction()
      // Paylaşılan tarayıcı hijyeni: önceki kullanıcının cihaz-yerel izini sil
      // (tümü Supabase'de kalıcı; sonraki girişte yeniden yüklenir).
      clearNmmLocalStorage()
      // Oturum-yerel banner bayrağını temizle → yeni girişte plan barı tekrar görünsün.
      try { window.sessionStorage.removeItem(ACCOUNT_ALERT_SEEN_KEY) } catch { /* yok */ }
    } catch (err) {
      console.error('[logout]', err)
    }
    // Tam sayfa yüklemesi: cookie temizlendikten sonra proxy /giris'te kalır (SPA push bazen /pano'ya geri döner)
    window.location.assign('/giris')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] px-2.5 py-1.5 transition hover:bg-[var(--bg-subtle)]"
        title={t('shellUi.profileMenu')}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profil"
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-full object-cover ring-1 ring-[#534AB7]/30"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-subtle text-[10px] font-bold text-brand">
            {initials}
          </div>
        )}
        {ws?.fullName && (
          <span className="hidden max-w-[120px] truncate text-xs font-semibold text-[var(--text-1)] lg:block">
            {ws.fullName.split(' ')[0]}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-3)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute right-0 top-11 ${Z.dropdown} w-60 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150`}>
          {/* Kullanıcı bilgisi */}
          <div className="border-b border-[var(--border)] px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold text-[var(--text-1)]">{ws?.fullName}</p>
            {ws?.email && (
              <p className="truncate text-[10px] text-[var(--text-3)] font-medium mb-1">{ws.email}</p>
            )}
            <p className="text-xs capitalize text-[var(--text-3)] font-semibold">
              {ws?.role === 'leader'
                ? t('shellUi.roleLeader')
                : t('shellUi.roleMember')}
            </p>
          </div>

          {showUpgrade && (
            <Link
              href="/odeme"
              onClick={() => setOpen(false)}
              className="mx-2 mb-2 flex items-start gap-3 rounded-xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-2.5 transition hover:from-indigo-500/15 hover:to-purple-500/15"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-1)]">
                  {ws.isTrialActive
                    ? t('shellUi.upgradeMenuTrialTitle')
                    : t('shellUi.upgradeMenuExpiredTitle')}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-[var(--text-3)]">
                  {t('shellUi.upgradeMenuDesc')}
                </p>
              </div>
            </Link>
          )}

          <button
            onClick={() => {
              setProfileOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <User className="h-4 w-4" strokeWidth={1.75} />
            {t('shellUi.profile')}
          </button>
          <button
            onClick={() => {
              setNotificationsOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            {t('shellUi.notifications')}
          </button>
          <button
            onClick={() => {
              setSettingsOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
            {t('shellUi.settings')}
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <button
            type="button"
            onClick={() => {
              setLogoutConfirmOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-[#72243E] dark:text-[#e87fa3] transition hover:bg-[#FBEAF0] dark:hover:bg-[#3d0f1f] cursor-pointer"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t('shellUi.logout')}
          </button>
        </div>
      )}

      {/* Modallar */}
      {profileOpen && (
        <ProfileModal onClose={() => setProfileOpen(false)} />
      )}
      {notificationsOpen && (
        <NotificationsModal onClose={() => setNotificationsOpen(false)} />
      )}
      {settingsOpen && (
        <SettingsModal workspaceId={ws?.workspaceId || ''} onClose={() => setSettingsOpen(false)} />
      )}

      {logoutConfirmOpen && (
        <ConfirmDialog
          message={t('shellUi.confirmLogout')}
          onConfirm={() => {
            void handleLogoutConfirm()
          }}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}
    </div>
  )
}
