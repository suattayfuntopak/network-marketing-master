'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import type { MemberRow } from '@/lib/team/types'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import { prefetchMemberActivity } from '@/lib/query/prefetchMemberActivity'
import { VirtualizedMemberList } from './VirtualizedMemberList'
import { TeamMemberCard, type MemberCardTab } from './TeamMemberCard'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'
import { BroadcastPanel } from './BroadcastPanel'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { addTeamMemberAsCandidateAction, unclaimMemberFromTeamAction } from '../actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { queryInvalidator } from '@/lib/query/invalidator'
import { toast } from 'sonner'
import { memberMatchesSearch } from '@/lib/team/memberSearch'
import type { DownlineCapTier } from '@/lib/domain/teamLimits'

export interface TeamPerformanceSectionProps {
  t: (key: string, vars?: Record<string, string | number>) => string
  lang: string
  ws: WorkspaceContext
  members: MemberRow[]
  visibleMembers: MemberRow[]
  isLeader: boolean
  isDownlineCapReached: boolean
  downlineListCap: number | null
  downlineCapUpgrade: DownlineCapTier
  hasMasterAccess: boolean
  setOnboardingCoachData: (value: { memberName: string; stepId: string; phone?: string | null } | null) => void
  toggleOnboardingStep: (userId: string, stepId: string, isStepDone: boolean) => Promise<void>
  handleInviteMember: (member: MemberRow) => void
  memberSearch: string
  onMemberSearchChange: (q: string) => void
  teamPulseUnlocked: boolean
  teamPageUnlocked: boolean
  memberGoalsMap?: Record<string, MemberGoalRow>
}

// Üye kartlarının açık sekmesini ölçüm anahtarı olarak serileştirir (virtualize remeasure).
// Not: Sekme durumu KALICI DEĞİLDİR — sayfaya her girişte tüm sekmeler kapalı başlar.
function serializeMemberTabs(member: Record<string, MemberCardTab | undefined>): string {
  return Object.entries(member)
    .filter((entry): entry is [string, MemberCardTab] => entry[1] != null)
    .map(([id, tab]) => `${id}:${tab}`)
    .join(',')
}

function getSearchScore(fullName: string | null, query: string): number {
  const name = (fullName ?? '').toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return 0
  if (name === q) return 100
  if (name.startsWith(q)) return 90
  const index = name.indexOf(q)
  if (index !== -1) return 80 - index
  return 0
}

