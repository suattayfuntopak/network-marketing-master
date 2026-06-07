'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { CalendarPeriodIcon } from '@/components/ui/CalendarPeriodIcon'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubWeekHero } from '@/lib/ui/hub/HubWeekHero'
import { HubWeekLoginStrip } from '@/lib/ui/hub/HubWeekLoginStrip'
import { HubCrownFunnelGrid } from '@/lib/ui/hub/HubCrownFunnelGrid'
import { HubSelfActivityGrid } from '@/lib/ui/hub/HubSelfActivityGrid'
import { HubPipelineStageTable } from '@/lib/ui/hub/HubPipelineStageTable'
import { getHubWeeklySelfAction } from '@/app/(dashboard)/crown/actions'
import { queryKeys } from '@/lib/query/keys'
import { weeklyAccent } from './weeklyTheme'

export function CrownWeeklyPage({ asTab = false }: { asTab?: boolean }) {
  const { t } = useTranslation()

  const { data: weeklySelf, isLoading: weeklySelfLoading } = useQuery({
    queryKey: queryKeys.hubWeeklySelf(),
    queryFn: getHubWeeklySelfAction,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const selfLoading = weeklySelfLoading && !weeklySelf
  const weekActive = weeklySelf?.weekActive ?? Array.from({ length: 7 }, () => false)
  const loginDays = Math.min(7, weeklySelf?.loginDays ?? weekActive.filter(Boolean).length)

  return (
    <HubPageShell
      title={t('dashboard.crownMockWeeklySummary')}
      customIcon={<CalendarPeriodIcon days={7} className="h-5 w-5" />}
      iconClassName={weeklyAccent.icon}
      backHref="/pano"
      showRefresh={false}
      asTab={asTab}
    >
      <div className="space-y-4">
        <HubWeekHero loading={selfLoading} />
        <HubWeekLoginStrip weekActive={weekActive} loginDays={loginDays} loading={selfLoading} />
        <HubCrownFunnelGrid
          actuals={weeklySelf?.weeklyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          targets={weeklySelf?.weeklyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          hasGoal={weeklySelf?.hasGoal ?? false}
          period="weekly"
          loading={selfLoading}
        />
        <HubSelfActivityGrid
          metrics={
            weeklySelf?.fieldMetrics ?? {
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
        <HubPipelineStageTable counts={weeklySelf?.pipelineStages ?? {}} loading={selfLoading} />
      </div>
    </HubPageShell>
  )
}
