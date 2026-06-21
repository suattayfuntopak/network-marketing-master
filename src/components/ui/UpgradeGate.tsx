'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Sparkles, ArrowRight, Lock, Users, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'
import { useWorkspace } from '@/hooks/useWorkspace'
import { DAILY_AI_LIMITS } from '@/lib/domain/planLimits'
import type { GatedFeature } from '@/lib/domain/featureAccess'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import {
  resolveUpgradePlansTarget,
  upgradePlansHref,
  type ProUpgradeCtaSource,
} from '@/lib/domain/planFeatureMatrix'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { UpgradeModalFooter } from '@/components/ui/UpgradeModalFooter'

export type UpgradeFeature = GatedFeature | 'team'

function resolveFeature(f: UpgradeFeature): GatedFeature {
  return f === 'team' ? 'team_full' : f
}

function titleKey(feature: UpgradeFeature): string {
  switch (feature) {
    case 'ai_coach': return 'shellUi.upgradeAiCoachTitle'
    case 'ai_field': return 'shellUi.upgradeAiFieldTitle'
    case 'team':
    case 'team_full': return 'shellUi.teamGateTitle'
    case 'team_pulse': return 'shellUi.upgradeTeamPulseTitle'
    case 'stats_advanced': return 'shellUi.upgradeStatsTitle'
    default: return 'shellUi.featureGateTitle'
  }
}

function descKey(feature: UpgradeFeature): string {
  switch (feature) {
    case 'ai_coach': return 'shellUi.upgradeAiCoachDesc'
    case 'ai_field': return 'shellUi.upgradeAiFieldDesc'
    case 'team':
    case 'team_full': return 'shellUi.teamGateDesc'
    case 'team_pulse': return 'shellUi.upgradeTeamPulseDesc'
    case 'stats_advanced': return 'shellUi.upgradeStatsDesc'
    default: return 'shellUi.featureGateDesc'
  }
}

// ── Modal variant ──────────────────────────────────────────────────────────

interface ModalProps {
  variant: 'modal'
  feature: UpgradeFeature
  open: boolean
  onClose: () => void
}

function ModalGate({ feature, open, onClose }: Omit<ModalProps, 'variant'>) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const [mounted] = useState(() => typeof window !== 'undefined')
  useBodyScrollLock(open)
  useHistoryBackClose(open, onClose)
  if (!open || !mounted) return null

  const trialEnded =
    !!ws &&
    !ws.isSuperAdmin &&
    ws.licenseType === 'free' &&
    !ws.isTrialActive
  const resolvedFeature = resolveFeature(feature)
  const plansTarget = resolveUpgradePlansTarget(resolvedFeature)
  const plansHref = upgradePlansHref(plansTarget)
  const ctaLabelKey =
    plansTarget === 'pro'
      ? 'shellUi.teamProUpgradeCta'
      : plansTarget === 'plus'
        ? 'shellUi.upgradePlusCta'
        : 'shellUi.upgradeBannerCta'

  const logCtaClick = () => {
    if (plansTarget === 'pro') {
      void logProductEventAction(PRODUCT_EVENTS.proUpgradeCtaClick, {
        source: 'upgrade_gate' satisfies ProUpgradeCtaSource,
        feature: resolvedFeature,
      })
    } else {
      void logProductEventAction(PRODUCT_EVENTS.upgradeGateCtaClick, {
        trialEnded: false,
        feature: resolvedFeature,
        cta: 'upgrade',
      })
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 ${Z.confirmBackdrop} bg-black/55 backdrop-blur-sm`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-2xl text-center ${Z.confirm}`}
        role="dialog"
        aria-labelledby="upgrade-gate-title"
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
        <h2 id="upgrade-gate-title" className="text-base sm:text-lg font-bold text-[var(--text-1)] pr-8">
          {trialEnded ? t('shellUi.upgradeTrialEndedTitle') : t(titleKey(feature))}
        </h2>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--text-2)]">
          {trialEnded ? (
            <span className="block space-y-2">
              <span className="block">{t('shellUi.accountModalLockedBody')}</span>
              <span className="block rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
                {t('shellUi.accountModalLockedFootnote')}
              </span>
            </span>
          ) : (
            t(descKey(feature))
          )}
        </p>

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
                {t(`shellUi.planBlurb_${plan}`, { limit: DAILY_AI_LIMITS[plan] })}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {trialEnded ? (
            <UpgradeModalFooter
              onClose={onClose}
              phase="ended"
              source="upgrade_gate"
            />
          ) : (
            <Link
              href={plansHref}
              onClick={() => {
                logCtaClick()
                onClose()
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl brand-cta px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
            >
              <Sparkles className="h-4 w-4" />
              {t(ctaLabelKey)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Overlay variant (full-page gate with blurred children) ─────────────────

interface OverlayProps {
  variant: 'overlay'
  feature: UpgradeFeature
  children: React.ReactNode
  locked: boolean
}

function OverlayGate({ feature, children, locked }: Omit<OverlayProps, 'variant'>) {
  const [dismissed, setDismissed] = useState(false)
  useBodyScrollLock(locked && !dismissed)
  if (!locked) return <>{children}</>
  return (
    <>
      {children}
      <ModalGate
        feature={resolveFeature(feature)}
        open={!dismissed}
        onClose={() => setDismissed(true)}
      />
    </>
  )
}

// ── Banner variant (inline upgrade nudge) ─────────────────────────────────

interface BannerProps {
  variant: 'banner'
}

function BannerGate() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-[#EEEDFE]/80 to-[var(--bg-card)] p-4 sm:p-5 dark:border-[var(--border)] dark:from-brand/[0.08] dark:to-[var(--bg-card)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
          <Users className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-1)]">{t('shellUi.teamFreeBannerTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">{t('shellUi.teamFreeBannerDesc')}</p>
          <Link
            href="/odeme"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl brand-cta px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('shellUi.upgradeBannerCta')}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Unified public API ─────────────────────────────────────────────────────

export type UpgradeGateProps =
  | ModalProps
  | OverlayProps
  | BannerProps

export function UpgradeGate(props: UpgradeGateProps) {
  if (props.variant === 'modal') {
    const { feature, open, onClose } = props
    return <ModalGate feature={feature} open={open} onClose={onClose} />
  }
  if (props.variant === 'overlay') {
    const { feature, children, locked } = props
    return <OverlayGate feature={feature} locked={locked}>{children}</OverlayGate>
  }
  return <BannerGate />
}
