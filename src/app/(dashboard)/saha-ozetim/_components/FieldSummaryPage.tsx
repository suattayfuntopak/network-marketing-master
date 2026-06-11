'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { HubPeriodNavigator } from '@/components/hub/HubPeriodNavigator'
import { HubDayLoginStrip } from '@/components/hub/HubDayLoginStrip'
import { HubWeekLoginStrip } from '@/components/hub/HubWeekLoginStrip'
import { HubMonthHero } from '@/components/hub/HubMonthHero'
import { HubYearHero } from '@/components/hub/HubYearHero'
import { HubCrownFunnelGrid } from '@/components/hub/HubCrownFunnelGrid'
import { HubSelfActivityGrid } from '@/components/hub/HubSelfActivityGrid'
import {
  HubSummaryTabBar,
  hubPeriodTabLabel,
} from '@/components/hub/HubSummaryTabBar'
import type { HubPeriodTab } from '@/lib/domain/hubPeriodPrefetch'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'
import {
  getHubDailySelfAction,
  getHubMonthlySelfAction,
  getHubWeeklySelfAction,
  getHubYearlySelfAction,
  type HubSelfFieldMetrics,
} from '@/app/(dashboard)/crown/hubSelfActions'
import { queryKeys } from '@/lib/query/keys'
import {
  calendarDayRange,
  rollingWeekRange,
  yearRange,
} from '@/lib/utils/hubPeriodRange'
import { HubPeriodProvider, useHubPeriodNavigation } from '@/components/hub/useHubPeriodNavigation'
import { writeStoredHubActiveTab } from '@/lib/domain/hubPeriodPrefetch'

const EMPTY_METRICS: HubSelfFieldMetrics = {
  calls: 0,
  whatsapps: 0,
  notes: 0,
  stageChanges: 0,
  aiActions: 0,
  newCandidates: 0,
  activeDays: 0,
  totalActions: 0,
}

const ACCENT = {
  daily: 'border-teal-300/50 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-950/25',
  weekly: 'border-violet-300/50 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-950/25',
  monthly: 'border-pink-300/50 bg-pink-50 dark:border-pink-500/30 dark:bg-pink-950/25',
  yearly: 'border-amber-300/50 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/25',
} as const

/** Aktif sekmenin verilen offset'i için query anahtarı + fetcher (tip silinmiş). */
function hubQueryFor(
  tab: HubPeriodTab,
  o: number,
): { key: readonly unknown[]; fn: () => Promise<unknown> } {
  if (tab === 'daily') return { key: queryKeys.hubDailySelf(o), fn: () => getHubDailySelfAction(o) }
  if (tab === 'weekly') return { key: queryKeys.hubWeeklySelf(o), fn: () => getHubWeeklySelfAction(o) }
  if (tab === 'monthly') return { key: queryKeys.hubMonthlySelf(o), fn: () => getHubMonthlySelfAction(o) }
  return { key: queryKeys.hubYearlySelf(o), fn: () => getHubYearlySelfAction(o) }
}

