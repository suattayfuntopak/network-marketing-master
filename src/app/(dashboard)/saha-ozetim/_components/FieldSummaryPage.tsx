'use client'

import { useCallback, useEffect } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  parseSummaryTab,
  type HubPeriodTab,
} from '@/components/hub/HubSummaryTabBar'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'
import {
  getHubDailySelfAction,
  getHubMonthlySelfAction,
  getHubWeeklySelfAction,
  getHubYearlySelfAction,
  type HubSelfFieldMetrics,
} from '@/app/(dashboard)/crown/actions'
import { queryKeys } from '@/lib/query/keys'
import {
  calendarDayRange,
  parsePeriodOffset,
  rollingWeekRange,
  yearRange,
} from '@/lib/utils/hubPeriodRange'
import { useHubPeriodNavigation } from '@/components/hub/useHubPeriodNavigation'
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

export function FieldSummaryPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { goToCurrentPeriod } = useHubPeriodNavigation()

  const tab = parseSummaryTab(searchParams.get('tab'))
  const offset = parsePeriodOffset(searchParams.get('offset'))

  useEffect(() => {
    const rawTab = searchParams.get('tab')
    if (rawTab !== 'all') return
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'yearly')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const dayRange = calendarDayRange(offset)
  const weekRange = rollingWeekRange(offset)
  const yearRangeData = yearRange(offset)

  const setTab = useCallback(
    (next: HubPeriodTab) => {
      const params = new URLSearchParams()
      params.set('tab', next)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router],
  )

  const { data: dailySelf, isLoading: dailyLoading } = useQuery({
    queryKey: queryKeys.hubDailySelf(offset),
    queryFn: () => getHubDailySelfAction(offset),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: tab === 'daily',
  })

  const { data: weeklySelf, isLoading: weeklyLoading } = useQuery({
    queryKey: queryKeys.hubWeeklySelf(offset),
    queryFn: () => getHubWeeklySelfAction(offset),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: tab === 'weekly',
  })

  const { data: monthlySelf, isLoading: monthlyLoading } = useQuery({
    queryKey: queryKeys.hubMonthlySelf(offset),
    queryFn: () => getHubMonthlySelfAction(offset),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: tab === 'monthly',
  })

  const { data: yearlySelf, isLoading: yearlyLoading } = useQuery({
    queryKey: queryKeys.hubYearlySelf(offset),
    queryFn: () => getHubYearlySelfAction(offset),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
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
