'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  X, Zap, Bot, Target, MessageSquare,
  Shield, BarChart2, CalendarDays, BookOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import { SquareButton, type ButtonColor } from '@/components/ui/SquareButton'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface HubItem {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: ButtonColor
}

const HUB_ITEMS: HubItem[] = [
  { href: '/bugun/ilgilen',  labelKey: 'nav.todayFocus',   icon: Zap,           color: 'purple' },
  { href: '/yazar',          labelKey: 'nav.yazar',        icon: Bot,           color: 'cyan'   },
  { href: '/saha-provasi',   labelKey: 'nav.sahaProvasi',  icon: Target,        color: 'blue'   },
  { href: '/itirazlar',      labelKey: 'nav.itirazlar',    icon: MessageSquare, color: 'coral'  },
  { href: '/uyum',           labelKey: 'nav.uyum',         icon: Shield,        color: 'teal'   },
  { href: '/istatistikler',  labelKey: 'nav.istatistikler',icon: BarChart2,     color: 'indigo' },
  { href: '/takvim',         labelKey: 'nav.takvim',       icon: CalendarDays,  color: 'pink'   },
  { href: '/egitim',         labelKey: 'nav.egitim',       icon: BookOpen,      color: 'amber'  },
]

interface BugunModuleSheetProps {
  open: boolean
  onClose: () => void
}

function SheetContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <div className={`fixed inset-0 ${Z.sheet} flex items-end justify-center`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          'relative w-full max-w-lg',
          'rounded-t-3xl bg-[var(--bg-card)]',
          'border-t border-[var(--border)]',
          'shadow-[0_-8px_40px_-4px_rgba(0,0,0,0.18)]',
          'pb-safe',
          'animate-slide-up',
        )}
        role="dialog"
        aria-modal
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <p className="text-base font-bold text-[var(--text-1)]">
            {t('dashboard.hubTitle')}
          </p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] transition hover:bg-[var(--border)] hover:text-[var(--text-1)]"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-6 pt-1">
          {HUB_ITEMS.map(({ href, labelKey, icon: Icon, color }) => (
            <SquareButton
              key={href}
              icon={Icon as Parameters<typeof SquareButton>[0]['icon']}
              label={t(labelKey)}
              color={color}
              variant="filled"
              onClick={() => navigate(href)}
              compact
              className="w-full"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function BugunModuleSheet({ open, onClose }: BugunModuleSheetProps) {
  if (!open) return null
  if (typeof window === 'undefined') return null
  return createPortal(<SheetContent onClose={onClose} />, document.body)
}
