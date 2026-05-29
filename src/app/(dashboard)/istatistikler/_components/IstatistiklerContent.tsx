'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import {
  TrendingUp, Users, Target, Activity, Flame,
  BarChart2, Award, Clock, Crown, Sparkles, Lock
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useTeamMembers, type TeamMember } from '@/hooks/useTeamMembers'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { getIndependentSignupAIUsageAction, getMemberLicenseProfilesAction } from '../actions'

type PeriodOption = '7d' | '30d' | 'all'

type PerformanceRow = TeamMember & { isAppUser: boolean }

export function IstatistiklerContent() {
  const { t, lang } = useTranslation()
  const router = useRouter()
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
  const { data: independentUsage = [], isLoading: independentLoading } = useQuery({
    queryKey: ['independent-ai-usage'],
    queryFn: getIndependentSignupAIUsageAction,
    enabled: !!usage?.isSuperAdmin,
    staleTime: 60_000,
  })

  const teamStatsLocked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)

  const memberUserIds = useMemo(
    () => members.map(m => m.user_id),
    [members]
  )

  const { data: memberLicenses = {} } = useQuery({
    queryKey: ['member-license-profiles', memberUserIds],
    queryFn: () => getMemberLicenseProfilesAction(memberUserIds),
    enabled: !!usage?.isSuperAdmin && memberUserIds.length > 0,
    staleTime: 60_000,
  })

  const limitsForMember = useCallback(
    (member: TeamMember) => {
      const profile = memberLicenses[member.user_id]
      if (!profile) {
        return getLimitsForLicense(
          ws?.licenseType,
          false,
          ws?.licenseExpiresAt,
          ws?.workspaceCreatedAt
        )
      }
      return getLimitsForLicense(
        profile.licenseType,
        profile.isSuperAdmin,
        profile.licenseExpiresAt,
        profile.workspaceCreatedAt
      )
    },
    [memberLicenses, ws?.licenseType, ws?.licenseExpiresAt, ws?.workspaceCreatedAt]
  )

  const memberShowsUnlimited = useCallback(
    (member: TeamMember) => {
      const profile = memberLicenses[member.user_id]
      return !!profile?.isSuperAdmin
    },
    [memberLicenses]
  )

  const [period, setPeriod] = useState<PeriodOption>('30d')

  const formatUsageLimit = useCallback(
    (used: number, limit: number) =>
      Number.isFinite(limit) ? `${used} / ${limit}` : t('statsPage.unlimited'),
    [t]
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (wsLoading || cLoading || membersLoading) {
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
              <h1 className="text-xl font-bold text-[var(--text-1)]">
                {t('statsPage.title')}
              </h1>
              <p className="text-sm text-[var(--text-3)]">
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
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 relative overflow-hidden">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {t('statsPage.kpiTotalLeads')}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--text-1)]">{metrics.total}</span>
                <Users className="h-4 w-4 text-[var(--text-3)] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                {t('statsPage.kpiTotalLeadsDesc')}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {t('statsPage.kpiActiveLeads')}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#534AB7]">{metrics.active}</span>
                <Activity className="h-4 w-4 text-[#534AB7] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                {t('statsPage.kpiActiveLeadsDesc')}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {t('statsPage.kpiConversionRate')}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#065F46]">%{metrics.conversionRate}</span>
                <Award className="h-4 w-4 text-[#065F46] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                {metrics.joined} {t('statsPage.kpiBecameMember')}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {t('statsPage.kpiPresentationRate')}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0369A1]">%{metrics.presentationRate}</span>
                <Target className="h-4 w-4 text-[#0369A1] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                {t('statsPage.kpiPresentationRateDesc')}
              </p>
            </div>
          </div>

          {/* Huni & Grafik Bölümü */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dönüşüm Hunisi */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 h-full">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#1A56DB]" />
                  {t('statsPage.funnelTitle')}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                  {t('statsPage.funnelSubtitle')}
                </p>
              </div>

              {metrics.total === 0 ? (
                <div className="py-16 text-center text-xs text-[var(--text-3)] italic">
                  {t('statsPage.funnelEmpty')}
                </div>
              ) : (
                <div className="space-y-2">
                  {funnelSteps.map((step) => (
                    <div key={step.key} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 shrink-0 text-xs font-semibold text-[var(--text-2)] line-clamp-1">
                          {step.label}
                        </div>
                        {/* Custom Dynamic CSS Bar */}
                        <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                          <div
                            className="h-full rounded-lg transition-all duration-1000 ease-out"
                            style={{
                              backgroundColor: step.color,
                              width: `${Math.max(step.pct, step.count > 0 ? 8 : 0)}%`
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-1)] drop-shadow-sm">
                            {step.count}
                          </span>
                        </div>
                        <div className="w-10 text-right text-xs font-bold text-[var(--text-1)]">
                          %{step.pct}
                        </div>
                      </div>
                      {step.dropFromPrev !== null && step.dropFromPrev > 0 && (
                        <p className="mt-1 pl-28 text-[9px] text-[var(--text-3)] font-medium">
                          ↓ {step.dropFromPrev} {t('statsPage.funnelDropSuffix')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* İvme Grafikleri: Sıcaklık & Mini Trend */}
            <div className="flex flex-col h-full space-y-6">
              
              {/* Sıcaklık Dağılımı Donut */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {t('statsPage.tempTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                    {t('statsPage.tempSubtitle')}
                  </p>
                </div>

                {metrics.total === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-3)] italic">
                    {t('statsPage.tempEmpty')}
                  </div>
                ) : (
                  <div className="flex items-center gap-6 py-4 md:py-6">
                    {/* SVG Concentric Gauge / Ring Chart */}
                    <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                      <svg width="96" height="96" className="transform -rotate-90">
                        {/* Cold Arc */}
                        <circle cx="48" cy="48" r="38" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r="38" stroke="#6B7280" strokeWidth="6" fill="transparent"
                          strokeDasharray="238.7" strokeDashoffset={238.7 - (238.7 * temperatureData.coldPct) / 100} strokeLinecap="round" />
                        
                        {/* Warm Arc */}
                        <circle cx="48" cy="48" r="28" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r="28" stroke="#534AB7" strokeWidth="6" fill="transparent"
                          strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * temperatureData.warmPct) / 100} strokeLinecap="round" />
                        
                        {/* Hot Arc */}
                        <circle cx="48" cy="48" r="18" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r="18" stroke="#C03E1F" strokeWidth="6" fill="transparent"
                          strokeDasharray="113.1" strokeDashoffset={113.1 - (113.1 * temperatureData.hotPct) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <Flame className="h-4 w-4 text-orange-500 mx-auto animate-pulse" />
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#C03E1F]" />
                          <span>{t('statsPage.tempHot')}</span>
                        </div>
                        <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.hotPct} ({temperatureData.hot})</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#534AB7]" />
                          <span>{t('statsPage.tempWarm')}</span>
                        </div>
                        <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.warmPct} ({temperatureData.warm})</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#6B7280]" />
                          <span>{t('statsPage.tempCold')}</span>
                        </div>
                        <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.coldPct} ({temperatureData.cold})</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Büyüme Hızı / Aday Edinme Trendi */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                      <BarChart2 className="h-4 w-4 text-[#4169E1]" />
                      {t('statsPage.velocityTitle')}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                      {t('statsPage.velocitySubtitle')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#4169E1] bg-[#EEF2FF] dark:bg-[#0a0f2e] border border-blue-100/50 dark:border-blue-900/10 px-2 py-0.5 rounded-full">
                    {metrics.total} {t('statsPage.velocityNew')}
                  </span>
                </div>

                {metrics.total === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-3)] italic">
                    {t('statsPage.velocityEmpty')}
                  </div>
                ) : (
                  <div className="flex items-end gap-2 flex-1 pt-6 min-h-[130px] pb-2">
                    {trendBars.map((bar, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-[var(--text-1)]">{bar.count > 0 ? bar.count : ''}</span>
                        <div
                          className={`w-full rounded-t-md transition-all ${bar.count > 0 ? 'bg-[#4169E1]' : 'bg-[#EEF2FF] dark:bg-[#4169E1]/20'}`}
                          style={{ height: `${Math.max((bar.count / maxTrendCount) * 105, bar.count > 0 ? 10 : 2)}px` }}
                        />
                        <span className="text-[9px] font-semibold text-[var(--text-3)] truncate w-full text-center">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>

          </div>

          {/* Ekip Performans Tablosu (Excel tarzı) */}
          <section className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200 overflow-hidden">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand" />
                {t('statsPage.teamTitle')}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                {t('statsPage.teamSubtitle')}
              </p>
            </div>

            {membersLoading || cLoading ? (
              <div className="h-32 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
            ) : performanceRows.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--text-3)] italic">
                {t('statsPage.teamEmpty')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] no-swipe" data-no-swipe="true" onTouchStart={(e) => e.stopPropagation()}>
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                      <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
                      <th className="p-3 font-semibold">{t('statsPage.colRole')}</th>
                      <th className="p-3 font-semibold text-center">{t('statsPage.colType')}</th>
                      <th className="p-3 font-semibold text-center bg-blue-50/20 dark:bg-blue-950/5 text-blue-600 dark:text-blue-400">{t('statsPage.colTotal')}</th>
                      <th className="p-3 font-semibold text-center bg-indigo-50/20 dark:bg-indigo-950/5 text-indigo-600 dark:text-indigo-400">{t('statsPage.colNew')}</th>
                      <th className="p-3 font-semibold text-center bg-sky-50/20 dark:bg-sky-950/5 text-sky-600 dark:text-sky-400">{t('statsPage.colContact')}</th>
                      <th className="p-3 font-semibold text-center bg-red-50/20 dark:bg-red-950/5 text-red-600 dark:text-red-400">{t('statsPage.colInvite')}</th>
                      <th className="p-3 font-semibold text-center bg-cyan-50/20 dark:bg-sky-950/5 text-cyan-600 dark:text-cyan-400">{t('statsPage.colPresentation')}</th>
                      <th className="p-3 font-semibold text-center bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400">{t('statsPage.colFollowUp')}</th>
                      <th className="p-3 font-semibold text-center bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400">{t('statsPage.colJoined')}</th>
                      <th className="p-3 font-semibold text-center bg-purple-50/20 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 whitespace-nowrap">
                        {t('statsPage.colDqsg')}<sup>*</sup>
                      </th>
                      <th className="p-3 font-semibold text-right">{t('statsPage.colLastActive')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
                    {performanceRows.map(m => {
                      const isLeader = m.role === 'leader'
                      const isAppUser = m.isAppUser !== false
                      const lastActive = m.last_activity_at ? new Date(m.last_activity_at) : null
                      const doneCount = m.onboarding_steps?.length ?? 0
                      const onboardingPct = isLeader ? 100 : Math.min(100, Math.round((doneCount / 9) * 100))
                      const detailHref = getMemberHref(m)
                      return (
                        <tr
                          key={m.user_id}
                          onClick={detailHref ? () => router.push(detailHref) : undefined}
                          className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${detailHref ? 'cursor-pointer' : ''} ${isLeader ? 'font-bold bg-amber-50/5 dark:bg-amber-950/5' : ''} ${!isAppUser ? 'opacity-70' : ''}`}
                        >
                          <td className="p-3 flex items-center gap-2 whitespace-nowrap">

                            {m.avatar_url ? (
                              <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
                                <img src={m.avatar_url} alt={m.full_name ?? ''} className="h-full w-full object-cover" />
                                {isLeader && <Crown className="absolute -top-1 -right-1 h-3 w-3 text-[#854F0B] bg-white rounded-full p-[1px]" strokeWidth={2.5} />}
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
                          <td className="p-3 text-center">
                            {isLeader ? null : isAppUser ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 text-[9px] font-black text-purple-700 dark:text-purple-400 whitespace-nowrap">
                                💎 {t('statsPage.typeNmm')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 text-[9px] font-black text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                🤝 {t('statsPage.typeField')}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-black tabular-nums bg-blue-50/10 dark:bg-blue-950/5 text-blue-600 dark:text-blue-400">{isAppUser ? m.candidate_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-indigo-50/10 dark:bg-indigo-950/5 text-indigo-600 dark:text-indigo-400 font-semibold">{isAppUser ? m.yeni_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-sky-50/10 dark:bg-sky-950/5 text-sky-600 dark:text-sky-400 font-semibold">{isAppUser ? m.iletisim_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-red-50/10 dark:bg-red-950/5 text-red-600 dark:text-red-400 font-semibold">{isAppUser ? m.davetli_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-cyan-50/10 dark:bg-sky-950/5 text-cyan-600 dark:text-cyan-400 font-semibold">{isAppUser ? m.sunum_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-amber-50/10 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400 font-semibold">{isAppUser ? m.takip_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-emerald-50/10 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400 font-black">{isAppUser ? m.katildi_count : '—'}</td>
                          <td className="p-3 text-center tabular-nums bg-purple-50/10 dark:bg-purple-950/5 text-purple-700 dark:text-purple-400 font-black">{isAppUser ? `%${onboardingPct}` : '—'}</td>
                          <td className="p-3 text-right text-[11px] text-[var(--text-2)] font-medium truncate">
                            {lastActive ? lastActive.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-[10px] font-bold text-[var(--text-3)] select-none pl-1 mt-1">
              * {t('statsPage.dqsgFootnote')}
            </div>

            {teamStatsLocked && performanceRows.length > 0 && (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#534AB7]/25 via-[#7c3aed]/15 to-emerald-500/10 backdrop-blur-xl backdrop-saturate-150 px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                aria-hidden={false}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-indigo-200 shadow-lg">
                  <Lock className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="max-w-sm space-y-1">
                  <p className="text-sm font-bold text-[var(--text-1)]">{t('statsPage.teamLockedTitle')}</p>
                  <p className="text-xs leading-relaxed text-[var(--text-2)]">{t('statsPage.teamLockedDesc')}</p>
                </div>
                <Link
                  href="/odeme"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  {t('statsPage.teamLockedCta')}
                </Link>
              </div>
            )}
          </section>

          {/* Ekip + Dış Kayıt YZ masaları (SADECE SÜPER ADMİN) */}
          {usage?.isSuperAdmin && (
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

              <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]" onTouchStart={(e) => e.stopPropagation()}>
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
                      const detailHref = getMemberHref(m)
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
                                {isLeader && <Crown className="absolute -top-1 -right-1 h-3 w-3 text-[#854F0B] bg-white rounded-full p-[1px]" strokeWidth={2.5} />}
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
                <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]" onTouchStart={(e) => e.stopPropagation()}>
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
                        <tr
                          key={row.userId}
                          className="hover:bg-[var(--bg-subtle)]/75 transition-colors"
                        >
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
            </>
          )}

          {/* Yapay Zeka Günlük Kullanım Kotası */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFBEB] dark:bg-[#201600]">
                <Sparkles className="h-4 w-4 text-[#D97706]" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-1)]">
                  {t('statsPage.quotaTitle')}
                </h2>
                <p className="text-[11px] text-[var(--text-3)]">
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
                    <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      {t('statsPage.quotaSuperTitle')}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--text-2)] font-semibold">
                      {t('statsPage.quotaSuperDesc')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard User progress bars - Beautiful 3-column layout */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
                {/* 1. Yapay Zeka Koçu */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-1)]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#534AB7]" />
                      {t('statsPage.quotaCoach')}
                    </span>
                    <span className="font-extrabold text-[var(--text-2)] tabular-nums">
                      {Math.max(0, roleplayLimit - (usage?.roleplayUsed ?? 0))} / {roleplayLimit} {t('statsPage.quotaLeft')}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#534AB7] transition-all duration-500"
                      style={{ width: `${roleplayLimit > 0 ? Math.min(100, (Math.max(0, roleplayLimit - (usage?.roleplayUsed ?? 0)) / roleplayLimit) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* 2. YZ Mesajı Üret */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-1)]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#0F6E56]" />
                      {t('statsPage.quotaWriter')}
                    </span>
                    <span className="font-extrabold text-[var(--text-2)] tabular-nums">
                      {Math.max(0, messageLimit - (usage?.messageUsed ?? 0))} / {messageLimit} {t('statsPage.quotaLeft')}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F6E56] transition-all duration-500"
                      style={{ width: `${messageLimit > 0 ? Math.min(100, (Math.max(0, messageLimit - (usage?.messageUsed ?? 0)) / messageLimit) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* 3. Uyum Denetimi */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-1)]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#C03E1F]" />
                      {t('statsPage.quotaCompliance')}
                    </span>
                    <span className="font-extrabold text-[var(--text-2)] tabular-nums">
                      {complianceLimit > 0 ? `${Math.max(0, complianceLimit - (usage?.complianceUsed ?? 0))} / ${complianceLimit}` : t('statsPage.quotaUpgrade')} {complianceLimit > 0 ? t('statsPage.quotaLeft') : ''}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C03E1F] transition-all duration-500"
                      style={{ width: `${complianceLimit > 0 ? Math.min(100, (Math.max(0, complianceLimit - (usage?.complianceUsed ?? 0)) / complianceLimit) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Bilgi Notu */}
          <section className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <Clock className="h-4 w-4 shrink-0 text-[var(--text-3)] mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[var(--text-3)] font-semibold">
              {t('statsPage.infoNote')}
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
