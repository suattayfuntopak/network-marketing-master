'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import {
  TrendingUp, Clock
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useTeamMembers, type TeamMember } from '@/hooks/useTeamMembers'
import { formatAIUsageDisplay, getLimitsForLicense } from '@/lib/domain/aiUsage'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { StatsKpiCards } from './StatsKpiCards'
import { StatsCharts } from './StatsCharts'
import { TeamPerformanceTable } from './TeamPerformanceTable'
import { MyAIUsageQuotaCard } from './MyAIUsageQuotaCard'
import { PulseMySection } from '@/app/(dashboard)/_components/pulse/PulseMySection'
import { PulseTeamSection } from '@/app/(dashboard)/_components/pulse/PulseTeamSection'
import { PulseTeamTotalsSection } from '@/app/(dashboard)/_components/pulse/PulseTeamTotalsSection'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
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

type PeriodOption = '7d' | '30d' | 'all'

type PerformanceRow = TeamMember & { isAppUser: boolean }

export function IstatistiklerContent() {
  const { t, lang } = useTranslation()
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
  const { messageLimit, roleplayLimit, complianceLimit } = teamLimits
  const teamStatsLocked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)
  const teamPulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)

  const [period, setPeriod] = useState<PeriodOption>('30d')

  const formatUsageLimit = useCallback(
    (used: number, limit: number) => formatAIUsageDisplay(used, limit, lang),
    [lang]
  )

  const licenseLabel = useCallback(
    (licenseType: string) => {
      switch (licenseType) {
        case 'pro':
          return t('statsPage.licensePlanPro')
        case 'master':
          return t('statsPage.licensePlanMaster')
        case 'leader':
          return t('statsPage.licensePlanLeader')
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

  // 1. Adayları seçilen periyoda göre filtrele
  const filteredCandidates = useMemo(() => {
    if (period === 'all') return candidates

    const now = new Date()
    const cutoff = new Date()
    if (period === '7d') {
      cutoff.setDate(now.getDate() - 7)
    } else {
      cutoff.setDate(now.getDate() - 30)
    }
    cutoff.setHours(0, 0, 0, 0)

    return candidates.filter(c => {
      const createdAt = new Date(c.created_at)
      return createdAt >= cutoff
    })
  }, [candidates, period])

  // 2. Özet Metrikleri Hesaplama
  const metrics = useMemo(() => {
    const total = filteredCandidates.length
    const active = filteredCandidates.filter(c => ACTIVE_STAGES.includes(c.stage)).length
    const joined = filteredCandidates.filter(c => c.stage === 'katildi').length
    
    // Dönüşüm Oranı (Katıldı / Toplam Aday)
    const conversionRate = total > 0 ? Math.round((joined / total) * 100) : 0

    // Sunum Yapılan Aday Oranı (Sunum / Toplam Aday)
    const presentedCount = filteredCandidates.filter(c => 
      ['sunum', 'takip', 'kararsiz', 'katildi'].includes(c.stage)
    ).length
    const presentationRate = total > 0 ? Math.round((presentedCount / total) * 100) : 0

    return { total, active, joined, conversionRate, presentationRate }
  }, [filteredCandidates])

  // 3. Sıcaklık Dağılımını Hesaplama (Concentric Circle/Donut Data)
  const temperatureData = useMemo(() => {
    const total = filteredCandidates.length
    if (total === 0) return { hot: 0, warm: 0, cold: 0, hotPct: 0, warmPct: 0, coldPct: 0 }

    const hot = filteredCandidates.filter(c => HOT_STAGES.includes(c.stage)).length
    const warm = filteredCandidates.filter(c => ['yeni', 'iletisim', 'kararsiz'].includes(c.stage)).length
    const cold = filteredCandidates.filter(c => ['ilgilenmedi', 'kayboldu', 'pasif'].includes(c.stage)).length

    return {
      hot,
      warm,
      cold,
      hotPct: Math.round((hot / total) * 100),
      warmPct: Math.round((warm / total) * 100),
      coldPct: Math.round((cold / total) * 100),
    }
  }, [filteredCandidates])

  // 4. Dönüşüm Hunisi Kademelerini Hesaplama (Cumulative Waterfall Funnel)
  const funnelSteps = useMemo(() => {
    const total = filteredCandidates.length
    
    // 1. Yeni Aday (Tüm adaylar huninin ağzına girer)
    const step1 = total

    // 2. İletişim Kurulan (Yeni aday aşamasından ileri taşınmışlar)
    const step2 = filteredCandidates.filter(c => c.stage !== 'yeni').length

    // 3. Davet Edilen (İletişim aşamasını da geçmişler)
    const step3 = filteredCandidates.filter(c => !['yeni', 'iletisim'].includes(c.stage)).length

    // 4. Sunum Yapılan (Sunum ve sonrası)
    const step4 = filteredCandidates.filter(c => 
      ['sunum', 'takip', 'kararsiz', 'katildi'].includes(c.stage)
    ).length

    // 5. Takip Edilen (Takip ve sonrası)
    const step5 = filteredCandidates.filter(c => 
      ['takip', 'kararsiz', 'katildi'].includes(c.stage)
    ).length

    // 6. İş Ortağı (Katılanlar)
    const step6 = filteredCandidates.filter(c => c.stage === 'katildi').length

    const steps = [
      { key: 'yeni',      label: t('statsPage.funnelTotalLeads'),          count: step1, color: '#534AB7' },
      { key: 'iletisim',  label: t('statsPage.funnelContacted'),     count: step2, color: '#4169E1' },
      { key: 'davetli',   label: t('statsPage.funnelInvited'),         count: step3, color: '#C03E1F' },
      { key: 'sunum',     label: t('statsPage.funnelPresented'),        count: step4, color: '#0369A1' },
      { key: 'takip',     label: t('statsPage.funnelFollowUp'),         count: step5, color: '#854F0B' },
      { key: 'katildi',   label: t('statsPage.funnelJoinedPartner'),  count: step6, color: '#065F46' },
    ]

    return steps.map((step, idx) => {
      const pct = total > 0 ? Math.round((step.count / total) * 100) : 0
      const dropFromPrev = idx === 0 ? null : steps[idx - 1].count - step.count
      return { ...step, pct, dropFromPrev }
    })
  }, [filteredCandidates, lang])

  // 5. Kayıt Trendi Barları (MiniTrend benzeri)
  const trendBars = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const length = period === '7d' ? 7 : period === '30d' ? 6 : 8
    const intervalDays = period === '7d' ? 1 : period === '30d' ? 5 : 30

    return Array.from({ length }, (_, idx) => {
      const endOffset = (length - 1 - idx) * intervalDays
      const startOffset = endOffset + intervalDays
      
      const dStart = new Date(today)
      dStart.setDate(dStart.getDate() - startOffset)
      const dEnd = new Date(today)
      dEnd.setDate(dEnd.getDate() - endOffset)
      
      const count = candidates.filter(c => {
        const t = new Date(c.created_at)
        return t >= dStart && t < dEnd
      }).length

      let label = ''
      if (period === '7d') {
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        const dayIdx = (dEnd.getDay() + 6) % 7
        label = days[dayIdx]
      } else if (period === '30d') {
        label = `${dEnd.getDate()} ${dEnd.toLocaleDateString(undefined, { month: 'short' })}`
      } else {
        label = dEnd.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
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

          {/* Period Filter */}
          <div className="flex rounded-xl bg-[var(--bg-subtle)] p-0.5 border border-[var(--border)] self-start sm:self-auto">
            {(['7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-all cursor-pointer ${
                  period === p
                    ? 'bg-[var(--bg-card)] text-[#1A56DB] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
                }`}
              >
                {p === '7d' && t('statsPage.period7d')}
                {p === '30d' && t('statsPage.period30d')}
                {p === 'all' && t('statsPage.periodAll')}
              </button>
            ))}
          </div>
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

          {/* Ekip Performans Tablosu (Excel tarzı) */}
          <TeamPerformanceTable
            performanceRows={performanceRows}
            getMemberHref={getMemberHref}
            teamStatsLocked={teamStatsLocked}
            loading={membersLoading || cLoading}
          />

          <PulseTeamSection members={pulseMemberRows} getMemberHref={getMemberHref} />

          <PulseTeamTotalsSection members={pulseMemberRows} />

          {teamPulseUnlocked && (
            <p className="text-xs text-[var(--text-3)] px-1">{t('statsPage.realtimePulseNote')}</p>
          )}

          {usage?.isSuperAdmin && (
            <StatsSuperAdminSections
              sortedMembers={sortedMembers}
              getMemberHref={getMemberHref}
              formatUsageLimit={formatUsageLimit}
              licenseLabel={licenseLabel}
              workspaceLicenseType={ws?.licenseType}
              workspaceExpiresAt={ws?.licenseExpiresAt}
              workspaceCreatedAt={ws?.workspaceCreatedAt}
            />
          )}

          <PulseMySection comfortableTypography />

          {/* Yapay Zeka Günlük Kullanım Kotası */}
          <MyAIUsageQuotaCard
            usage={usage}
            messageLimit={messageLimit}
            roleplayLimit={roleplayLimit}
            complianceLimit={complianceLimit}
          />

          {/* Bilgi Notu */}
          <section className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <Clock className="h-4 w-4 shrink-0 text-[var(--text-3)] mt-0.5" />
            <p className="text-sm leading-relaxed text-[var(--text-3)] font-semibold">
              {t('statsPage.infoNote')}
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
