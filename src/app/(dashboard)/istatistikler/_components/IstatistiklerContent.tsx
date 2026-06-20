'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useCandidateStats } from '@/hooks/useCandidateStats'
import { useTeamMembers, type TeamMember } from '@/hooks/useTeamMembers'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import { hasStatsAdvancedAccess } from '@/lib/domain/featureAccess'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { matchUnlinkedKatildiCandidates } from '@/lib/domain/sahaPartners'
import { buildCandidateTrendBars } from '@/lib/domain/trendBuckets'
import { StatsKpiCards } from './StatsKpiCards'
import { StatsFieldFunnelSection } from './StatsFieldFunnelSection'
const StatsCharts = dynamic(
  () => import('./StatsCharts').then(m => m.StatsCharts),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)]" />,
  }
)
import { TeamPerformanceTable } from './TeamPerformanceTable'
import { MyAIUsageQuotaCard } from './MyAIUsageQuotaCard'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { PulsePeriodTabs } from '@/app/(dashboard)/_components/pulse/PulsePeriodTabs'
import type { MemberRow } from '@/lib/team/types'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { DashboardPageHeader } from '@/components/ui/DashboardPageHeader'
import { pageHeaderIconClass, PAGE_HEADER_ICON_GLYPH } from '@/lib/ui/pageHeaderIcon'

type PerformanceRow = TeamMember & { isAppUser: boolean }

