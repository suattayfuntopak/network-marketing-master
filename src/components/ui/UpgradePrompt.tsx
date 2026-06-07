'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Sparkles, ArrowRight, Lock, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import type { GatedFeature } from '@/lib/domain/featureAccess'

export type UpgradeFeature = GatedFeature | 'team'

interface UpgradePromptProps {
  feature: UpgradeFeature
  open: boolean
  onClose: () => void
}

const backdropClass = `fixed inset-0 flex items-center justify-center p-4 ${Z.confirmBackdrop} bg-black/55 backdrop-blur-sm`

function titleKey(feature: UpgradeFeature): string {
  switch (feature) {
    case 'ai_coach':
      return 'shellUi.upgradeAiCoachTitle'
    case 'ai_field':
      return 'shellUi.upgradeAiFieldTitle'
    case 'team':
    case 'team_full':
      return 'shellUi.teamGateTitle'
    case 'team_pulse':
      return 'shellUi.upgradeTeamPulseTitle'
    case 'stats_advanced':
      return 'shellUi.upgradeStatsTitle'
    default:
      return 'shellUi.featureGateTitle'
  }
}

function descKey(feature: UpgradeFeature): string {
  switch (feature) {
    case 'ai_coach':
      return 'shellUi.upgradeAiCoachDesc'
    case 'ai_field':
      return 'shellUi.upgradeAiFieldDesc'
    case 'team':
    case 'team_full':
      return 'shellUi.teamGateDesc'
    case 'team_pulse':
      return 'shellUi.upgradeTeamPulseDesc'
    case 'stats_advanced':
      return 'shellUi.upgradeStatsDesc'
    default:
      return 'shellUi.featureGateDesc'
  }
}

export function UpgradePrompt({ feature, open, onClose }: UpgradePromptProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useBodyScrollLock(open)

  useEffect(() => setMounted(true), [])

  if (!open || !mounted) return null

  const title = t(titleKey(feature))
  const desc = t(descKey(feature))

  return createPortal(
    <div
      className={backdropClass}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-2xl text-center ${Z.confirm}`}
        role="dialog"
        aria-labelledby="upgrade-prompt-title"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:bg-[var(--border)] hover:text-[var(--text-1)] transition"
          aria-label={t('shellUi.accountAlertClose')}
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500">
          <Lock className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h2 id="upgrade-prompt-title" className="text-base sm:text-lg font-bold text-[var(--text-1)] pr-8">
          {title}
        </h2>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--text-2)]">{desc}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-left">
          {(['basic', 'plus', 'pro'] as const).map(plan => (
            <div
              key={plan}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-2.5 py-2.5"
            >
              <p className="text-[10px] font-black uppercase tracking-wide text-[var(--text-3)]">
                {t(`shellUi.planLabel_${plan}`)}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-[var(--text-2)]">
                {t(`shellUi.planBlurb_${plan}`)}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/odeme"
          onClick={onClose}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
        >
          <Sparkles className="h-4 w-4" />
          {t('shellUi.upgradeBannerCta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>,
    document.body,
  )
}
