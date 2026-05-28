'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { UserMenu } from './UserMenu'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Zap, Bell, Search, X } from 'lucide-react'
import { Z } from '@/lib/zIndex'
import { NotificationsModal, loadNotifications } from '@/components/ui/NotificationsModal'
import { QuickAddModal } from '@/components/ui/QuickAddModal'
import { useNotifications } from '@/hooks/useNotifications'

export const TRFlag = () => (
  <svg viewBox="0 0 1200 800" className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0">
    <rect width="1200" height="800" fill="#E30A17" />
    <circle cx="400" cy="400" r="200" fill="#fff" />
    <circle cx="450" cy="400" r="160" fill="#E30A17" />
    <polygon points="575,400 633.7,419.1 597.5,369.1 597.5,430.9 633.7,380.9" fill="#fff" />
  </svg>
)

export const USFlag = () => (
  <svg viewBox="0 0 7410 3900" className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0">
    <rect width="7410" height="3900" fill="#B22234" />
    <path d="M0,300 h7410 M0,900 h7410 M0,1500 h7410 M0,2100 h7410 M0,2700 h7410 M0,3300 h7410" stroke="#fff" strokeWidth="300" />
    <rect width="2964" height="2100" fill="#3C3B6E" />
    <g fill="#fff">
      {/* 9 columns and 5 rows of stars simplified */}
      <circle cx="300" cy="250" r="50" />
      <circle cx="800" cy="250" r="50" />
      <circle cx="1300" cy="250" r="50" />
      <circle cx="1800" cy="250" r="50" />
      <circle cx="2300" cy="250" r="50" />
      <circle cx="550" cy="500" r="50" />
      <circle cx="1050" cy="500" r="50" />
      <circle cx="1550" cy="500" r="50" />
      <circle cx="2050" cy="500" r="50" />
      <circle cx="300" cy="750" r="50" />
      <circle cx="800" cy="750" r="50" />
      <circle cx="1300" cy="750" r="50" />
      <circle cx="1800" cy="750" r="50" />
      <circle cx="2300" cy="750" r="50" />
      <circle cx="550" cy="1000" r="50" />
      <circle cx="1050" cy="1000" r="50" />
      <circle cx="1550" cy="1000" r="50" />
      <circle cx="2050" cy="1000" r="50" />
      <circle cx="300" cy="1250" r="50" />
      <circle cx="800" cy="1250" r="50" />
      <circle cx="1300" cy="1250" r="50" />
      <circle cx="1800" cy="1250" r="50" />
      <circle cx="2300" cy="1250" r="50" />
    </g>
  </svg>
)

