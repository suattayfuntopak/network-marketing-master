'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { Crown, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import type { TeamMember } from '@/hooks/useTeamMembers'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import {
  getIndependentSignupAIUsageAction,
  getMemberLicenseProfilesAction,
  getAiUsageByPeriodAction,
  type AIUsageArchivePeriod,
} from '../actions'
import { PulsePeriodTabs } from '@/app/(dashboard)/_components/pulse/PulsePeriodTabs'
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PulsePeriod } from '@/lib/domain/pulse'

type PerformanceRow = TeamMember & { isAppUser: boolean }

export type SahaRow = { id: string; full_name: string | null; avatar_url?: string | null }

type StatsSuperAdminSectionsProps = {
  sortedMembers: TeamMember[]
  sahaRows: SahaRow[]
  getMemberHref: (row: PerformanceRow) => string | null
  licenseLabel: (licenseType: string) => string
}

type AiRowType = 'leader' | 'nmm' | 'external' | 'saha'

type AiRow = {
  key: string
  name: string
  email: string | null
  avatarUrl: string | null
  type: AiRowType
  license: string | null
  href: string | null
  aiUsed: number | null
  unlimited: boolean
  dailyLimit: number | null
  loading?: boolean
}

function usageCell(aiUsed: number | null, unlimited: boolean, dailyLimit: number | null): string {
  if (aiUsed === null) return '—'
  if (unlimited) return `${aiUsed} / ∞`
  if (dailyLimit !== null) return `${aiUsed} / ${dailyLimit}`
  return String(aiUsed)
}

const TYPE_BADGE: Record<AiRowType, { icon: string; labelKey: string }> = {
  leader: { icon: '👑', labelKey: 'statsPage.roleLeader' },
  nmm: { icon: '💎', labelKey: 'statsPage.typeNmm' },
  saha: { icon: '🤝', labelKey: 'statsPage.typeField' },
  external: { icon: '🌐', labelKey: 'statsPage.typeExternal' },
}

function toArchivePeriod(p: PulsePeriod): AIUsageArchivePeriod {
  return p as AIUsageArchivePeriod
}

