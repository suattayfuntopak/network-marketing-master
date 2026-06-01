'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
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

type AiRowType = 'leader' | 'nmm' | 'saha' | 'external'

type Triple = { message: number; roleplay: number; compliance: number }

type AiRow = {
  key: string
  name: string
  email: string | null
  avatarUrl: string | null
  type: AiRowType
  license: string | null
  href: string | null
  usage: Triple | null
  /** Süper admin için true → limit ∞ gösterilir. */
  unlimited: boolean
  /** Plan limitleri; saha (uygulama dışı) için null. */
  limits: Triple | null
  /** Lisans profili henüz yüklenmedi → free fallback yerine iskelet göster. */
  loading?: boolean
}

/** "kullanım / limit" — süper admin ∞, saha —. */
function usageCell(usage: Triple | null, key: keyof Triple, unlimited: boolean, limits: Triple | null): string {
  if (!usage) return '—'
  if (unlimited) return `${usage[key]} / ∞`
  if (limits) return `${usage[key]} / ${limits[key]}`
  return String(usage[key])
}

const TYPE_BADGE: Record<AiRowType, { icon: string; labelKey: string }> = {
  leader: { icon: '👑', labelKey: 'statsPage.roleLeader' },
  nmm: { icon: '💎', labelKey: 'statsPage.typeNmm' },
  saha: { icon: '🤝', labelKey: 'statsPage.typeField' },
  external: { icon: '🌐', labelKey: 'statsPage.typeExternal' },
}

/** Pulse dönem tipi (today/7d/30d/ytd/all) → arşiv dönem tipi (aynı değerler). */
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
    staleTime: 30_000,
  })

  // Sıralı tek liste: Lider → NMM → Saha → Dış Kayıt
  const rows = useMemo((): AiRow[] => {
    const out: AiRow[] = []
    const leaders = sortedMembers.filter(m => m.role === 'leader')
    const nmms = sortedMembers.filter(m => m.role !== 'leader')

    const memberRow = (m: TeamMember, type: AiRowType): AiRow => {
      const profile = memberLicenses[m.user_id]
      // Profil henüz yüklenmedi → free fallback gösterme (ÜCRETSİZ yanıp sönmesi).
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
        usage: periodUsage[m.user_id] ?? { message: 0, roleplay: 0, compliance: 0 },
        unlimited: isAdmin,
        limits: lim
          ? { message: lim.messageLimit, roleplay: lim.roleplayLimit, compliance: lim.complianceLimit }
          : null,
        loading,
      }
    }

    for (const m of leaders) out.push(memberRow(m, 'leader'))
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
        usage: null,
        unlimited: false,
        limits: null,
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
        usage: periodUsage[r.userId] ?? { message: 0, roleplay: 0, compliance: 0 },
        unlimited: false,
        limits: { message: r.messageLimit, roleplay: r.roleplayLimit, compliance: r.complianceLimit },
      })
    }
    return out
  }, [sortedMembers, sahaRows, independentUsage, memberLicenses, periodUsage, getMemberHref, licenseLabel, t])

  const totals = rows.reduce(
    (acc, r) => ({
      message: acc.message + (r.usage?.message ?? 0),
      roleplay: acc.roleplay + (r.usage?.roleplay ?? 0),
      compliance: acc.compliance + (r.usage?.compliance ?? 0),
    }),
    { message: 0, roleplay: 0, compliance: 0 }
  )

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand animate-pulse" />
            {t('statsPage.aiAdminTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed max-w-3xl">
            {t('statsPage.aiAdminSubtitle')}
          </p>
        </div>
        <PulsePeriodTabs period={period} onChange={setPeriod} comfortableTypography />
      </div>

      <div
        className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
        onTouchStart={e => e.stopPropagation()}
      >
        <table className="w-full text-left border-collapse text-sm min-w-[800px]">
          <thead>
            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
              <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
              <th className="p-3 font-semibold text-center">{t('statsPage.colType')}</th>
              <th className="p-3 font-semibold">{t('statsPage.colLicense')}</th>
              <th className="p-3 font-semibold text-center bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400">
                {t('statsPage.aiColMessage')}
              </th>
              <th className="p-3 font-semibold text-center bg-purple-50/20 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400">
                {t('statsPage.aiColCoach')}
              </th>
              <th className="p-3 font-semibold text-center bg-red-50/20 dark:bg-red-950/5 text-red-600 dark:text-red-400">
                {t('statsPage.aiColCompliance')}
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
                          <img src={row.avatarUrl} alt={row.name} className="h-full w-full object-cover" />
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
                  <td className="p-3 text-center tabular-nums bg-emerald-50/10 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400 font-black">
                    {row.loading ? <Skeleton className="mx-auto h-3.5 w-12 rounded" /> : usageCell(row.usage, 'message', row.unlimited, row.limits)}
                  </td>
                  <td className="p-3 text-center tabular-nums bg-purple-50/10 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 font-semibold">
                    {row.loading ? <Skeleton className="mx-auto h-3.5 w-12 rounded" /> : usageCell(row.usage, 'roleplay', row.unlimited, row.limits)}
                  </td>
                  <td className="p-3 text-center tabular-nums bg-red-50/10 dark:bg-red-950/5 text-red-600 dark:text-red-400 font-semibold">
                    {row.loading ? <Skeleton className="mx-auto h-3.5 w-12 rounded" /> : usageCell(row.usage, 'compliance', row.unlimited, row.limits)}
                  </td>
                </tr>
              )
            })}
            {rows.length > 0 && (
              <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-subtle)]/60 font-black text-[var(--text-1)]">
                <td className="p-3 uppercase tracking-wide">{t('statsPage.colTotal')}</td>
                <td className="p-3" />
                <td className="p-3" />
                <td className="p-3 text-center tabular-nums text-emerald-700 dark:text-emerald-400">{totals.message}</td>
                <td className="p-3 text-center tabular-nums text-purple-700 dark:text-purple-400">{totals.roleplay}</td>
                <td className="p-3 text-center tabular-nums text-red-600 dark:text-red-400">{totals.compliance}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