export function Header({ visible = true }: { visible?: boolean }) {

  const { lang, setLang, t } = useTranslation()
  const { data: ws } = useWorkspace()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { unreadCount: dbUnreadCount } = useNotifications()
  const [localUnread, setLocalUnread] = useState(0)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  // Sayfa yüklendiğinde localStorage'dan okunmamış bildirim sayısını al
  useEffect(() => {
    setLocalUnread(loadNotifications().filter(n => !n.read).length)
  }, [])

  const unreadCount = dbUnreadCount + localUnread

  const licenseType = ws?.licenseType ?? 'free'
  const licenseExpiresAt = ws?.licenseExpiresAt ?? null
  const isLicenseExpired = licenseExpiresAt
    ? new Date(licenseExpiresAt) < new Date()
    : false
  const remainingDays = licenseExpiresAt
    ? Math.ceil((new Date(licenseExpiresAt).getTime() - Date.now()) / 86400000)
    : 999
  const showWarningBar = (licenseType !== 'free') && (isLicenseExpired || (remainingDays >= 0 && remainingDays <= 3))

  const getPlanLabel = (type: string) => {
    if (type === 'pro') return t('header.planPro')
    if (type === 'master') return t('header.planPlus')
    return t('header.planBasic')
  }

  const plan = getPlanLabel(licenseType)
  const warningBarText = isLicenseExpired
    ? t('header.licenseExpired', { plan })
    : t('header.licenseExpiring', { plan, days: remainingDays })

  // Handle Command + K / Ctrl + K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsMobileSearchOpen(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const isHeaderVisible = visible || isMobileSearchOpen

  return (
    <>
      <div className={`fixed left-0 right-0 top-0 ${Z.header} transition-transform duration-300 ease-in-out transform ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'} md:translate-y-0`}>
        {showWarningBar && (
          <div 
            onClick={() => router.push('/odeme')}
            className="flex h-8 w-full items-center justify-center bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-95 transition text-[10px] sm:text-xs font-bold text-white cursor-pointer px-4 select-none"
          >
            {warningBarText}
          </div>
        )}
        <header className="flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 backdrop-blur-md">
        
        {/* Mobil Tam Ekran Arama Çubuğu Popup */}
        {isMobileSearchOpen && (
          <div className={`absolute inset-0 ${Z.headerSearch} flex items-center bg-[var(--bg-card)] px-4 animate-in fade-in slide-in-from-top duration-200`}>
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
              <Search className="h-4.5 w-4.5 text-[var(--text-3)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="h-10 flex-1 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] px-4 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)]"
                title={t('common.close')}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        )}

        {/* Sol Taraf: Neon Logo ve Marka */}
        <Link href="/pano" className="flex items-center gap-3 transition-opacity hover:opacity-85">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900/80 p-0.5 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer">
            <img src="/logo.png" alt="NMM Logo" className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="hidden flex-col md:flex cursor-pointer">
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-xs font-black tracking-tight text-transparent">
              Network Marketing Master
            </span>
          </div>
        </Link>

        {/* Orta Taraf: Google-Style Arama Barı (Masaüstü) */}
        <form onSubmit={handleSearchSubmit} className="mx-4 hidden md:flex max-w-md flex-1 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] pl-10 pr-12 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition-[border-color,box-shadow] focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE] dark:focus:ring-[#534AB7]/10"
            />
            <kbd className="absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-3)] sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Sağ Taraf Buton Grubu */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Mobil Arama (Mercek) Butonu */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] shrink-0"
            title={t('common.search')}
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Kıvılcım (Hızlı Aday Ekleme) Butonu */}
          <button
            onClick={() => setQuickAddOpen(true)}
            title={t('common.sparkButtonTooltip')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 hover:bg-cyan-100 hover:text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-950/40 dark:hover:bg-cyan-950/40 transition-colors shadow-sm shrink-0"
          >
            <Zap className="h-4.5 w-4.5 fill-current animate-pulse" />
          </button>

          {/* Tema Butonu */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>

          {/* Dil Seçici (Mobil için tekli, Desktop için çiftli) */}
          <div className="flex items-center">
            {/* Mobil Görünüm (Sadece diğer dil gösterilir) */}
            <div className="flex md:hidden shrink-0 items-center justify-center">
              {lang === 'tr' ? (
                <button
                  onClick={() => setLang('en')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
                  title="Switch to English"
                >
                  <USFlag />
                </button>
              ) : (
                <button
                  onClick={() => setLang('tr')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
                  title="Türkçe'ye Geç"
                >
                  <TRFlag />
                </button>
              )}
            </div>

            {/* Masaüstü Görünüm (İki dil de yan yana gösterilir) */}
            <div className="hidden md:flex shrink-0 items-center gap-1 rounded-xl bg-[var(--bg-subtle)] p-1 border border-[var(--border)] ml-1">
              <button
                onClick={() => setLang('tr')}
                className={`flex h-7 w-9 items-center justify-center rounded-lg transition-all ${
                  lang === 'tr' 
                    ? 'bg-white shadow-sm dark:bg-[var(--bg-card)]' 
                    : 'opacity-50 hover:opacity-100'
                }`}
                title="Türkçe"
              >
                <TRFlag />
              </button>
              <button
                onClick={() => setLang('en')}
                className={`flex h-7 w-9 items-center justify-center rounded-lg transition-all ${
                  lang === 'en' 
                    ? 'bg-white shadow-sm dark:bg-[var(--bg-card)]' 
                    : 'opacity-50 hover:opacity-100'
                }`}
                title="English"
              >
                <USFlag />
              </button>
            </div>
          </div>

          {/* Bildirim Çanı */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] shrink-0"
            title={t('common.notifications')}
          >
            <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[var(--bg-card)] animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Kullanıcı Dropdown */}
          <div className="shrink-0">
            <UserMenu />
          </div>

        </div>
      </header>
      </div>

      {/* Modallar */}
      {notificationsOpen && (
        <NotificationsModal
          onClose={() => setNotificationsOpen(false)}
          onUnreadCountChange={(count) => setLocalUnread(count)}
        />
      )}

      {quickAddOpen && (
        <QuickAddModal onClose={() => setQuickAddOpen(false)} />
      )}
    </>
  )
}
