'use client'

import { Rocket, Send, Eye, UserPlus, Percent, Activity } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { CardInfo } from './CardInfo'
import type { ViralKpi } from '@/lib/domain/viralKpi'

type Props = {
  kpi: ViralKpi | undefined
  isLoading: boolean
}

const cardClass = 'relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm'
const labelClass = 'text-[9px] font-bold uppercase tracking-wider block'

export function PlatformViralKpi({ kpi, isLoading }: Props) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
        <h2 className="text-sm font-bold text-[var(--text-1)]">{t('platformPage.viralTitle')}</h2>
        <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-3)]">
          {t('platformPage.viralWindowHint', { days: kpi?.windowDays ?? 30 })}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {/* K-Faktörü — kahraman metrik */}
          <div className={`${cardClass} border-fuchsia-300/40 dark:border-fuchsia-500/20`}>
            <CardInfo cardKey="viralKFactor" />
            <span className={`${labelClass} text-fuchsia-600 dark:text-fuchsia-300`}>
              {t('platformPage.viralKFactor')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-fuchsia-700 dark:text-fuchsia-300">
                {kpi?.kFactor ?? 0}
              </span>
              <Rocket className="ml-auto h-4.5 w-4.5 text-fuchsia-600 dark:text-fuchsia-300" />
            </div>
            <span className="mt-0.5 block text-[10px] text-[var(--text-3)]">
              {t('platformPage.viralKFactorHint')}
            </span>
          </div>

          {/* Davet gönderildi */}
          <div className={cardClass}>
            <CardInfo cardKey="viralInvitesSent" />
            <span className={`${labelClass} text-[var(--text-3)]`}>
              {t('platformPage.viralInvitesSent')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[var(--text-1)]">{kpi?.invitesSent ?? 0}</span>
              <Send className="ml-auto h-4.5 w-4.5 text-[var(--text-3)]" />
            </div>
          </div>

          {/* Görüntülendi */}
          <div className={cardClass}>
            <CardInfo cardKey="viralLandingViews" />
            <span className={`${labelClass} text-sky-600 dark:text-sky-300`}>
              {t('platformPage.viralLandingViews')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-sky-700 dark:text-sky-300">
                {kpi?.landingViews ?? 0}
              </span>
              <Eye className="ml-auto h-4.5 w-4.5 text-sky-600 dark:text-sky-300" />
            </div>
          </div>

          {/* Kayıt */}
          <div className={cardClass}>
            <CardInfo cardKey="viralAccepted" />
            <span className={`${labelClass} text-emerald-600 dark:text-emerald-300`}>
              {t('platformPage.viralAccepted')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {kpi?.accepted ?? 0}
              </span>
              <UserPlus className="ml-auto h-4.5 w-4.5 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>

          {/* Dönüşüm % */}
          <div className={cardClass}>
            <CardInfo cardKey="viralConversion" />
            <span className={`${labelClass} text-amber-600 dark:text-amber-300`}>
              {t('platformPage.viralConversion')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-700 dark:text-amber-300">
                {t('platformPage.viralPercentValue', { value: kpi?.conversionPct ?? 0 })}
              </span>
              <Percent className="ml-auto h-4.5 w-4.5 text-amber-600 dark:text-amber-300" />
            </div>
          </div>

          {/* Aktif kullanıcı + DAU */}
          <div className={cardClass}>
            <CardInfo cardKey="viralActiveUsers" />
            <span className={`${labelClass} text-indigo-600 dark:text-indigo-300`}>
              {t('platformPage.viralActiveUsers')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
                {kpi?.activeUsers ?? 0}
              </span>
              <Activity className="ml-auto h-4.5 w-4.5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <span className="mt-0.5 block text-[10px] text-[var(--text-3)]">
              {t('platformPage.viralDauHint', { count: kpi?.dau ?? 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Paylaşım kaynakları — WhatsApp paylaşımı tür kırılımı (her tür tek olay) */}
      {!isLoading && kpi && kpi.shares.total > 0 && (
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm">
          <CardInfo cardKey="viralShares" />
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
            {t('platformPage.viralSharesTitle')}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {([
              ['platformPage.viralShareInvite', kpi.shares.invite],
              ['platformPage.viralShareSocial', kpi.shares.social],
              ['platformPage.viralShareAchievement', kpi.shares.achievement],
              ['platformPage.viralShareAnnouncement', kpi.shares.announcement],
              ['platformPage.viralShareBroadcast', kpi.shares.broadcast],
            ] as const).map(([key, val]) => (
              <div key={key} className="rounded-xl bg-[var(--bg-subtle)] p-2 text-center">
                <div className="text-lg font-black text-[var(--text-1)]">{val}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                  {t(key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
