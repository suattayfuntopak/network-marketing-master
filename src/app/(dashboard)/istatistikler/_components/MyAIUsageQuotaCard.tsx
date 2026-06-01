'use client'

import { Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { formatAIUsageDisplay, aiUsageProgressPercent } from '@/lib/domain/aiUsage'

interface AIUsage {
  isSuperAdmin?: boolean
  messageUsed?: number
  roleplayUsed?: number
  complianceUsed?: number
}

interface Props {
  usage: AIUsage | undefined
  messageLimit: number
  roleplayLimit: number
  complianceLimit: number
}

export function MyAIUsageQuotaCard({ usage, messageLimit, roleplayLimit, complianceLimit }: Props) {
  const { t, lang } = useTranslation()

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFBEB] dark:bg-[#201600]">
          <Sparkles className="h-4 w-4 text-[#D97706]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--text-1)]">
            {t('statsPage.quotaTitle')}
          </h2>
          <p className="text-sm text-[var(--text-3)]">
            {t('statsPage.quotaSubtitle')}
          </p>
        </div>
      </div>

      {usage?.isSuperAdmin ? (
        /* Super Admin Custom View */
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent p-4 shadow-inner">
          <div className="flex items-start gap-3">
            <div className="text-2xl mt-0.5 animate-bounce">👑</div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                {t('statsPage.quotaSuperTitle')}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-2)] font-semibold">
                {t('statsPage.quotaSuperDesc')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Standard User progress bars - Beautiful 3-column layout */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
          {/* 1. YZ Mesajı */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-bold text-[var(--text-1)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0F6E56]" />
                {t('statsPage.quotaWriter')}
              </span>
              <span className="font-extrabold text-[var(--text-2)] tabular-nums">
                {formatAIUsageDisplay(usage?.messageUsed ?? 0, messageLimit, lang)} {t('statsPage.quotaUsed')}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F6E56] transition-all duration-500"
                style={{ width: `${aiUsageProgressPercent(usage?.messageUsed ?? 0, messageLimit)}%` }}
              />
            </div>
          </div>

          {/* 2. YZ Koçu (Saha Provası) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-bold text-[var(--text-1)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#534AB7]" />
                {t('statsPage.quotaCoach')}
              </span>
              <span className="font-extrabold text-[var(--text-2)] tabular-nums">
                {formatAIUsageDisplay(usage?.roleplayUsed ?? 0, roleplayLimit, lang)} {t('statsPage.quotaUsed')}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#534AB7] transition-all duration-500"
                style={{ width: `${aiUsageProgressPercent(usage?.roleplayUsed ?? 0, roleplayLimit)}%` }}
              />
            </div>
          </div>

          {/* 3. Uyum Denetimi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-bold text-[var(--text-1)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C03E1F]" />
                {t('statsPage.quotaCompliance')}
              </span>
              <span className="font-extrabold text-[var(--text-2)] tabular-nums">
                {complianceLimit > 0
                  ? `${formatAIUsageDisplay(usage?.complianceUsed ?? 0, complianceLimit, lang)} ${t('statsPage.quotaUsed')}`
                  : t('statsPage.quotaUpgrade')}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C03E1F] transition-all duration-500"
                style={{ width: `${complianceLimit > 0 ? aiUsageProgressPercent(usage?.complianceUsed ?? 0, complianceLimit) : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
