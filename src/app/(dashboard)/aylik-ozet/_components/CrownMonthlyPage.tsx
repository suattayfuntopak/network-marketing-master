'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { CalendarPeriodIcon } from '@/components/ui/CalendarPeriodIcon'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubPeriodNavigator } from '@/lib/ui/hub/HubPeriodNavigator'
import { HubMonthHero } from '@/lib/ui/hub/HubMonthHero'
import { HubCrownFunnelGrid } from '@/lib/ui/hub/HubCrownFunnelGrid'
import { HubSelfActivityGrid } from '@/lib/ui/hub/HubSelfActivityGrid'
import { HubPipelineStageTable } from '@/lib/ui/hub/HubPipelineStageTable'
import { getHubMonthlySelfAction } from '@/app/(dashboard)/crown/actions'
import { queryKeys } from '@/lib/query/keys'
import { parsePeriodOffset } from '@/lib/utils/hubPeriodRange'
import { useHubPeriodNavigation } from '@/lib/ui/hub/useHubPeriodNavigation'

export function CrownMonthlyPage({ asTab = false }: { asTab?: boolean }) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { goToCurrentPeriod } = useHubPeriodNavigation()
  const offset = parsePeriodOffset(searchParams.get('offset'))

  const { data: monthlySelf, isLoading: monthlySelfLoading } = useQuery({
    queryKey: queryKeys.hubMonthlySelf(offset),
    queryFn: () => getHubMonthlySelfAction(offset),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const heroLoading = monthlySelfLoading && !monthlySelf

  return (
    <HubPageShell
      title={t('dashboard.crownMockMonthlySummary')}
      customIcon={<CalendarPeriodIcon days={30} className="h-5 w-5" />}
      iconClassName="bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400"
      backHref="/pano"
      showRefresh={false}
      onIconClick={goToCurrentPeriod}
      iconAriaLabel={t('crown.hubGoToCurrentMonth')}
      asTab={asTab}
    >
      <div className="space-y-4">
        <HubPeriodNavigator
          mode="month"
          accentClass="border-pink-300/50 bg-pink-50 dark:border-pink-500/30 dark:bg-pink-950/25"
        />
        <HubMonthHero
          loginDays={monthlySelf?.loginDays ?? 0}
          dayOfMonth={monthlySelf?.dayOfMonth ?? 1}
          daysInMonth={monthlySelf?.daysInMonth ?? 30}
          monthPct={monthlySelf?.monthPct ?? 0}
          isCurrentMonth={offset === 0}
          loading={heroLoading}
        />
        <HubCrownFunnelGrid
          actuals={monthlySelf?.monthlyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          targets={monthlySelf?.monthlyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          hasGoal={monthlySelf?.hasGoal ?? false}
          period="monthly"
          loading={monthlySelfLoading && !monthlySelf}
        />
        <HubSelfActivityGrid
          metrics={
            monthlySelf?.fieldMetrics ?? {
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
          loading={monthlySelfLoading && !monthlySelf}
        />
        <HubPipelineStageTable counts={monthlySelf?.pipelineStages ?? {}} loading={monthlySelfLoading && !monthlySelf} />
      </div>
    </HubPageShell>
  )
}