function FieldSummaryInner() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { tab, offset, setTab, goToCurrentPeriod } = useHubPeriodNavigation()

  useEffect(() => {
    writeStoredHubActiveTab(tab)
  }, [tab])

  // Komşu dönemleri (önceki/şu an/sonraki) önbelleğe ısıt → şerit durduğunda veya
  // ok'a basıldığında metrikler önbellekten ANINDA gelir (MemberActivitySheet modeli).
  useEffect(() => {
    for (const o of [offset - 1, offset, offset + 1]) {
      const { key, fn } = hubQueryFor(tab, o)
      void queryClient.prefetchQuery({ queryKey: key, queryFn: fn, staleTime: 60_000 })
    }
  }, [tab, offset, queryClient])

  const dayRange = calendarDayRange(offset)
  const weekRange = rollingWeekRange(offset)
  const yearRangeData = yearRange(offset)

  const hubCachedPlaceholder = <T,>(key: readonly unknown[]) => (prev: T | undefined) =>
    queryClient.getQueryData<T>(key) ?? prev

  const { data: dailySelf, isLoading: dailyLoading } = useQuery({
    queryKey: queryKeys.hubDailySelf(offset),
    queryFn: () => getHubDailySelfAction(offset),
    staleTime: 60_000,
    placeholderData: hubCachedPlaceholder(queryKeys.hubDailySelf(offset)),
    enabled: tab === 'daily',
  })

  const { data: weeklySelf, isLoading: weeklyLoading } = useQuery({
    queryKey: queryKeys.hubWeeklySelf(offset),
    queryFn: () => getHubWeeklySelfAction(offset),
    staleTime: 60_000,
    placeholderData: hubCachedPlaceholder(queryKeys.hubWeeklySelf(offset)),
    enabled: tab === 'weekly',
  })

  const { data: monthlySelf, isLoading: monthlyLoading } = useQuery({
    queryKey: queryKeys.hubMonthlySelf(offset),
    queryFn: () => getHubMonthlySelfAction(offset),
    staleTime: 60_000,
    placeholderData: hubCachedPlaceholder(queryKeys.hubMonthlySelf(offset)),
    enabled: tab === 'monthly',
  })

  const { data: yearlySelf, isLoading: yearlyLoading } = useQuery({
    queryKey: queryKeys.hubYearlySelf(offset),
    queryFn: () => getHubYearlySelfAction(offset),
    staleTime: 60_000,
    placeholderData: hubCachedPlaceholder(queryKeys.hubYearlySelf(offset)),
    enabled: tab === 'yearly',
  })

  const dailyActuals = dailySelf?.dailyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

  const weekActive = weeklySelf?.weekActive ?? Array.from({ length: 7 }, () => false)
  const weekLoginDays = Math.min(7, weeklySelf?.loginDays ?? weekActive.filter(Boolean).length)

  function renderBody() {
    if (tab === 'daily') {
      const loading = dailyLoading && !dailySelf
      return (
        <>
          <HubPeriodNavigator mode="day" accentClass={ACCENT.daily} />
          <HubDayLoginStrip loading={loading} dayDate={dayRange.date} />
          <HubCrownFunnelGrid
            actuals={dailyActuals}
            targets={dailySelf?.dailyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            hasGoal={dailySelf?.hasGoal ?? false}
            period="daily"
            loading={loading}
            panoVariant
          />
          <HubSelfActivityGrid
            metrics={dailySelf?.fieldMetrics ?? EMPTY_METRICS}
            loading={loading}
            panoVariant
          />
        </>
      )
    }

    if (tab === 'weekly') {
      const loading = weeklyLoading && !weeklySelf
      return (
        <>
          <HubPeriodNavigator mode="week" accentClass={ACCENT.weekly} />
          <HubWeekLoginStrip
            weekActive={weekActive}
            loginDays={weekLoginDays}
            loading={loading}
            weekEnd={weekRange.endDate}
          />
          <HubCrownFunnelGrid
            actuals={weeklySelf?.weeklyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            targets={weeklySelf?.weeklyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            hasGoal={weeklySelf?.hasGoal ?? false}
            period="weekly"
            loading={loading}
            panoVariant
          />
          <HubSelfActivityGrid
            metrics={weeklySelf?.fieldMetrics ?? EMPTY_METRICS}
            loading={loading}
            panoVariant
          />
        </>
      )
    }

    if (tab === 'monthly') {
      const loading = monthlyLoading && !monthlySelf
      return (
        <>
          <HubPeriodNavigator mode="month" accentClass={ACCENT.monthly} />
          <HubMonthHero
            loginDays={monthlySelf?.loginDays ?? 0}
            dayOfMonth={monthlySelf?.dayOfMonth ?? 1}
            daysInMonth={monthlySelf?.daysInMonth ?? 30}
            monthPct={monthlySelf?.monthPct ?? 0}
            isCurrentMonth={offset === 0}
            loading={loading}
          />
          <HubCrownFunnelGrid
            actuals={monthlySelf?.monthlyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            targets={monthlySelf?.monthlyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            hasGoal={monthlySelf?.hasGoal ?? false}
            period="monthly"
            loading={loading}
            panoVariant
          />
          <HubSelfActivityGrid
            metrics={monthlySelf?.fieldMetrics ?? EMPTY_METRICS}
            loading={loading}
            panoVariant
          />
        </>
      )
    }

    if (tab === 'yearly') {
      const loading = yearlyLoading && !yearlySelf
      return (
        <>
          <HubPeriodNavigator mode="year" accentClass={ACCENT.yearly} />
          <HubYearHero
            loginDays={yearlySelf?.loginDays ?? 0}
            year={yearlySelf?.year ?? yearRangeData.year}
            dayOfYear={yearlySelf?.dayOfYear ?? yearRangeData.dayOfYear}
            totalDaysInYear={yearlySelf?.totalDaysInYear ?? yearRangeData.totalDaysInYear}
            yearPct={yearlySelf?.yearPct ?? yearRangeData.yearPct}
            isCurrentYear={yearlySelf?.isCurrentYear ?? offset === 0}
            fieldMetrics={yearlySelf?.fieldMetrics}
            yearlyActuals={yearlySelf?.yearlyActuals}
            loading={loading}
          />
          <HubCrownFunnelGrid
            actuals={yearlySelf?.yearlyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            targets={yearlySelf?.yearlyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
            hasGoal={yearlySelf?.hasGoal ?? false}
            period="yearly"
            loading={loading}
            panoVariant
          />
          <HubSelfActivityGrid
            metrics={yearlySelf?.fieldMetrics ?? EMPTY_METRICS}
            loading={loading}
            panoVariant
          />
        </>
      )
    }

    return null
  }

  return (
    <HubPageShell
      title={formatTabbedPageTitle(t('dashboard.panoFieldSummary'), hubPeriodTabLabel(t, tab))}
      customIcon={<History className="h-5 w-5" />}
      iconClassName="bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400"
      backHref="/pano"
      showRefresh={false}
      onIconClick={goToCurrentPeriod}
      iconAriaLabel={
        tab === 'daily'
          ? t('crown.hubGoToCurrentDay')
          : tab === 'weekly'
            ? t('crown.hubGoToCurrentWeek')
            : tab === 'monthly'
              ? t('crown.hubGoToCurrentMonth')
              : tab === 'yearly'
                ? t('crown.hubGoToCurrentYear')
                : undefined
      }
    >
      <div className="space-y-4">
        <HubSummaryTabBar active={tab} onChange={setTab} />
        {renderBody()}
      </div>
    </HubPageShell>
  )
}

export function FieldSummaryPage() {
  return (
    <HubPeriodProvider>
      <FieldSummaryInner />
    </HubPeriodProvider>
  )
}
