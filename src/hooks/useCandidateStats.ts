'use client'

import { useMemo } from 'react'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import type { PulsePeriod } from '@/lib/domain/pulse'
import type { CandidateStage } from '@/types/database.types'

/** Aday listesinden dönem metrikleri — İstatistikler sayfası; Akademi vb. için de kullanılabilir. */
export type CandidateStatsRow = {
  stage: CandidateStage
  created_at: string
}

export function filterCandidatesByPeriod<T extends CandidateStatsRow>(
  candidates: T[],
  period: PulsePeriod,
): T[] {
  if (period === 'all') return candidates

  const now = new Date()
  let cutoff: Date
  if (period === 'ytd') {
    cutoff = new Date(now.getFullYear(), 0, 1)
  } else {
    cutoff = new Date()
    if (period === '7d') cutoff.setDate(now.getDate() - 7)
    else if (period === '30d') cutoff.setDate(now.getDate() - 30)
    cutoff.setHours(0, 0, 0, 0)
  }

  return candidates.filter(c => new Date(c.created_at) >= cutoff)
}

export function useCandidateStats(
  candidates: CandidateStatsRow[],
  period: PulsePeriod,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  const filteredCandidates = useMemo(
    () => filterCandidatesByPeriod(candidates, period),
    [candidates, period],
  )

  const metrics = useMemo(() => {
    const total = filteredCandidates.length
    const active = filteredCandidates.filter(c => ACTIVE_STAGES.includes(c.stage)).length
    const joined = filteredCandidates.filter(c => c.stage === 'katildi').length
    const conversionRate = total > 0 ? Math.round((joined / total) * 100) : 0
    const presentedCount = filteredCandidates.filter(c =>
      ['sunum', 'takip', 'kararsiz', 'katildi'].includes(c.stage),
    ).length
    const presentationRate = total > 0 ? Math.round((presentedCount / total) * 100) : 0

    return { total, active, joined, conversionRate, presentationRate }
  }, [filteredCandidates])

  const temperatureData = useMemo(() => {
    const total = filteredCandidates.length
    if (total === 0) return { hot: 0, warm: 0, cold: 0, hotPct: 0, warmPct: 0, coldPct: 0 }

    const hot = filteredCandidates.filter(c => HOT_STAGES.includes(c.stage)).length
    const warm = filteredCandidates.filter(c => ['yeni', 'iletisim', 'kararsiz'].includes(c.stage)).length
    const cold = filteredCandidates.filter(c =>
      ['ilgilenmedi', 'kayboldu', 'pasif'].includes(c.stage),
    ).length

    return {
      hot,
      warm,
      cold,
      hotPct: Math.round((hot / total) * 100),
      warmPct: Math.round((warm / total) * 100),
      coldPct: Math.round((cold / total) * 100),
    }
  }, [filteredCandidates])

  const funnelSteps = useMemo(() => {
    const total = filteredCandidates.length
    const step1 = total
    const step2 = filteredCandidates.filter(c => c.stage !== 'yeni').length
    const step3 = filteredCandidates.filter(c => !['yeni', 'iletisim'].includes(c.stage)).length
    const step4 = filteredCandidates.filter(c =>
      ['sunum', 'takip', 'kararsiz', 'katildi'].includes(c.stage),
    ).length
    const step5 = filteredCandidates.filter(c =>
      ['takip', 'kararsiz', 'katildi'].includes(c.stage),
    ).length
    const step6 = filteredCandidates.filter(c => c.stage === 'katildi').length

    const steps = [
      { key: 'yeni', label: t('statsPage.funnelTotalLeads'), count: step1, color: '#534AB7' },
      { key: 'iletisim', label: t('statsPage.funnelContacted'), count: step2, color: '#4169E1' },
      { key: 'davetli', label: t('statsPage.funnelInvited'), count: step3, color: '#C03E1F' },
      { key: 'sunum', label: t('statsPage.funnelPresented'), count: step4, color: '#0369A1' },
      { key: 'takip', label: t('statsPage.funnelFollowUp'), count: step5, color: '#854F0B' },
      { key: 'katildi', label: t('statsPage.funnelJoinedPartner'), count: step6, color: '#065F46' },
    ]

    return steps.map((step, idx) => {
      const pct = total > 0 ? Math.round((step.count / total) * 100) : 0
      const dropFromPrev = idx === 0 ? null : steps[idx - 1].count - step.count
      return { ...step, pct, dropFromPrev }
    })
  }, [filteredCandidates, t])

  return { filteredCandidates, metrics, temperatureData, funnelSteps }
}
