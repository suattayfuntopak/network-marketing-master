'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { getTeamPulseTotalsAction } from '@/app/(dashboard)/pulse/actions'
import type { MemberRow } from '@/lib/team/types'
import { PulseKpiCard } from './PulseKpiCard'
import { PulsePeriodTabs } from './PulsePeriodTabs'
import { Skeleton } from '@/components/ui/Skeleton'

type Props = {
  members: MemberRow[]
}

/** ② Ekip Gelişimi Takip Tablosu (Toplam) — seçili dönemde ekibin birleşik rakamları. */
export function PulseTeamTotalsSection({ members }: Props) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const [period, setPeriod] = useState<PulsePeriod>('30d')

  const pulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)

  const memberIds = useMemo(
    () => members.filter(m => m.role !== 'leader').map(m => m.user_id),
    [members]
  )

  const { data, isLoading } = useQuery({
    queryKey: ['pulse-totals', ws?.workspaceId, memberIds.join(','), period],
    queryFn: () => getTeamPulseTotalsAction(ws!.workspaceId, memberIds, period),
    enabled: !!ws?.workspaceId && memberIds.length > 0 && pulseUnlocked,
    staleTime: 30_000,
  })

  // Kilitli ya da hiç üye yoksa bu kutuyu gösterme (① zaten Pro kapısını gösteriyor).
  if (!ws?.workspaceId || !pulseUnlocked || memberIds.length === 0) return null

  const totals = data?.totals

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand" />
            {t('pulse.teamTotalsTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
            {t('pulse.teamTotalsSubtitle')}
          </p>
        </div>
        <PulsePeriodTabs period={period} onChange={setPeriod} comfortableTypography />
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !totals || totals.activeMembers === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-3)]">{t('pulse.totalsEmpty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <PulseKpiCard
            comfortableTypography
            label={t('pulse.totalsTrainingReads')}
            primary={String(totals.trainingReads)}
          />
          <PulseKpiCard
            comfortableTypography
            label={t('pulse.totalsObjectionReads')}
            primary={String(totals.objectionReads)}
          />
          <PulseKpiCard
            comfortableTypography
            label={t('pulse.totalsVideosCompleted')}
            primary={String(totals.videosCompleted)}
          />
          <PulseKpiCard
            comfortableTypography
            label={t('pulse.presentationsSent')}
            primary={String(totals.presentationsSent)}
          />
          <PulseKpiCard
            comfortableTypography
            label={t('pulse.colAppointments')}
            primary={String(totals.appointmentsSet + totals.appointmentsDone)}
          />
          <PulseKpiCard
            comfortableTypography
            label={t('pulse.totalsActiveMembers')}
            primary={String(totals.activeMembers)}
          />
        </div>
      )}

      <p className="text-xs text-[var(--text-3)]">{t('pulse.teamTotalsNote')}</p>
    </section>
  )
}
