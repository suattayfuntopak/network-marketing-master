'use client'

import { CreditCard, Eye, Sparkles, ArrowRight, Link2, Percent } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { CardInfo } from './CardInfo'
import type { PlatformCardKey } from '@/lib/domain/platformCardHelp'
import { computeProductFunnelRates, type ProductFunnelCounts } from '@/lib/domain/productFunnelStats'

type Props = {
  funnel: ProductFunnelCounts | undefined
  isLoading: boolean
}

const cardClass = 'relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-sm'
const labelClass = 'text-[9px] font-bold uppercase tracking-wider block text-[var(--text-3)]'

function FunnelCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  helpKey,
}: {
  label: string
  value: number
  hint?: string
  icon: typeof Eye
  accent?: string
  helpKey: PlatformCardKey
}) {
  return (
    <div className={cardClass}>
      <CardInfo cardKey={helpKey} />
      <span className={labelClass}>{label}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-2xl font-black ${accent ?? 'text-[var(--text-1)]'}`}>{value}</span>
        <Icon className={`ml-auto h-4 w-4 ${accent ?? 'text-[var(--text-3)]'}`} />
      </div>
      {hint ? <span className="mt-0.5 block text-[10px] text-[var(--text-3)]">{hint}</span> : null}
    </div>
  )
}

export function PlatformProductFunnel({ funnel, isLoading }: Props) {
  const { t } = useTranslation()
  const rates = funnel ? computeProductFunnelRates(funnel) : null
  const formatPct = (value: number | null) =>
    value == null ? '—' : t('platformPage.viralPercentValue', { value })

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-bold text-[var(--text-1)]">{t('platformPage.funnelTitle')}</h2>
        <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-3)]">
          {t('platformPage.viralWindowHint', { days: 30 })}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FunnelCard
            label={t('platformPage.funnelLandingViews')}
            helpKey="funnelLandingViews"
            value={funnel?.pricingSectionView ?? 0}
            icon={Eye}
            accent="text-sky-700 dark:text-sky-300"
          />
          <FunnelCard
            label={t('platformPage.funnelSeePlans')}
            helpKey="funnelSeePlans"
            value={funnel?.seePlansClick ?? 0}
            hint={t('platformPage.funnelSeePlansHint', {
              alert: funnel?.seePlansClickAccountAlert ?? 0,
              gate: funnel?.seePlansClickUpgradeGate ?? 0,
              notif: funnel?.seePlansClickNotification ?? 0,
            })}
            icon={Sparkles}
            accent="text-brand"
          />
          <FunnelCard
            label={t('platformPage.funnelOdemeViews')}
            helpKey="funnelOdemeViews"
            value={funnel?.odemePageView ?? 0}
            icon={CreditCard}
            accent="text-emerald-700 dark:text-emerald-300"
          />
          <FunnelCard
            label={t('platformPage.funnelProUpgradeCta')}
            helpKey="funnelProUpgradeCta"
            value={funnel?.proUpgradeCtaClick ?? 0}
            hint={t('platformPage.funnelProUpgradeHint', {
              gate: funnel?.proUpgradeCtaUpgradeGate ?? 0,
              summary: funnel?.proUpgradeCtaEkipSummary ?? 0,
              training: funnel?.proUpgradeCtaEkipTraining ?? 0,
              stats: funnel?.proUpgradeCtaStatsHint ?? 0,
            })}
            icon={Sparkles}
            accent="text-pink-700 dark:text-pink-300"
          />
          <FunnelCard
            label={t('platformPage.funnelUpgradeGateLegacy')}
            helpKey="funnelUpgradeGateLegacy"
            value={funnel?.upgradeGateCtaClick ?? 0}
            icon={ArrowRight}
          />
          <FunnelCard
            label={t('platformPage.funnelSeePlansTrial')}
            helpKey="funnelSeePlansTrial"
            value={funnel?.seePlansClickTrial ?? 0}
            icon={Sparkles}
          />
          <FunnelCard
            label={t('platformPage.funnelSeePlansEnded')}
            helpKey="funnelSeePlansEnded"
            value={funnel?.seePlansClickEnded ?? 0}
            icon={Sparkles}
          />
          <FunnelCard
            label={t('platformPage.funnelPlusDeepLink')}
            helpKey="funnelPlusDeepLink"
            value={funnel?.odemePlusDeepLink ?? 0}
            icon={Link2}
          />
          <FunnelCard
            label={t('platformPage.funnelBasicDeepLinkLegacy')}
            helpKey="funnelBasicDeepLinkLegacy"
            value={funnel?.odemeBasicDeepLink ?? 0}
            icon={Link2}
          />
        </div>
      )}

      {!isLoading && funnel ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={cardClass}>
            <CardInfo cardKey="funnelRateSeePlans" />
            <span className={labelClass}>{t('platformPage.funnelRateSeePlans')}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-[var(--text-1)]">
                {formatPct(rates?.seePlansFromLandingPct ?? null)}
              </span>
              <Percent className="ml-auto h-4 w-4 text-[var(--text-3)]" />
            </div>
          </div>
          <div className={cardClass}>
            <CardInfo cardKey="funnelRateOdeme" />
            <span className={labelClass}>{t('platformPage.funnelRateOdeme')}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-[var(--text-1)]">
                {formatPct(rates?.odemeFromSeePlansPct ?? null)}
              </span>
              <Percent className="ml-auto h-4 w-4 text-[var(--text-3)]" />
            </div>
          </div>
          <div className={cardClass}>
            <CardInfo cardKey="funnelDeepLinkCompare" />
            <span className={labelClass}>{t('platformPage.funnelDeepLinkCompare', {
              plus: funnel.odemePlusDeepLink,
              pro: funnel.proUpgradeCtaClick,
            })}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <Link2 className="ml-auto h-4 w-4 text-[var(--text-3)]" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