export function TeamPerformanceSection(props: TeamPerformanceSectionProps) {
  const {
    t, lang, ws, members, visibleMembers, isLeader, isDownlineCapReached, downlineListCap, downlineCapUpgrade, hasMasterAccess,
    setOnboardingCoachData,
    toggleOnboardingStep, handleInviteMember,
    memberSearch, onMemberSearchChange,
    teamPulseUnlocked, teamPageUnlocked,
    memberGoalsMap = {},
  } = props
  const router = useRouter()
  const queryClient = useQueryClient()
  const [linkingMemberId, setLinkingMemberId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<MemberRow | null>(null)
  const [localSearch, setLocalSearch] = useState(memberSearch)
  const [prevSearch, setPrevSearch] = useState(memberSearch)
  const [searchPlaceholderKey, setSearchPlaceholderKey] = useState<'team.searchMembersDesktop' | 'team.searchMembersMobile'>('team.searchMembersMobile')

  if (memberSearch !== prevSearch) {
    setPrevSearch(memberSearch)
    setLocalSearch(memberSearch)
  }

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const sync = () => {
      setSearchPlaceholderKey(mq.matches ? 'team.searchMembersDesktop' : 'team.searchMembersMobile')
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== memberSearch) {
        onMemberSearchChange(localSearch)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [localSearch, memberSearch, onMemberSearchChange])
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  const searchQ = memberSearch.trim()
  const hasMemberSearch = searchQ.length > 0

  const searchedMembers = useMemo(() => {
    // Listeden çıkarılmış (pipeline_id yok) app-user üyeler en alta — liderle hem
    // listede hem ekipte olanlar üstte kalır (stabil sıralama).
    const removedWeight = (m: MemberRow) =>
      m.role !== 'leader' && m.isAppUser !== false && !m.pipeline_id ? 1 : 0
    if (!hasMemberSearch) {
      return [...visibleMembers].sort((a, b) => removedWeight(a) - removedWeight(b))
    }
    const matches = visibleMembers.filter(m => memberMatchesSearch(m, searchQ))
    return [...matches].sort((a, b) => {
      const scoreA = getSearchScore(a.full_name, searchQ)
      const scoreB = getSearchScore(b.full_name, searchQ)
      return scoreB - scoreA
    })
  }, [visibleMembers, hasMemberSearch, searchQ])

  const searchMatchCount = searchedMembers.length

  useEffect(() => {
    if (!hasMemberSearch) return
    const first = searchedMembers[0]
    if (!first) return
    document.getElementById(`ekip-member-${first.user_id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [hasMemberSearch, searchQ, searchedMembers])

  async function handleLinkMemberToPipeline(member: MemberRow) {
    if (!member.full_name || linkingMemberId) return
    setLinkingMemberId(member.user_id)
    try {
      const result = await addTeamMemberAsCandidateAction(ws.workspaceId, member.full_name, {
        memberUserId: member.user_id,
        memberPhone: member.phone,
      })
      queryInvalidator.invalidateHub(queryClient, ws.workspaceId)
      queryInvalidator.invalidateTeam(queryClient, ws.workspaceId)
      toast.success(
        result.created ? t('team.linkToPipelineSuccess') : t('team.linkToPipelineExists'),
      )
      router.push(`/pipeline/${result.candidateId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error')
      toast.error(message)
    } finally {
      setLinkingMemberId(null)
    }
  }

  async function handleRemoveFromTeam(member: MemberRow) {
    if (removingMemberId) return
    setRemovingMemberId(member.user_id)
    try {
      await unclaimMemberFromTeamAction(member.user_id)
      // Aday silindi + bağ koptu → huni/Hedefim ve ekip metrikleri yenilenir.
      queryInvalidator.invalidateCandidates(queryClient, ws.workspaceId)
      queryInvalidator.invalidateTeam(queryClient, ws.workspaceId)
      toast.success(t('team.removeFromTeamSuccess', { name: member.full_name ?? t('common.member') }))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setRemovingMemberId(null)
      setConfirmRemove(null)
    }
  }

  const [now] = useState(() => Date.now())
  // Sekme durumu efemeraldir: sayfaya her girişte tüm üye kartı sekmeleri kapalı başlar.
  // Kullanıcı tıklayarak açar; kalıcılık (sessionStorage/URL) bilinçli olarak yoktur.
  const [memberCardTab, setMemberCardTab] = useState<Record<string, MemberCardTab | undefined>>({})
  const [onboardingWeekByMember, setOnboardingWeekByMember] = useState<Record<string, 1 | 2 | 3 | 4>>({})

  const searchParams = useSearchParams()
  const routeMemberId = searchParams.get('memberId')
  const routeMemberTab = searchParams.get('memberTab') as MemberCardTab | null

  useEffect(() => {
    if (routeMemberId && routeMemberTab) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setMemberCardTab(prev => ({
        ...prev,
        [routeMemberId]: routeMemberTab,
      }))
      const timer = setTimeout(() => {
        const el = document.getElementById(`ekip-member-${routeMemberId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [routeMemberId, routeMemberTab])

  const selectMemberTab = (userId: string, tab: MemberCardTab) => {
    setMemberCardTab(prev => ({
      ...prev,
      [userId]: prev[userId] === tab ? undefined : tab,
    }))
  }

  const getMemberTab = (userId: string): MemberCardTab | undefined => memberCardTab[userId]

  const prefetchMemberActivityForCard = useCallback(
    (userId: string) => prefetchMemberActivity(queryClient, ws.workspaceId, userId),
    [queryClient, ws.workspaceId],
  )

  const getOnboardingWeek = (userId: string): 1 | 2 | 3 | 4 => onboardingWeekByMember[userId] ?? 1

  const nmmPartnerCount = members.filter(m => m.role !== 'leader' && m.isAppUser !== false).length
  const fieldPartnerCount = members.filter(m => m.isAppUser === false).length
  const leaderPipelineTotal = members.find(m => m.role === 'leader')?.candidate_count ?? 0
  const pureCandidateCount = Math.max(0, leaderPipelineTotal - nmmPartnerCount - fieldPartnerCount)

  if (!teamPageUnlocked) {
    return (
      <>
      <section className="space-y-5">
        <TeamFreeUpgradeBanner />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[#FFFBE6] dark:bg-[#3a3000]/30 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-[#D4A017]">{nmmPartnerCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C9940A]">
              {t('team.statNmmPartner')}
            </p>
            <p className="mt-1 text-[10px] italic leading-snug text-[#C9940A]/80">
              {t('team.statNmmPartnerHint')}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#FEECEC] dark:bg-red-950/25 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400">{fieldPartnerCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700/80 dark:text-red-300/90">
              {t('team.statFieldPartner')}
            </p>
            <p className="mt-1 text-[10px] italic leading-snug text-red-700/70 dark:text-red-300/70">
              {t('team.statFieldPartnerHint')}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#EEF2FF] dark:bg-[#0a0f2e]/40 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-accent-blue">{pureCandidateCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#3658C7]">
              {t('team.totalCandidates')}
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {visibleMembers.map(m => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm"
            >
              <span className="font-semibold text-[var(--text-1)] truncate">{m.full_name ?? t('common.member')}</span>
              <span className="shrink-0 text-xs text-[var(--text-3)]">
                {m.role === 'leader' ? t('common.leader') : t('shellUi.roleMember')}
              </span>
            </li>
          ))}
        </ul>
      </section>
      {UpgradePrompt}
      </>
    )
  }

  return (
      <>
      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[#FFFBE6] dark:bg-[#3a3000]/30 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-[#D4A017]">{nmmPartnerCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C9940A]">
              {t('team.statNmmPartner')}
            </p>
            <p className="mt-1 text-[10px] italic leading-snug text-[#C9940A]/80">
              {t('team.statNmmPartnerHint')}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#FEECEC] dark:bg-red-950/25 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400">{fieldPartnerCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700/80 dark:text-red-300/90">
              {t('team.statFieldPartner')}
            </p>
            <p className="mt-1 text-[10px] italic leading-snug text-red-700/70 dark:text-red-300/70">
              {t('team.statFieldPartnerHint')}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#EEF2FF] dark:bg-[#0a0f2e]/40 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-accent-blue">{pureCandidateCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#3658C7]">
              {t('team.totalCandidates')}
            </p>
          </div>
        </div>

        {isLeader && visibleMembers.length > 1 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
            <input
              type="search"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder={t(searchPlaceholderKey)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-10 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition"
            />
            {localSearch.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('')
                  onMemberSearchChange('')
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-3)] hover:text-[var(--text-1)] rounded-lg hover:bg-[var(--bg-subtle-hover)] transition cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {hasMemberSearch && searchMatchCount === 0 && (
              <p className="mt-2 text-center text-xs text-[var(--text-3)]">{t('common.searchNoResults')}</p>
            )}
          </div>
        )}

        {/* Üye performans listesi */}
        <VirtualizedMemberList
          items={searchedMembers}
          getKey={m => m.user_id}
          measureKey={serializeMemberTabs(memberCardTab)}
          renderItem={m => (
            <TeamMemberCard
              m={m}
              ws={ws}
              now={now}
              isLeader={isLeader}
              hasMasterAccess={hasMasterAccess}
              linkingMemberId={linkingMemberId}
              activeTab={getMemberTab(m.user_id)}
              onboardingWeek={getOnboardingWeek(m.user_id)}
              memberGoalsMap={memberGoalsMap}
              teamPulseUnlocked={teamPulseUnlocked}
              lang={lang}
              t={t}
              hasAiFieldAccess={hasAiFieldAccess}
              onSelectTab={tab => { onMemberSearchChange(''); selectMemberTab(m.user_id, tab) }}
              onPrefetchActivity={() => prefetchMemberActivityForCard(m.user_id)}
              onSetOnboardingWeek={week => setOnboardingWeekByMember(prev => ({ ...prev, [m.user_id]: week }))}
              onToggleOnboardingStep={(stepId, isDone) => { onMemberSearchChange(''); void toggleOnboardingStep(m.user_id, stepId, isDone) }}
              onLinkToPipeline={() => { onMemberSearchChange(''); void handleLinkMemberToPipeline(m) }}
              onRemoveFromTeam={() => { onMemberSearchChange(''); setConfirmRemove(m) }}
              onInviteMember={() => { onMemberSearchChange(''); handleInviteMember(m) }}
              onSetOnboardingCoachData={setOnboardingCoachData}
              onOpenUpgrade={openUpgrade}
            />
          )}
        />

        {isDownlineCapReached && downlineListCap != null && (
          <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 to-rose-500/5 p-8 text-center space-y-4 shadow-lg my-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 text-xl">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-base font-bold text-white">
                {t('team.teamLimitReached', { limit: downlineListCap })}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {downlineCapUpgrade === 'plus'
                  ? t('team.teamLimitDescPlus', { limit: downlineListCap })
                  : t('team.teamLimitDescBasic', { limit: downlineListCap })}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => router.push('/odeme')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition active:scale-95 cursor-pointer shadow-lg shadow-pink-500/15"
              >
                <span>
                  {downlineCapUpgrade === 'plus'
                    ? t('team.upgradeToPro')
                    : t('team.upgradeToPlus')}
                </span>
              </button>
            </div>
          </div>
        )}

        {!isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-5 py-4 text-center text-sm font-semibold text-[var(--text-2)] leading-relaxed border border-[var(--border)]">
            {t('team.memberHint')}
          </p>
        )}

        {isLeader && teamPageUnlocked && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <BroadcastPanel members={visibleMembers} t={t} />
          </div>
        )}
      </section>
      {UpgradePrompt}
      {confirmRemove && (
        <ConfirmDialog
          message={t('team.removeFromTeamConfirm', { name: confirmRemove.full_name ?? t('common.member') })}
          variant="danger"
          onConfirm={() => { void handleRemoveFromTeam(confirmRemove) }}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
      </>
  )
}
