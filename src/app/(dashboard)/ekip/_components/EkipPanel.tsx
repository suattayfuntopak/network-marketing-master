'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { TeamPerformanceSection } from './TeamPerformanceSection'
import type { EkipTabId } from './EkipTabNav'
import { toggleOnboardingStepAction } from '../actions'
import { waHref, whatsappShareUrl } from '@/lib/utils/waLink'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildInviteLink } from '@/lib/domain/inviteLink'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { queryInvalidator } from '@/lib/query/invalidator'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import type { MemberRow, OnboardingStep } from '@/lib/team/types'
import { hasTeamPulseAccess, hasTeamPageAccess } from '@/lib/domain/teamAccess'
import {
  downlineCapUpgradeTier,
  getDownlineListCap,
} from '@/lib/domain/teamLimits'
import { getMemberGoalsMapAction } from '../memberGoalsActions'
import {
  prefetchEkipRankingMetrics,
  prefetchEkipTrainingMetrics,
} from '@/lib/query/prefetchRouteMetrics'
import { queryKeys } from '@/lib/query/keys'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'

const YZOnboardingKocuModal = dynamic(
  () => import('./YZOnboardingKocuModal').then(m => ({ default: m.YZOnboardingKocuModal })),
  { loading: () => null },
)

const EkipSummaryTab = dynamic(
  () => import('./EkipSummaryTab').then(m => ({ default: m.EkipSummaryTab })),
  { loading: () => <Skeleton className="h-48 rounded-2xl" /> },
)
const EkipTrainingTab = dynamic(
  () => import('./EkipTrainingTab').then(m => ({ default: m.EkipTrainingTab })),
  { loading: () => <Skeleton className="h-48 rounded-2xl" /> },
)
const TeamGenerationTree = dynamic(
  () => import('./TeamGenerationTree').then(m => ({ default: m.TeamGenerationTree })),
  { loading: () => <Skeleton className="h-64 rounded-2xl" /> },
)

export { ONBOARDING_STEPS }
export type { MemberRow, OnboardingStep }

