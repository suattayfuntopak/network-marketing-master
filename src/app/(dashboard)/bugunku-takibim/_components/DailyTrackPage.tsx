'use client'

import Link from 'next/link'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { CalendarPeriodIcon } from '@/components/ui/CalendarPeriodIcon'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubPeriodNavigator } from '@/lib/ui/hub/HubPeriodNavigator'
import { HubDayLoginStrip } from '@/lib/ui/hub/HubDayLoginStrip'
import { HubCrownFunnelGrid } from '@/lib/ui/hub/HubCrownFunnelGrid'
import { HubSelfActivityGrid } from '@/lib/ui/hub/HubSelfActivityGrid'
import { HubPipelineStageTable } from '@/lib/ui/hub/HubPipelineStageTable'
import { getHubDailySelfAction } from '@/app/(dashboard)/crown/actions'
import { queryKeys } from '@/lib/query/keys'
import { calendarDayRange, parsePeriodOffset } from '@/lib/utils/hubPeriodRange'
import { useHubPeriodNavigation } from '@/lib/ui/hub/useHubPeriodNavigation'
import { dailyAccent } from './dailyTheme'

export function DailyTrackPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { goToCurrentPeriod } = useHubPeriodNavigation()
  const offset = parsePeriodOffset(searchParams.get('offset'))
  const dayRange = calendarDayRange(offset)

  const { data: dailySelf, isLoading: dailySelfLoading } = useQuery({
    queryKey: queryKeys.hubDailySelf(offset),
    queryFn: () => getHubDailySelfAction(offset),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const selfLoading = dailySelfLoading && !dailySelf
  const actuals = dailySelf?.dailyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }
  const showEmptyHint =
    dailySelf?.isToday &&
    !selfLoading &&
    actuals.arama + actuals.tanisma + actuals.sunum + actuals.yeniUye === 0

  return (
    <HubPageShell
      title={t('dashboard.crownMockDailySummary')}
      customIcon={<CalendarPeriodIcon days={1} className="h-5 w-5" />}
      iconClassName={dailyAccent.icon}
      backHref="/pano"
      showRefresh={false}
      onIconClick={goToCurrentPeriod}
      iconAriaLabel={t('crown.hubGoToCurrentDay')}
    >
      <div className="space-y-4">
        <HubPeriodNavigator mode="day" accentClass={dailyAccent.surface} />
        <HubDayLoginStrip
          dayActive={dailySelf?.dayActive ?? false}
          loading={selfLoading}
          dayDate={dayRange.date}
        />
        {showEmptyHint ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 text-sm text-[var(--text-2)]">
            <p>{t('dashboard.dailyTrackEmptyHint')}</p>
            <Link
              href="/pipeline"
              className="mt-2 inline-block font-semibold text-brand-readable hover:underline"
            >
              {t('dashboard.dailyTrackPipelineCta')} →
            </Link>
          </div>
        ) : null}
        <HubCrownFunnelGrid
          actuals={actuals}
          targets={dailySelf?.dailyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          hasGoal={dailySelf?.hasGoal ?? false}
          period="daily"
          loading={selfLoading}
        />
        <HubSelfActivityGrid
          metrics={
            dailySelf?.fieldMetrics ?? {
              calls: 0,
              whatsapps: 0,
              notes: 0,
              stageChanges: 0,
              aiActions: 0,
              newCandidates: 0,
              activeDays: 0,
              totalActions: 0,
            }
          }
          loading={selfLoading}
        />
        <HubPipelineStageTable counts={dailySelf?.pipelineStages ?? {}} loading={selfLoading} />
      </div>
    </HubPageShell>
  )
}
