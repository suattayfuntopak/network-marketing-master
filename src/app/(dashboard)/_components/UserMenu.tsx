'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Settings, Bell, ChevronDown } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { logoutAction } from '../actions'
import { ProfileModal } from '@/components/ui/ProfileModal'
import { NotificationsModal } from '@/components/ui/NotificationsModal'
import { SettingsModal } from '@/components/ui/SettingsModal'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] px-2.5 py-1.5 transition hover:bg-[var(--bg-subtle)]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEEDFE] text-[10px] font-bold text-[#534AB7]">
          {initials}
        </div>
        {ws?.fullName && (
          <span className="hidden max-w-[120px] truncate text-xs font-semibold text-[var(--text-1)] lg:block">
            {ws.fullName.split(' ')[0]}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-3)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Kullanıcı bilgisi */}
          <div className="border-b border-[var(--border)] px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold text-[var(--text-1)]">{ws?.fullName}</p>
            <p className="text-xs capitalize text-[var(--text-3)]">
              {ws?.role === 'leader' ? 'Lider' : 'Üye'}
            </p>
          </div>

          <button
            onClick={() => {
              setProfileOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
          >
            <User className="h-4 w-4" strokeWidth={1.75} />
            Profil
          </button>
          <button
            onClick={() => {
              setNotificationsOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            Bildirimler
          </button>
          <button
            onClick={() => {
              setSettingsOpen(true)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
            Ayarlar
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-[#72243E] transition hover:bg-[#FBEAF0]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Çıkış Yap
            </button>
          </form>
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
    </div>
  )
}
