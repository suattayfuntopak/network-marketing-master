'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Crown, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import type { TeamMember } from '@/hooks/useTeamMembers'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import { getIndependentSignupAIUsageAction, getMemberLicenseProfilesAction } from '../actions'
import { AIUsageArchiveSection } from './AIUsageArchiveSection'

type PerformanceRow = TeamMember & { isAppUser: boolean }

type StatsSuperAdminSectionsProps = {
  sortedMembers: TeamMember[]
  getMemberHref: (row: PerformanceRow) => string | null
  formatUsageLimit: (used: number, limit: number) => string
  licenseLabel: (licenseType: string) => string
  workspaceLicenseType: string | undefined
  workspaceExpiresAt: string | null | undefined
  workspaceCreatedAt: string | null | undefined
}

export function StatsSuperAdminSections({
  sortedMembers,
  getMemberHref,
  formatUsageLimit,
  licenseLabel,
  workspaceLicenseType,
  workspaceExpiresAt,
  workspaceCreatedAt,
}: StatsSuperAdminSectionsProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const memberUserIds = useMemo(() => sortedMembers.map(m => m.user_id), [sortedMembers])

  const { data: independentUsage = [], isLoading: independentLoading } = useQuery({
    queryKey: ['independent-ai-usage'],
    queryFn: getIndependentSignupAIUsageAction,
    staleTime: 60_000,
  })

  const { data: memberLicenses = {} } = useQuery({
    queryKey: ['member-license-profiles', memberUserIds],
    queryFn: () => getMemberLicenseProfilesAction(memberUserIds),
    enabled: memberUserIds.length > 0,
    staleTime: 60_000,
  })

  const limitsForMember = useCallback(
    (member: TeamMember) => {
      const profile = memberLicenses[member.user_id]
      if (!profile) {
        return getLimitsForLicense(
          workspaceLicenseType,
          false,
          workspaceExpiresAt,
          workspaceCreatedAt
        )
      }
      return getLimitsForLicense(
        profile.licenseType,
        profile.isSuperAdmin,
        profile.licenseExpiresAt,
        profile.workspaceCreatedAt
      )
    },
    [memberLicenses, workspaceLicenseType, workspaceExpiresAt, workspaceCreatedAt]
  )

  const memberShowsUnlimited = useCallback(
    (member: TeamMember) => !!memberLicenses[member.user_id]?.isSuperAdmin,
    [memberLicenses]
  )

  return (
    <>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand animate-pulse" />
            {t('statsPage.aiAdminTitle')}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
            {t('statsPage.aiAdminSubtitle')}
          </p>
        </div>

        <div
          className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
          onTouchStart={e => e.stopPropagation()}
        >
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
                <th className="p-3 font-semibold">{t('statsPage.colRole')}</th>
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
              {sortedMembers.map(m => {
                const isLeader = m.role === 'leader'
                const detailHref = getMemberHref({ ...m, isAppUser: true })
                const memberLimits = limitsForMember(m)
                const unlimited = memberShowsUnlimited(m)
                return (
                  <tr
                    key={m.user_id}
                    onClick={detailHref ? () => router.push(detailHref) : undefined}
                    className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${detailHref ? 'cursor-pointer' : ''} ${isLeader ? 'font-bold bg-amber-50/5 dark:bg-amber-950/5' : ''}`}
                  >
                    <td className="p-3 flex items-center gap-2 whitespace-nowrap">
                      {m.avatar_url ? (
                        <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
                          <img src={m.avatar_url} alt={m.full_name ?? ''} className="h-full w-full object-cover" />
                          {isLeader && (
                            <Crown className="absolute -top-1 -right-1 h-3 w-3 text-[#854F0B] bg-white rounded-full p-[1px]" strokeWidth={2.5} />
                          )}
                        </div>
                      ) : isLeader ? (
                        <Crown className="h-4 w-4 text-[#854F0B]" strokeWidth={2.5} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      )}
                      <span>{m.full_name ?? t('statsPage.unnamedMember')}</span>
                    </td>
                    <td className="p-3 text-[10px] text-[var(--text-2)] font-semibold uppercase">
                      {isLeader ? t('statsPage.roleLeader') : t('statsPage.rolePartner')}
                    </td>
                    <td className="p-3 text-center tabular-nums bg-emerald-50/10 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400 font-black">
                      {unlimited
                        ? t('statsPage.unlimited')
                        : formatUsageLimit(m.today_message ?? 0, memberLimits.messageLimit)}
                    </td>
                    <td className="p-3 text-center tabular-nums bg-purple-50/10 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 font-semibold">
                      {unlimited
                        ? t('statsPage.unlimited')
                        : formatUsageLimit(m.today_roleplay ?? 0, memberLimits.roleplayLimit)}
                    </td>
                    <td className="p-3 text-center tabular-nums bg-red-50/10 dark:bg-red-950/5 text-red-600 dark:text-red-400 font-semibold">
                      {unlimited
                        ? t('statsPage.unlimited')
                        : formatUsageLimit(m.today_compliance ?? 0, memberLimits.complianceLimit)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand animate-pulse" />
            {t('statsPage.aiIndependentTitle')}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
            {t('statsPage.aiIndependentSubtitle')}
          </p>
        </div>

        {independentLoading ? (
          <p className="text-xs text-[var(--text-3)] py-4 text-center">…</p>
        ) : independentUsage.length === 0 ? (
          <p className="text-xs text-[var(--text-3)] py-4 text-center">{t('statsPage.aiIndependentEmpty')}</p>
        ) : (
          <div
            className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
            onTouchStart={e => e.stopPropagation()}
          >
            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                  <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
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
                {independentUsage.map(row => (
                  <tr key={row.userId} className="hover:bg-[var(--bg-subtle)]/75 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.avatarUrl ? (
                          <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
                            <img src={row.avatarUrl} alt={row.fullName ?? ''} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-zinc-300" />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{row.fullName ?? t('statsPage.unnamedMember')}</div>
                          <div className="text-[10px] text-[var(--text-3)] truncate">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[10px] text-[var(--text-2)] font-semibold uppercase">
                      {licenseLabel(row.licenseType)}
                    </td>
                    <td className="p-3 text-center tabular-nums bg-emerald-50/10 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400 font-black">
                      {formatUsageLimit(row.todayMessage, row.messageLimit)}
                    </td>
                    <td className="p-3 text-center tabular-nums bg-purple-50/10 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 font-semibold">
                      {formatUsageLimit(row.todayRoleplay, row.roleplayLimit)}
                    </td>
                    <td className="p-3 text-center tabular-nums bg-red-50/10 dark:bg-red-950/5 text-red-600 dark:text-red-400 font-semibold">
                      {formatUsageLimit(row.todayCompliance, row.complianceLimit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AIUsageArchiveSection />
    </>
  )
}
