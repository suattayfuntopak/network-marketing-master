'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { TeamPerformanceSection } from './TeamPerformanceSection'
import { YZOnboardingKocuModal } from './YZOnboardingKocuModal'
import type { EkipTabId } from './EkipTabNav'
import {
  joinWorkspaceByInviteAction,
  removeTeamMemberAction,
  toggleOnboardingStepAction,
} from '../actions'
import { waHref } from '@/lib/utils/waLink'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildInviteLink } from '@/lib/domain/inviteLink'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { queryKeys } from '@/lib/query/keys'
import { invalidateHubMetrics } from '@/lib/query/invalidateHubMetrics'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import type { MemberRow, OnboardingStep } from '@/lib/team/types'
import { hasTeamPulseAccess, hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { getMemberGoalsMapAction } from '../memberGoalsActions'
import {
  prefetchEkipRankingMetrics,
  prefetchEkipTrainingMetrics,
} from '@/lib/query/prefetchRouteMetrics'

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

  const [copied, setCopied] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
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
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  const toggleOnboardingStep = useCallback(async (userId: string, stepId: string, isStepDone: boolean) => {
    try {
      await toggleOnboardingStepAction(userId, stepId, !isStepDone)
      toast.success(isStepDone ? t('team.stepIncomplete') : t('team.stepComplete'))
      if (ws?.workspaceId) queryClient.invalidateQueries({ queryKey: queryKeys.team(ws.workspaceId) })
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
  const isPlusCapReached = licenseType === 'plus' && totalDownlineCount > 50

  const visibleMembers = licenseType === 'plus'
    ? downlineMembers.slice(0, 50)
    : downlineMembers

  const filteredVisibleMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return visibleMembers
    return visibleMembers.filter(m => {
      const name = (m.full_name ?? '').toLowerCase()
      const phone = (m.phone ?? '').replace(/\D/g, '')
      const qPhone = q.replace(/\D/g, '')
      return name.includes(q) || (qPhone.length >= 3 && phone.includes(qPhone))
    })
  }, [visibleMembers, memberSearch])

  const teamPulseUnlocked = hasTeamPulseAccess(licenseType, ws?.isSuperAdmin)
  const teamPageUnlocked = hasTeamPageAccess(licenseType, ws?.isSuperAdmin)

  const { data: memberGoalsMap = {} } = useQuery({
    queryKey: ['member-goals', ws?.workspaceId],
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

  const handleMemberRemoveCancel = useCallback(() => setMemberToRemove(null), [])

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

  function handleCopyInviteCode() {
    if (!ws?.inviteCode) return
    navigator.clipboard.writeText(ws.inviteCode)
    setCopied(true)
    toast.success(t('team.inviteCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoinWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (joining) return
    const code = inviteCodeInput.trim().toUpperCase()
    if (!code) { toast.error('Lütfen bir davet kodu girin!'); return }
    if (code === ws?.inviteCode) { toast.error(t('team.alreadyInTeam')); return }
    setJoining(true)
    try {
      const result = await joinWorkspaceByInviteAction(code)
      toast.success(t('team.joinSuccess', { name: result.workspace_name ?? '' }))
      setInviteCodeInput('')
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
      invalidateHubMetrics(queryClient, ws?.workspaceId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      toast.error(message || t('team.joinError'))
    } finally {
      setJoining(false)
    }
  }

  async function handleRemoveMemberConfirmed() {
    if (!memberToRemove) return
    const memberId = memberToRemove.id
    const memberName = memberToRemove.name
    setMemberToRemove(null)
    try {
      await removeTeamMemberAction(memberId, memberName)
      toast.success(t('team.removeSuccess', { name: memberName }))
      queryClient.invalidateQueries({ queryKey: ['team'] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      toast.error(message || t('team.removeError'))
    }
  }

  return (
    <div className="space-y-7">
      {activeTab === 'members' && (
        <TeamPerformanceSection
          t={t}
          lang={lang}
          ws={ws}
          members={members}
          visibleMembers={filteredVisibleMembers}
          isLeader={isLeader}
          isSolo={members.length <= 1}
          isPlusCapReached={isPlusCapReached}
          hasMasterAccess={hasMasterAccess}
          setOnboardingCoachData={setOnboardingCoachData}
          toggleOnboardingStep={toggleOnboardingStep}
          handleInviteMember={handleInviteMember}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          teamPulseUnlocked={teamPulseUnlocked}
          teamPageUnlocked={teamPageUnlocked}
          memberGoalsMap={memberGoalsMap}
          inviteCode={ws.inviteCode}
          hasUpline={ws.hasUpline}
          copied={copied}
          onCopyInviteCode={handleCopyInviteCode}
          inviteCodeInput={inviteCodeInput}
          joining={joining}
          onInviteCodeChange={setInviteCodeInput}
          onJoinSubmit={handleJoinWorkspace}
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

      {memberToRemove && (
        <ConfirmDeleteModal
          message={t('team.removeMemberMsg', { name: memberToRemove.name })}
          onConfirm={handleRemoveMemberConfirmed}
          onCancel={handleMemberRemoveCancel}
        />
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
