'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import { BarChart3 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useCandidateStats } from '@/hooks/useCandidateStats'
import { useTeamMembers, type TeamMember } from '@/hooks/useTeamMembers'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { StatsKpiCards } from './StatsKpiCards'
import { StatsCharts } from './StatsCharts'
import { TeamPerformanceTable } from './TeamPerformanceTable'
import { MyAIUsageQuotaCard } from './MyAIUsageQuotaCard'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { getTeamProgressMapAction } from '@/app/(dashboard)/pulse/actions'
import { mapStatsPeriodToSheet } from '@/lib/domain/pulse'
import { MemberActivitySheet, type MemberActivityTarget } from '@/app/(dashboard)/_components/team/MemberActivitySheet'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { PulsePeriodTabs } from '@/app/(dashboard)/_components/pulse/PulsePeriodTabs'
import type { MemberRow } from '@/lib/team/types'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

const StatsSuperAdminSections = dynamic(
  () => import('./StatsSuperAdminSections').then(m => ({ default: m.StatsSuperAdminSections })),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    ),
  }
)


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
  const teamStatsLocked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)
  const teamPulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)
  const canEditMemberGoal = ws?.role === 'leader' && !teamStatsLocked

  const [period, setPeriod] = useState<PulsePeriod>('30d')
  const [activityMember, setActivityMember] = useState<MemberActivityTarget | null>(null)


  const licenseLabel = useCallback(
    (licenseType: string) => {
      switch (licenseType) {
        case 'pro':
          return t('statsPage.licensePlanPro')
        case 'plus':
          return t('statsPage.licensePlanPlus')
        case 'basic':
          return t('statsPage.licensePlanBasic')
        default:
          return t('statsPage.licensePlanFree')
      }
    },
    [t]
  )

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
    enabled: !!ws?.workspaceId && perfMemberIds.length > 0 && teamPulseUnlocked,
    staleTime: QUERY_STALE.metrics,
  })

  // Turkish-aware name normalizer — must match EkipPanel's cleanStr
  const cleanStr = (s: string | null | undefined) => (s ?? '')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

  // Non-NMM "Saha Ortakları": katildi candidates not matched to any workspace member
  const sahaOrtaklari = useMemo(() => {
    return candidates
      .filter(c => c.stage === 'katildi')
      .filter(c => !sortedMembers.some(m => {
        const mf = cleanStr(m.full_name)
        const cf = cleanStr(c.full_name)
        if (!mf || !cf) return false
        if (mf.includes(cf) || cf.includes(mf)) return true
        const mWords = (m.full_name ?? '').split(/\s+/).map((w: string) => cleanStr(w)).filter((w: string) => w.length >= 3)
        return mWords.some((w: string) => cf.includes(w))
      }))
  }, [candidates, sortedMembers])

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

  // Saha satırları — Ekip & Dış Kaynak YZ tablosu için (kişi bazlı, YZ kullanımı yok).
  const sahaRows = useMemo(
    () =>
      sahaOrtaklari.map(c => ({
        id: c.id,
        full_name: c.full_name,
        avatar_url: resolveCandidateFields(c).avatarUrl,
      })),
    [sahaOrtaklari]
  )

  // Person detail page = candidate detail (/pipeline/[id]). Saha rows ARE candidates;
  // NMM members are matched to the leader's own candidate by name.
  const leaderOwnerId = useMemo(
    () => sortedMembers.find(m => m.role === 'leader')?.user_id ?? null,
    [sortedMembers]
  )
  const getMemberHref = (row: { user_id: string; full_name: string | null; isAppUser?: boolean }): string | null => {
    if (row.isAppUser === false) return `/pipeline/${row.user_id}`
    const matchedId = leaderOwnerId
      ? findLeaderCandidateForMember(candidates, leaderOwnerId, row.full_name)
      : null
    return matchedId ? `/pipeline/${matchedId}` : null
  }

  const { metrics, temperatureData, funnelSteps } = useCandidateStats(
    candidates,
    period,
    t,
  )

  // 5. Kayıt Trendi Barları (MiniTrend benzeri)
  const trendBars = useMemo(() => {
    const ISTANBUL_OFFSET = 3 * 60 * 60 * 1000
    const monthsTr = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

    // Get Istanbul current date components (UTC+3) using pure now state
    const todayIst = new Date(now + ISTANBUL_OFFSET)
    const todayYear = todayIst.getUTCFullYear()
    const todayMonth = todayIst.getUTCMonth()
    const todayDate = todayIst.getUTCDate()

    if (period === '30d') {
      // Monthly: Trailing 30 days (1 month ago date-wise in UTC+3 to today)
      // e.g. 11 May to 11 June
      const startDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDate))
      const endDate = new Date(Date.UTC(todayYear, todayMonth, todayDate))

      const dates: Date[] = []
      const curr = new Date(startDate)
      while (curr <= endDate) {
        dates.push(new Date(curr))
        curr.setUTCDate(curr.getUTCDate() + 1)
      }

      return dates.map(date => {
        const count = candidates.filter(c => {
          const cDate = new Date(new Date(c.created_at).getTime() + ISTANBUL_OFFSET)
          return (
            cDate.getUTCFullYear() === date.getUTCFullYear() &&
            cDate.getUTCMonth() === date.getUTCMonth() &&
            cDate.getUTCDate() === date.getUTCDate()
          )
        }).length

        return {
          label: `${date.getUTCDate()} ${monthsTr[date.getUTCMonth()]}`,
          count,
        }
      })
    }

    if (period === 'ytd') {
      // Yearly: From January of current year up to current month of current year (UTC+3)
      const monthlyBars = []
      for (let m = 0; m <= todayMonth; m++) {
        const count = candidates.filter(c => {
          const cDate = new Date(new Date(c.created_at).getTime() + ISTANBUL_OFFSET)
          return cDate.getUTCFullYear() === todayYear && cDate.getUTCMonth() === m
        }).length

        monthlyBars.push({
          label: monthsTr[m],
          count,
        })
      }
      return monthlyBars
    }

    // Default legacy/bucket logic for other periods, aligned with Istanbul Time
    const BUCKETS = 7
    const dayMs = 86_400_000

    let start: number
    if (period === 'today') {
      const d = new Date(now + ISTANBUL_OFFSET)
      const startOfDayIst = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
      start = startOfDayIst.getTime() - ISTANBUL_OFFSET
    } else if (period === '7d') {
      const dates7d: Date[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.UTC(todayYear, todayMonth, todayDate))
        d.setUTCDate(d.getUTCDate() - i)
        dates7d.push(d)
      }
      return dates7d.map(date => {
        const count = candidates.filter(c => {
          const cDate = new Date(new Date(c.created_at).getTime() + ISTANBUL_OFFSET)
          return (
            cDate.getUTCFullYear() === date.getUTCFullYear() &&
            cDate.getUTCMonth() === date.getUTCMonth() &&
            cDate.getUTCDate() === date.getUTCDate()
          )
        }).length

        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        const dayIdx = (date.getUTCDay() + 6) % 7
        return {
          label: days[dayIdx],
          count,
        }
      })
    } else {
      // all: earliest candidate date in Istanbul to now
      start = candidates.length
        ? candidates.reduce((m, c) => Math.min(m, new Date(c.created_at).getTime()), now)
        : now - 6 * dayMs
    }

    const span = Math.max(now - start, 3_600_000)
    const step = span / BUCKETS

    return Array.from({ length: BUCKETS }, (_, idx) => {
      const bStart = start + idx * step
      const bEnd = idx === BUCKETS - 1 ? now + 1 : start + (idx + 1) * step
      const count = candidates.filter(c => {
        const t = new Date(c.created_at).getTime()
        return t >= bStart && t < bEnd
      }).length

      const dRef = new Date(bStart + ISTANBUL_OFFSET)
      let label: string
      if (period === 'today') {
        label = dRef.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      } else {
        label = dRef.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' })
      }
      return { label, count }
    })
  }, [candidates, period, now])

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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
              <BarChart3 className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-1)]">
                {t('statsPage.title')}
              </h1>
            </div>
          </div>

          {/* Period Filter — Bugün / Son 7 Gün / Son 30 Gün / Bu Yıl / Tüm Zamanlar */}
          <PulsePeriodTabs period={period} onChange={setPeriod} comfortableTypography />
        </header>

        <div className="space-y-6">
          {/* KPI Cards */}
          <StatsKpiCards metrics={metrics} />

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

          {usage?.isSuperAdmin && (
            <StatsSuperAdminSections
              sortedMembers={sortedMembers}
              sahaRows={sahaRows}
              getMemberHref={getMemberHref}
              licenseLabel={licenseLabel}
            />
          )}

          {/* Yapay Zeka Günlük Kullanım Kotası */}
          <MyAIUsageQuotaCard usage={usage} dailyLimit={dailyLimit} />

        </div>
      </div>

      {activityMember && ws && (
        <MemberActivitySheet
          workspaceId={ws.workspaceId}
          member={activityMember}
          initialPeriod={mapStatsPeriodToSheet(period)}
          teamPulseUnlocked={teamPulseUnlocked}
          canEditGoal={canEditMemberGoal}
          onClose={() => setActivityMember(null)}
        />
      )}
    </main>
  )
}
