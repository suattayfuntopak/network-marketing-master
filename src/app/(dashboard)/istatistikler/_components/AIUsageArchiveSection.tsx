'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CalendarRange } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  getAIUsageArchiveAction,
  type AIUsageArchivePeriod,
} from '../actions'

const PERIODS: { id: AIUsageArchivePeriod; labelKey: string }[] = [
  { id: '7d', labelKey: 'statsPage.archivePeriod7d' },
  { id: '30d', labelKey: 'statsPage.archivePeriod30d' },
  { id: '365d', labelKey: 'statsPage.archivePeriod365d' },
  { id: 'all', labelKey: 'statsPage.archivePeriodAll' },
]

export function AIUsageArchiveSection() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<AIUsageArchivePeriod>('30d')

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-usage-archive', period],
    queryFn: () => getAIUsageArchiveAction(period),
    staleTime: 120_000,
  })

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-brand" />
            {t('statsPage.archiveTitle')}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed max-w-2xl">
            {t('statsPage.archiveSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                period === p.id
                  ? 'bg-[#534AB7] text-white shadow-md'
                  : 'border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:border-[#534AB7]/40'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('statsPage.archiveStatUsers'), value: data.totals.users },
            { label: t('statsPage.archiveStatMessages'), value: data.totals.message },
            { label: t('statsPage.archiveStatCoach'), value: data.totals.roleplay },
            { label: t('statsPage.archiveStatCompliance'), value: data.totals.compliance },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-3 py-2.5 text-center"
            >
              <p className="text-lg font-black tabular-nums text-[var(--text-1)]">{stat.value}</p>
              <p className="text-[10px] font-semibold text-[var(--text-3)]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          {(error as Error).message}
        </p>
      )}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
      ) : !data || data.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-xs text-[var(--text-3)]">
          {t('statsPage.archiveEmpty')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none">
          <table className="w-full text-left border-collapse text-xs min-w-[880px]">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold">
                <th className="p-3">{t('statsPage.colPartnerName')}</th>
                <th className="p-3">{t('statsPage.colLicense')}</th>
                <th className="p-3 text-center">{t('statsPage.archiveColDays')}</th>
                <th className="p-3 text-center">{t('statsPage.aiColMessage')}</th>
                <th className="p-3 text-center">{t('statsPage.aiColCoach')}</th>
                <th className="p-3 text-center">{t('statsPage.aiColCompliance')}</th>
                <th className="p-3 text-center">{t('statsPage.archiveColTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.rows.map(row => {
                const total = row.messageTotal + row.roleplayTotal + row.complianceTotal
                return (
                  <tr key={row.userId} className="hover:bg-[var(--bg-subtle)]/60">
                    <td className="p-3">
                      <div className="font-semibold">{row.fullName ?? t('statsPage.unnamedMember')}</div>
                      <div className="text-[10px] text-[var(--text-3)] truncate max-w-[200px]">{row.email}</div>
                      {row.isInvitedDownline && (
                        <span className="mt-1 inline-block rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
                          {t('statsPage.archiveTagInvited')}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[10px] font-bold uppercase text-[var(--text-2)]">
                      {row.licenseType === 'free'
                        ? t('statsPage.licensePlanFree')
                        : row.licenseType === 'pro'
                        ? t('statsPage.licensePlanPro')
                        : row.licenseType === 'master'
                        ? t('statsPage.licensePlanMaster')
                        : t('statsPage.licensePlanLeader')}
                    </td>
                    <td className="p-3 text-center tabular-nums font-semibold">{row.activeDays}</td>
                    <td className="p-3 text-center tabular-nums text-emerald-700 dark:text-emerald-400">{row.messageTotal}</td>
                    <td className="p-3 text-center tabular-nums text-purple-700 dark:text-purple-400">{row.roleplayTotal}</td>
                    <td className="p-3 text-center tabular-nums text-red-600 dark:text-red-400">{row.complianceTotal}</td>
                    <td className="p-3 text-center tabular-nums font-black">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="flex items-center gap-1.5 text-[10px] text-[var(--text-3)]">
          <CalendarRange className="h-3.5 w-3.5" />
          {data.fromDate
            ? t('statsPage.archiveRange', { from: data.fromDate, to: data.toDate })
            : t('statsPage.archiveRangeAll', { to: data.toDate })}
        </p>
      )}
    </section>
  )
}
