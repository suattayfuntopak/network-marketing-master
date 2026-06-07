'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { BroadcastPanel } from './BroadcastPanel'
import { InviteTeammateSection } from './InviteTeammateSection'
import { JoinByInviteSection } from './JoinByInviteSection'
import { TeamPerformanceSection } from './TeamPerformanceSection'
import { YZOnboardingKocuModal } from './YZOnboardingKocuModal'
import { EkipActivityTab } from './EkipActivityTab'
import { EkipTrainingTab } from './EkipTrainingTab'
import { TeamGenerationTree } from './TeamGenerationTree'
import type { EkipTabId } from './EkipTabNav'
import {
  joinWorkspaceByInviteAction,
  removeTeamMemberAction,
  toggleOnboardingStepAction,
} from '../actions'
import { waHref } from '@/lib/utils/waLink'
import { Skeleton } from '@/components/ui/Skeleton'
import { REGISTER_URL } from '@/lib/domain/constants'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { queryKeys } from '@/lib/query/keys'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import type { MemberRow, OnboardingStep } from '@/lib/team/types'
import { hasTeamPulseAccess, hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { getMemberGoalsMapAction } from '../memberGoalsActions'

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
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [onboardingCoachData, setOnboardingCoachData] = useState<{
    memberName: string
    stepId: string
    phone?: string | null
  } | null>(null)
  const [memberSearch, setMemberSearch] = useState('')

  const handleInviteMember = (member: MemberRow) => {
    const code = ws?.inviteCode || ''
    const link = REGISTER_URL
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
      queryClient.invalidateQueries({ queryKey: queryKeys.team(ws!.workspaceId) })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[toggleOnboardingStep] error:', err)
      toast.error(t('team.progressUpdateError', { message }))
    }
  }, [queryClient, ws?.workspaceId, t])

  const { data: members = [], isLoading: mLoading, isError: mError, error: queryError } = useEkipPanelRows(ws?.workspaceId)

  const downlineMembers = members.filter(m => m.role !== 'leader')
  const totalDownlineCount = downlineMembers.length
  const isPlusCapReached = licenseType === 'plus' && totalDownlineCount > 50

  const visibleMembers = licenseType === 'plus'
    ? [members[0], ...downlineMembers.slice(0, 50)].filter(Boolean)
    : members

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
    enabled: !!ws?.workspaceId && ws.role === 'leader' && teamPageUnlocked,
    staleTime: 30_000,
  })

  const handleMemberRemoveCancel = useCallback(() => setMemberToRemove(null), [])

  if (wsLoading || mLoading) {
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
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
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
    setRemovingId(memberId)
    try {
      await removeTeamMemberAction(memberId, memberName)
      toast.success(t('team.removeSuccess', { name: memberName }))
      queryClient.invalidateQueries({ queryKey: ['team'] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(err)
      toast.error(message || t('team.removeError'))
    } finally {
      setRemovingId(null)
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
        />
      )}

      {activeTab === 'training' && (
        <EkipTrainingTab
          t={t}
          lang={lang}
          members={members}
          teamPageUnlocked={teamPageUnlocked}
        />
      )}

      {activeTab === 'invite' && isLeader && (
        <InviteTeammateSection
          inviteCode={ws.inviteCode}
          copied={copied}
          onCopy={handleCopyInviteCode}
          t={t}
        />
      )}

      {activeTab === 'invite' && !ws.hasUpline && (
        <JoinByInviteSection
          inviteCodeInput={inviteCodeInput}
          joining={joining}
          onInviteCodeChange={setInviteCodeInput}
          onSubmit={handleJoinWorkspace}
          t={t}
        />
      )}

      {activeTab === 'invite' && ws.hasUpline && !isLeader && (
        <p className="rounded-2xl border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--text-3)]">
          {t('team.inviteMemberOnlyLeader')}
        </p>
      )}

      {activeTab === 'activity' && <EkipActivityTab />}

      {activeTab === 'tree' && (
        <TeamGenerationTree workspaceId={ws.workspaceId} teamPageUnlocked={teamPageUnlocked} />
      )}

      {activeTab === 'members' && isLeader && teamPageUnlocked && (
        <BroadcastPanel members={visibleMembers} t={t} />
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
