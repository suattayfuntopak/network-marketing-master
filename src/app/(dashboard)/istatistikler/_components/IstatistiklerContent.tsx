'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import { TrendingUp } from 'lucide-react'
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
import { StatsFieldFunnelSection } from './StatsFieldFunnelSection'
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
    queryKey: ['perf-progress', ws?.workspaceId, perfMemberIds.join(',')],
    queryFn: () => getTeamProgressMapAction(ws!.workspaceId, perfMemberIds),
    enabled: !!ws?.workspaceId && perfMemberIds.length > 0 && teamPulseUnlocked,
    staleTime: 2 * 60_000,
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
    // Sabit bucket sayısı → dönem değişince çubuk sayısı sabit kalır (reflow/zıplama yok).
    const BUCKETS = 7
    const now = new Date().getTime()
    const dayMs = 86_400_000

    let start: number
    if (period === 'today') {
      const d = new Date(); d.setHours(0, 0, 0, 0); start = d.getTime()
    } else if (period === '7d') {
      start = now - 7 * dayMs
    } else if (period === '30d') {
      start = now - 30 * dayMs
    } else if (period === 'ytd') {
      start = new Date(new Date().getFullYear(), 0, 1).getTime()
    } else {
      // all: en eski adaydan bugüne (aday yoksa son ~7 gün)
      start = candidates.length
        ? candidates.reduce((m, c) => Math.min(m, new Date(c.created_at).getTime()), now)
        : now - 6 * dayMs
    }

    const span = Math.max(now - start, 3_600_000) // en az 1 saat
    const step = span / BUCKETS

    return Array.from({ length: BUCKETS }, (_, idx) => {
      const bStart = start + idx * step
      const bEnd = idx === BUCKETS - 1 ? now + 1 : start + (idx + 1) * step
      const count = candidates.filter(c => {
        const t = new Date(c.created_at).getTime()
        return t >= bStart && t < bEnd
      }).length

      const dRef = new Date(bStart)
      let label: string
      if (period === 'today') {
        label = dRef.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      } else if (period === '7d') {
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        label = days[(dRef.getDay() + 6) % 7]
      } else if (period === '30d') {
        label = `${dRef.getDate()} ${dRef.toLocaleDateString(undefined, { month: 'short' })}`
      } else {
        label = dRef.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
      }
      return { label, count }
    })
  }, [candidates, period])

  const maxTrendCount = Math.max(...trendBars.map(b => b.count), 1)

  if (wsLoading || cLoading) {
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
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 animate-in fade-in duration-300">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE] dark:bg-[#0a1f4d]">
              <TrendingUp className="h-5 w-5 text-[#1A56DB]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-1)]">
                {t('statsPage.title')}
              </h1>
              <p className="text-base text-[var(--text-3)]">
                {t('statsPage.subtitle')}
              </p>
            </div>
          </div>

          {/* Period Filter — Bugün / Son 7 Gün / Son 30 Gün / Bu Yıl / Tüm Zamanlar */}
          <PulsePeriodTabs period={period} onChange={setPeriod} comfortableTypography />
        </header>

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