export function IstatistiklerContent() {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates = [], isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { data: usage } = useAIUsage()
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(ws?.workspaceId)
  const teamLimits = getLimitsForLicense(
    ws?.licenseType,
    ws?.isSuperAdmin,
    ws?.licenseExpiresAt,
    ws?.workspaceCreatedAt
  )
  const { dailyLimit } = teamLimits
  const teamStatsLocked = !hasStatsAdvancedAccess(
    ws?.effectiveLicenseType ?? ws?.licenseType,
    ws?.isSuperAdmin,
  )
  const teamPulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)

  const [period, setPeriod] = useState<PulsePeriod>('30d')

  // Sort team members: Leader (Me) first, followed by downline members
  const sortedMembers = useMemo(() => {
    const leader = members.find(m => m.role === 'leader')
    const downlines = members.filter(m => m.role === 'member')
    return leader ? [leader, ...downlines] : members
  }, [members])

  const pulseMemberRows = useMemo((): MemberRow[] => {
    return sortedMembers.map(m => ({
      user_id: m.user_id,
      full_name: m.full_name,
      role: m.role,
      joined_at: m.joined_at,
      candidate_count: m.candidate_count,
      yeni_count: m.yeni_count,
      sunum_count: m.sunum_count,
      takip_count: m.takip_count,
      katildi_count: m.katildi_count,
      last_activity_at: m.last_activity_at,
      onboarding_steps: m.onboarding_steps,
      avatar_url: m.avatar_url ?? null,
    }))
  }, [sortedMembers])

  // Eğitim/İtiraz/Video ilerlemesi — perf tablosunun 3 yeni sütunu için (kişi bazlı).
  const perfMemberIds = useMemo(
    () => pulseMemberRows.filter(m => m.role !== 'leader').map(m => m.user_id),
    [pulseMemberRows]
  )
  const { data: perfProgress } = useQuery({
    queryKey: queryKeys.teamProgressMap(ws?.workspaceId ?? '', perfMemberIds),
    queryFn: () => getTeamProgressMapAction(ws!.workspaceId, perfMemberIds),
    enabled: !!ws?.workspaceId && perfMemberIds.length > 0 && !teamStatsLocked,
    staleTime: QUERY_STALE.metrics,
  })

  // Non-NMM "Saha Ortakları": katildi candidates not matched to any workspace member
  const sahaOrtaklari = useMemo(
    () => matchUnlinkedKatildiCandidates(candidates, sortedMembers),
    [candidates, sortedMembers]
  )

  // Combined performance table rows: NMM members + Saha Ortakları
  const performanceRows = useMemo((): PerformanceRow[] => {
    const nmmRows = sortedMembers.map(m => ({ ...m, isAppUser: true as const }))
    const sahaRows = sahaOrtaklari.map(c => ({
      user_id: c.id,
      full_name: c.full_name,
      role: 'member' as const,
      joined_at: null,
      candidate_count: 0,
      yeni_count: 0,
      iletisim_count: 0,
      davetli_count: 0,
      sunum_count: 0,
      takip_count: 0,
      katildi_count: 0,
      last_activity_at: null,
      onboarding_steps: [] as string[],
      isAppUser: false as const,
      avatar_url: resolveCandidateFields(c).avatarUrl,
    }))
    return [...nmmRows, ...sahaRows]
  }, [sortedMembers, sahaOrtaklari])

  const pipelineByUserId = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const m of sortedMembers) map.set(m.user_id, m.pipeline_id ?? null)
    return map
  }, [sortedMembers])

  const getMemberHref = (row: { user_id: string; isAppUser?: boolean }): string | null => {
    if (row.isAppUser === false) return `/pipeline/${row.user_id}`
    const pipelineId = pipelineByUserId.get(row.user_id)
    if (pipelineId) return `/pipeline/${pipelineId}`
    return `/ekip/${row.user_id}`
  }

  const { metrics, temperatureData, funnelSteps } = useCandidateStats(
    candidates,
    period,
    t,
  )

  // 5. Kayıt Trendi Barları (MiniTrend benzeri) — saf mantık lib/domain/trendBuckets'ta
  const trendBars = useMemo(
    () => buildCandidateTrendBars(candidates, period, now),
    [candidates, period, now],
  )

  const maxTrendCount = Math.max(...trendBars.map(b => b.count), 1)

  const showInitialSkeleton = (wsLoading && !ws) || (cLoading && candidates.length === 0)

  if (showInitialSkeleton) {
    return (
      <div className="w-full space-y-4 px-4 pt-6">
        <div className="h-6 w-32 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="h-10 w-44 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[14px] bg-[var(--bg-subtle)]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <DashboardPageHeader
          title={t('statsPage.title')}
          subtitle={t('statsPage.subtitle')}
          icon={<BarChart3 className={PAGE_HEADER_ICON_GLYPH} strokeWidth={2} />}
          iconContainerClassName={pageHeaderIconClass('/istatistikler')}
          actions={<PulsePeriodTabs period={period} onChange={setPeriod} comfortableTypography />}
        />

        <div className="space-y-6">
          {/* KPI Cards */}
          <StatsKpiCards metrics={metrics} />

          <StatsFieldFunnelSection period={period} />

          {/* Huni & Grafik Bölümü */}
          <StatsCharts
            total={metrics.total}
            funnelSteps={funnelSteps}
            temperatureData={temperatureData}
            trendBars={trendBars}
            maxTrendCount={maxTrendCount}
          />

          {/* Ekip Performans İzleme Tablosu — kişi bazlı + dönem + Eğitim/İtiraz/Video % + TOPLAM */}
          <TeamPerformanceTable
            performanceRows={performanceRows}
            getMemberHref={getMemberHref}
            teamStatsLocked={teamStatsLocked}
            teamPulseLocked={!teamPulseUnlocked}
            loading={membersLoading || cLoading}
            progressByUserId={perfProgress?.progressByUserId}
            videoByUserId={perfProgress?.videoByUserId}
          />

          {/* Ekip & Dış Kaynak YZ Kullanım & Limit tablosu Platform Yönetimi'ne taşındı. */}

          {/* Yapay Zeka Günlük Kullanım Kotası */}
          <MyAIUsageQuotaCard usage={usage} dailyLimit={dailyLimit} />

        </div>
      </div>
    </main>
  )
}