export function EkipPanel({ activeTab = 'members' }: { activeTab?: EkipTabId }) {
  const queryClient = useQueryClient()
  const { lang, t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()

  const licenseType = ws?.licenseType ?? 'free'
  const licenseExpiresAt = ws?.licenseExpiresAt ?? null
  const isLicenseExpired = licenseExpiresAt
    ? new Date(licenseExpiresAt) < new Date()
    : false
  const hasMasterAccess = (licenseType === 'plus' || licenseType === 'pro') && !isLicenseExpired

  const [onboardingCoachData, setOnboardingCoachData] = useState<{
    memberName: string
    stepId: string
    phone?: string | null
  } | null>(null)
  const [memberSearch, setMemberSearch] = useState('')

  const handleInviteMember = (member: MemberRow) => {
    const code = ws?.inviteCode || ''
    // Link sponsor kodunu (+ varsa aday id'sini) taşır → otomatik ekip bağlaması (bkz. buildInviteLink).
    const link = buildInviteLink(code, member.pipeline_id)
    const message = t('team.inviteWaMessage', {
      name: member.full_name ?? t('common.member'),
      link,
      code,
    })

    const href = waHref(member.phone, message)
    if (href) {
      window.open(href, '_blank')
    } else {
      window.open(whatsappShareUrl(message), '_blank')
    }

    // Dalga 0 — K-faktör payı: davet linki paylaşıldı.
    void logProductEventAction(PRODUCT_EVENTS.inviteSent, {
      source: 'ekip',
      withCandidate: !!member.pipeline_id,
    })
  }

  const toggleOnboardingStep = useCallback(async (userId: string, stepId: string, isStepDone: boolean) => {
    try {
      await toggleOnboardingStepAction(userId, stepId, !isStepDone)
      toast.success(isStepDone ? t('team.stepIncomplete') : t('team.stepComplete'))
      if (ws?.workspaceId) queryInvalidator.invalidateTeam(queryClient, ws.workspaceId, userId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[toggleOnboardingStep] error:', err)
      toast.error(t('team.progressUpdateError', { message }))
    }
  }, [queryClient, ws, t])

  const { data: members = [], isLoading: mLoading, isError: mError, error: queryError } = useEkipPanelRows(ws?.workspaceId)

  useEffect(() => {
    if (!ws?.workspaceId || members.length === 0) return
    if (!hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) return
    void prefetchEkipRankingMetrics(queryClient, ws.workspaceId, ws)
    void prefetchEkipTrainingMetrics(queryClient, ws.workspaceId, ws)
  }, [queryClient, ws, members.length])

  const downlineMembers = members.filter(m => m.role !== 'leader')
  const totalDownlineCount = downlineMembers.length
  const downlineListCap = getDownlineListCap(licenseType, ws?.isSuperAdmin)
  const isDownlineCapReached =
    downlineListCap !== null && totalDownlineCount > downlineListCap
  const downlineCapUpgrade = downlineCapUpgradeTier(licenseType)

  const visibleMembers =
    downlineListCap === null
      ? downlineMembers
      : downlineMembers.slice(0, downlineListCap)

  const teamPulseUnlocked = hasTeamPulseAccess(licenseType, ws?.isSuperAdmin)
  const teamPageUnlocked = hasTeamPageAccess(licenseType, ws?.isSuperAdmin)

  const { data: memberGoalsMap = {} } = useQuery({
    queryKey: ws?.workspaceId
      ? queryKeys.memberGoalsMap(ws.workspaceId)
      : queryKeys.memberGoalsMapDisabled(),
    queryFn: () =>
      getMemberGoalsMapAction(
        ws!.workspaceId,
        downlineMembers.map(m => m.user_id).filter(Boolean)
      ),
    enabled:
      activeTab === 'members' &&
      !!ws?.workspaceId &&
      ws.role === 'leader' &&
      teamPageUnlocked,
    staleTime: 30_000,
  })


  if (wsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (mLoading && activeTab === 'members' && members.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (mError || !ws) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
        <p className="mb-2 text-3xl">⚠️</p>
        <p className="text-sm font-semibold text-[var(--text-1)]">{t('team.loadError')}</p>
        <p className="mt-1 text-xs text-[var(--text-2)]">{(queryError as Error)?.message || t('team.loadErrorHint')}</p>
      </div>
    )
  }

  const isLeader = ws.role === 'leader'



  return (
    <div className="space-y-7">
      {activeTab === 'members' && (
        <TeamPerformanceSection
          t={t}
          lang={lang}
          ws={ws}
          members={members}
          visibleMembers={visibleMembers}
          isLeader={isLeader}
          isDownlineCapReached={isDownlineCapReached}
          downlineListCap={downlineListCap}
          downlineCapUpgrade={downlineCapUpgrade}
          hasMasterAccess={hasMasterAccess}
          setOnboardingCoachData={setOnboardingCoachData}
          toggleOnboardingStep={toggleOnboardingStep}
          handleInviteMember={handleInviteMember}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          teamPulseUnlocked={teamPulseUnlocked}
          teamPageUnlocked={teamPageUnlocked}
          memberGoalsMap={memberGoalsMap}
        />
      )}

      {activeTab === 'training' && (
        <EkipTrainingTab
          t={t}
          members={members}
          teamPageUnlocked={teamPageUnlocked}
          teamPulseUnlocked={teamPulseUnlocked}
        />
      )}

      {activeTab === 'summary' && (
        <div
          className="max-w-full min-w-0 overflow-x-clip overscroll-x-none touch-pan-y no-swipe"
          data-no-swipe="true"
          onTouchStart={e => e.stopPropagation()}
        >
          <EkipSummaryTab members={members} membersLoading={mLoading} />
        </div>
      )}

      {activeTab === 'tree' && (
        <TeamGenerationTree workspaceId={ws.workspaceId} teamPageUnlocked={teamPageUnlocked} />
      )}

      {onboardingCoachData && (
        <YZOnboardingKocuModal
          memberName={onboardingCoachData.memberName}
          stepId={onboardingCoachData.stepId}
          phone={onboardingCoachData.phone}
          onClose={() => setOnboardingCoachData(null)}
        />
      )}

    </div>
  )
}