export function StatsSuperAdminSections({
  sortedMembers,
  sahaRows,
  getMemberHref,
  licenseLabel,
}: StatsSuperAdminSectionsProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [period, setPeriod] = useState<PulsePeriod>('today')

  const memberUserIds = useMemo(() => sortedMembers.map(m => m.user_id), [sortedMembers])

  const { data: independentResult } = useQuery({
    queryKey: ['independent-ai-usage'],
    queryFn: getIndependentSignupAIUsageAction,
    staleTime: 60_000,
    throwOnError: false,
  })
  const independentUsage = useMemo(() => independentResult?.data ?? [], [independentResult])

  const { data: memberLicenses = {} } = useQuery({
    queryKey: ['member-license-profiles', memberUserIds],
    queryFn: () => getMemberLicenseProfilesAction(memberUserIds),
    enabled: memberUserIds.length > 0,
    staleTime: 60_000,
  })

  const appUserIds = useMemo(
    () => [...memberUserIds, ...independentUsage.map(r => r.userId)],
    [memberUserIds, independentUsage]
  )

  const { data: periodUsage = {} } = useQuery({
    queryKey: ['ai-usage-by-period', appUserIds, period],
    queryFn: () => getAiUsageByPeriodAction(appUserIds, toArchivePeriod(period)),
    enabled: appUserIds.length > 0,
    staleTime: 60_000,
    // Period değişiminde tablo boşalmaz; eski değerler görünmeye devam eder.
    placeholderData: keepPreviousData,
  })

  const rows = useMemo((): AiRow[] => {
    const out: AiRow[] = []
    const nmms = sortedMembers.filter(m => m.role !== 'leader')

    const memberRow = (m: TeamMember, type: AiRowType): AiRow => {
      const profile = memberLicenses[m.user_id]
      const loading = !profile
      const isAdmin = !!profile?.isSuperAdmin
      const lim = isAdmin || !profile
        ? null
        : getLimitsForLicense(
            profile.licenseType,
            false,
            profile.licenseExpiresAt,
            profile.workspaceCreatedAt
          )
      return {
        key: `m_${m.user_id}`,
        name: m.full_name ?? t('statsPage.unnamedMember'),
        email: null,
        avatarUrl: m.avatar_url ?? null,
        type,
        license: loading
          ? null
          : isAdmin
            ? t('statsPage.licensePlanSuperAdmin')
            : licenseLabel(profile.licenseType),
        href: getMemberHref({ ...m, isAppUser: true }),
        aiUsed: periodUsage[m.user_id]?.ai ?? 0,
        unlimited: isAdmin,
        dailyLimit: lim?.dailyLimit ?? null,
        loading,
      }
    }

    for (const m of nmms) out.push(memberRow(m, 'nmm'))
    for (const s of sahaRows) {
      out.push({
        key: `s_${s.id}`,
        name: s.full_name ?? t('statsPage.unnamedMember'),
        email: null,
        avatarUrl: s.avatar_url ?? null,
        type: 'saha',
        license: null,
        href: `/pipeline/${s.id}`,
        aiUsed: null,
        unlimited: false,
        dailyLimit: null,
      })
    }
    for (const r of independentUsage) {
      out.push({
        key: `e_${r.userId}`,
        name: r.fullName ?? t('statsPage.unnamedMember'),
        email: r.email,
        avatarUrl: r.avatarUrl,
        type: 'external',
        license: licenseLabel(r.licenseType),
        href: null,
        aiUsed: periodUsage[r.userId]?.ai ?? 0,
        unlimited: false,
        dailyLimit: r.dailyLimit,
      })
    }
    return out
  }, [sortedMembers, sahaRows, independentUsage, memberLicenses, periodUsage, getMemberHref, licenseLabel, t])

  const totalAi = rows.reduce((acc, r) => acc + (r.aiUsed ?? 0), 0)

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-brand animate-pulse" />
          {t('statsPage.aiAdminTitle')}
        </h2>
        <PulsePeriodTabs period={period} onChange={setPeriod} comfortableTypography />
      </div>

      <HorizontalScrollLock className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <table className="w-full text-left border-collapse text-sm min-w-[640px]">
          <thead>
            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
              <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
              <th className="p-3 font-semibold text-center">{t('statsPage.colType')}</th>
              <th className="p-3 font-semibold">{t('statsPage.colLicense')}</th>
              <th className="p-3 font-semibold text-center bg-brand/5 text-brand">
                {t('statsPage.aiColUnified')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
            {rows.map(row => {
              const badge = TYPE_BADGE[row.type]
              const isLeader = row.type === 'leader'
              return (
                <tr
                  key={row.key}
                  onClick={row.href ? () => router.push(row.href!) : undefined}
                  className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${row.href ? 'cursor-pointer' : ''} ${isLeader ? 'font-bold bg-amber-50/5 dark:bg-amber-950/5' : ''}`}
                >
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {row.avatarUrl ? (
                        <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
                          <Image src={row.avatarUrl} alt={row.name} width={24} height={24} unoptimized className="h-full w-full object-cover" />
                          {isLeader && (
                            <Crown className="absolute -top-1 -right-1 h-3 w-3 text-[#854F0B] bg-white rounded-full p-[1px]" strokeWidth={2.5} />
                          )}
                        </div>
                      ) : isLeader ? (
                        <Crown className="h-4 w-4 text-[#854F0B]" strokeWidth={2.5} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{row.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--text-2)]">
                      {badge.icon} {t(badge.labelKey)}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-[var(--text-2)] font-semibold uppercase">
                    {row.loading ? <Skeleton className="h-3.5 w-14 rounded" /> : (row.license ?? '—')}
                  </td>
                  <td className="p-3 text-center tabular-nums bg-brand/5 text-brand font-black">
                    {row.loading ? (
                      <Skeleton className="mx-auto h-3.5 w-12 rounded" />
                    ) : (
                      usageCell(row.aiUsed, row.unlimited, row.dailyLimit)
                    )}
                  </td>
                </tr>
              )
            })}
            {rows.length > 0 && (
              <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-subtle)]/60 font-black text-[var(--text-1)]">
                <td className="p-3 uppercase tracking-wide">{t('statsPage.colTotal')}</td>
                <td className="p-3" />
                <td className="p-3" />
                <td className="p-3 text-center tabular-nums text-brand">{totalAi}</td>
              </tr>
            )}
          </tbody>
        </table>
      </HorizontalScrollLock>
    </section>
  )
}
