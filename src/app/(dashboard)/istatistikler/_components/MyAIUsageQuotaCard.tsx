'use client'

import { Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { formatAIUsageDisplay, aiUsageProgressPercent } from '@/lib/domain/aiUsage'

interface AIUsage {
  isSuperAdmin?: boolean
  aiUsed?: number
}

interface Props {
  usage: AIUsage | undefined
  dailyLimit: number
}

export function MyAIUsageQuotaCard({ usage, dailyLimit }: Props) {
  const { t, lang } = useTranslation()
  const aiUsed = usage?.aiUsed ?? 0

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFBEB] dark:bg-[#201600]">
          <Sparkles className="h-4 w-4 text-[#D97706]" strokeWidth={2} />
        </div>
        <h2 className="text-base font-bold text-[var(--text-1)]">
          {t('statsPage.quotaTitle')}
        </h2>
      </div>

      {usage?.isSuperAdmin ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent p-4">
          <span className="text-2xl">👑</span>
          <h3 className="text-base font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest">
            {t('statsPage.quotaSuperTitle')}
          </h3>
        </div>
      ) : (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-sm font-bold text-[var(--text-1)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {t('statsPage.quotaUnified')}
            </span>
            <span className="font-extrabold text-[var(--text-2)] tabular-nums">
              {dailyLimit > 0
                ? `${formatAIUsageDisplay(aiUsed, dailyLimit, lang)} ${t('statsPage.quotaUsed')}`
                : t('statsPage.quotaUpgrade')}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{
                width: `${dailyLimit > 0 ? aiUsageProgressPercent(aiUsed, dailyLimit) : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-[var(--text-3)]">{t('statsPage.quotaUnifiedHint')}</p>
        </div>
      )}
    </section>
  )
}
