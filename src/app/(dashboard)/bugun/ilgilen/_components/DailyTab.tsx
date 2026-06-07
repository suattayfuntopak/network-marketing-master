'use client'

import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useUserGoal } from '@/hooks/useUserGoal'
import { HubGoalChipRow } from '@/lib/ui/hub/HubGoalChipRow'
import { IlgilenContent } from './IlgilenContent'
import { FieldWeekSummary } from '@/app/(dashboard)/_components/pulse/FieldWeekSummary'
import { TodayRitualSection } from './TodayRitualSection'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'

export function DailyTab() {
  const { data: ws } = useWorkspace()
  const { progress } = useUserGoal()

  const { data: insights } = useQuery({
    queryKey: ['pano-field-insights', ws?.workspaceId],
    queryFn: () => getMyPanoInsightsAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  return (
    <div className="space-y-5">
      {progress ? (
        <HubGoalChipRow
          targets={progress.targets}
          actuals={progress.actuals}
          hasGoal={progress.hasGoal}
          fieldStreak={insights?.fieldStreak}
        />
      ) : null}
      <IlgilenContent />
      <FieldWeekSummary />
      <TodayRitualSection />
    </div>
  )
}
