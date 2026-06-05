'use client'

import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useUserGoal } from '@/hooks/useUserGoal'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubGoalChipRow } from '@/lib/ui/hub/HubGoalChipRow'
import { HubPriorityStrip } from '@/lib/ui/hub/HubPriorityStrip'
import { HedefKart } from '@/app/(dashboard)/pano/_components/HedefKart'
import { FieldWeekSummary } from '@/app/(dashboard)/_components/pulse/FieldWeekSummary'
import { TodayRitualSection } from '@/app/(dashboard)/bugun/ilgilen/_components/TodayRitualSection'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'

/** Bugünkü takip — NMM hedef + saha + gün ritüeli bileşenleri (gerçek veri). */
export function CrownDailyPage() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { progress } = useUserGoal()

  const { data: insights } = useQuery({
    queryKey: ['pano-field-insights', ws?.workspaceId],
    queryFn: () => getMyPanoInsightsAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  return (
    <HubPageShell
      title={t('dashboard.crownMockDailyFollow')}
      subtitle={t('crown.dailySubtitle')}
      icon={ClipboardList}
      iconClassName="bg-[#EEEDFE] text-[#534AB7] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
    >
      {progress ? (
        <HubGoalChipRow
          targets={progress.targets}
          actuals={progress.actuals}
          hasGoal={progress.hasGoal}
          fieldStreak={insights?.fieldStreak}
        />
      ) : null}
      <HubPriorityStrip />
      <HedefKart />
      <FieldWeekSummary />
      <TodayRitualSection />
    </HubPageShell>
  )
}
