'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { Search, ChevronDown, X } from 'lucide-react'
import type { MemberRow } from '@/lib/team/types'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import { getMemberActivityDetailAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import type { SheetActivityPeriod } from '@/lib/domain/pulse'
import { VirtualizedMemberList } from './VirtualizedMemberList'
import { TeamMemberCard, type MemberCardTab } from './TeamMemberCard'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'
import { InviteTeammateSection } from './InviteTeammateSection'
import { JoinByInviteSection } from './JoinByInviteSection'
import { BroadcastPanel } from './BroadcastPanel'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { addTeamMemberAsCandidateAction } from '../actions'
import { invalidateHubMetrics } from '@/lib/query/invalidateHubMetrics'
import { queryKeys } from '@/lib/query/keys'
import { toast } from 'sonner'
import { memberMatchesSearch } from '@/lib/team/memberSearch'

export interface TeamPerformanceSectionProps {
  t: (key: string, vars?: Record<string, string | number>) => string
  lang: string
  ws: WorkspaceContext
  members: MemberRow[]
  visibleMembers: MemberRow[]
  isLeader: boolean
  isSolo: boolean
  isPlusCapReached: boolean
  hasMasterAccess: boolean
  setOnboardingCoachData: (value: { memberName: string; stepId: string; phone?: string | null } | null) => void
  toggleOnboardingStep: (userId: string, stepId: string, isStepDone: boolean) => Promise<void>
  handleInviteMember: (member: MemberRow) => void
  memberSearch: string
  onMemberSearchChange: (q: string) => void
  teamPulseUnlocked: boolean
  teamPageUnlocked: boolean
  memberGoalsMap?: Record<string, MemberGoalRow>
  inviteCode: string
  hasUpline: boolean
  copied: boolean
  onCopyInviteCode: () => void
  inviteCodeInput: string
  joining: boolean
  onInviteCodeChange: (value: string) => void
  onJoinSubmit: (e: React.FormEvent) => void
}

type FieldCardTab = 'aiInvite' | 'nmmInvite'

const MEMBER_CARD_TABS: MemberCardTab[] = ['onboarding', 'call', 'whatsapp', 'activity']
const FIELD_CARD_TABS: FieldCardTab[] = ['aiInvite', 'nmmInvite']

const TEAM_TAB_STORAGE_KEY = 'nmm_team_perf_tabs'

function isMemberCardTab(value: string | null): value is MemberCardTab {
  return !!value && MEMBER_CARD_TABS.includes(value as MemberCardTab)
}

function isFieldCardTab(value: string | null): value is FieldCardTab {
  return !!value && FIELD_CARD_TABS.includes(value as FieldCardTab)
}

function loadTeamTabState(): {
  member: Record<string, MemberCardTab | undefined>
  field: Record<string, FieldCardTab | undefined>
} {
  if (typeof window === 'undefined') return { member: {}, field: {} }
  try {
    const raw = sessionStorage.getItem(TEAM_TAB_STORAGE_KEY)
    if (!raw) return { member: {}, field: {} }
    const parsed = JSON.parse(raw) as {
      member?: Record<string, MemberCardTab | undefined>
      field?: Record<string, FieldCardTab | undefined>
    }
    return {
      member: parsed.member ?? {},
      field: parsed.field ?? {},
    }
  } catch {
    return { member: {}, field: {} }
  }
}

function serializeMemberTabs(member: Record<string, MemberCardTab | undefined>): string {
  return Object.entries(member)
    .filter((entry): entry is [string, MemberCardTab] => entry[1] != null)
    .map(([id, tab]) => `${id}:${tab}`)
    .join(',')
}

function serializeFieldTabs(field: Record<string, FieldCardTab | undefined>): string {
  return Object.entries(field)
    .filter((entry): entry is [string, FieldCardTab] => entry[1] != null)
    .map(([id, tab]) => `${id}:${tab}`)
    .join(',')
}

const PERF_HASH_PREFIX = '#perf='
const PERF_URL_QUERY_MAX = 120

function buildPerfCompact(memberSerialized: string, fieldSerialized: string): string {
  return `m:${memberSerialized};f:${fieldSerialized}`
}

function parsePerfCompact(raw: string): {
  member: Record<string, MemberCardTab>
  field: Record<string, FieldCardTab>
} {
  const memberRaw = raw.match(/(?:^|;)m:([^;]*)/)?.[1] ?? ''
  const fieldRaw = raw.match(/(?:^|;)f:([^;]*)/)?.[1] ?? ''
  return {
    member: parseMemberTabs(memberRaw || null),
    field: parseFieldTabs(fieldRaw || null),
  }
}

function readPerfFromHash(): ReturnType<typeof parsePerfCompact> | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash.startsWith(PERF_HASH_PREFIX)) return null
  try {
    return parsePerfCompact(decodeURIComponent(hash.slice(PERF_HASH_PREFIX.length)))
  } catch {
    return null
  }
}

function parseMemberTabs(raw: string | null): Record<string, MemberCardTab> {
  if (!raw) return {}
  const out: Record<string, MemberCardTab> = {}
  for (const part of raw.split(',')) {
    const sep = part.indexOf(':')
    if (sep <= 0) continue
    const id = part.slice(0, sep)
    const tab = part.slice(sep + 1)
    if (isMemberCardTab(tab)) out[id] = tab
  }
  return out
}

function sanitizeMemberTabs(
  member: Record<string, MemberCardTab | undefined>,
): Record<string, MemberCardTab | undefined> {
  const out: Record<string, MemberCardTab | undefined> = {}
  for (const [id, tab] of Object.entries(member)) {
    if (tab && isMemberCardTab(tab)) out[id] = tab
  }
  return out
}

function parseFieldTabs(raw: string | null): Record<string, FieldCardTab> {
  if (!raw) return {}
  const out: Record<string, FieldCardTab> = {}
  for (const part of raw.split(',')) {
    const sep = part.indexOf(':')
    if (sep <= 0) continue
    const id = part.slice(0, sep)
    const tab = part.slice(sep + 1)
    if (isFieldCardTab(tab)) out[id] = tab
  }
  return out
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
    t, lang, ws, members, visibleMembers, isLeader, isSolo, isPlusCapReached, hasMasterAccess,
    setOnboardingCoachData,
    toggleOnboardingStep, handleInviteMember,
    memberSearch, onMemberSearchChange,
    teamPulseUnlocked, teamPageUnlocked,
    memberGoalsMap = {},
    inviteCode, hasUpline, copied, onCopyInviteCode,
    inviteCodeInput, joining, onInviteCodeChange, onJoinSubmit,
  } = props
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [linkingMemberId, setLinkingMemberId] = useState<string | null>(null)
  const [toolsOpen, setToolsOpen] = useState(true)
  const [localSearch, setLocalSearch] = useState(memberSearch)
  const [prevSearch, setPrevSearch] = useState(memberSearch)

  if (memberSearch !== prevSearch) {
    setPrevSearch(memberSearch)
    setLocalSearch(memberSearch)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== memberSearch) {
        onMemberSearchChange(localSearch)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [localSearch, memberSearch, onMemberSearchChange])
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const hasTeamTools = isLeader || !hasUpline

  const searchQ = memberSearch.trim()
  const hasMemberSearch = searchQ.length > 0

  const searchedMembers = useMemo(() => {
    if (!hasMemberSearch) return visibleMembers
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
      invalidateHubMetrics(queryClient, ws.workspaceId)
      queryClient.invalidateQueries({ queryKey: queryKeys.team(ws.workspaceId) })
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
  const [now] = useState(() => Date.now())
  const [memberCardTab, setMemberCardTab] = useState<Record<string, MemberCardTab | undefined>>({})
  const [fieldCardTab, setFieldCardTab] = useState<Record<string, FieldCardTab | undefined>>({})
  const [onboardingWeekByMember, setOnboardingWeekByMember] = useState<Record<string, 1 | 2 | 3 | 4>>({})
  const [tabsHydrated, setTabsHydrated] = useState(false)

  const syncPerfTabsToUrl = useCallback((
    member: Record<string, MemberCardTab | undefined>,
    field: Record<string, FieldCardTab | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    const memberSerialized = serializeMemberTabs(member)
    const fieldSerialized = serializeFieldTabs(field)
    const compact = buildPerfCompact(memberSerialized, fieldSerialized)

    params.delete('perfMember')
    params.delete('perfMemberTab')
    params.delete('perfField')
    params.delete('perfFieldTab')

    if (compact.length > PERF_URL_QUERY_MAX) {
      params.delete('perfMemberTabs')
      params.delete('perfFieldTabs')
      const qs = params.toString()
      const base = qs ? `${pathname}?${qs}` : pathname
      router.replace(`${base}${PERF_HASH_PREFIX}${encodeURIComponent(compact)}`, { scroll: false })
      return
    }

    if (memberSerialized) params.set('perfMemberTabs', memberSerialized)
    else params.delete('perfMemberTabs')

    if (fieldSerialized) params.set('perfFieldTabs', fieldSerialized)
    else params.delete('perfFieldTabs')

    const qs = params.toString()
    if (typeof window !== 'undefined' && window.location.hash.startsWith(PERF_HASH_PREFIX)) {
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
    }
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, searchParams, pathname])

  useEffect(() => {
    const stored = loadTeamTabState()
    const member: Record<string, MemberCardTab | undefined> = { ...stored.member }
    const field: Record<string, FieldCardTab | undefined> = { ...stored.field }

    const fromHash = readPerfFromHash()
    if (fromHash) {
      Object.assign(member, fromHash.member)
      Object.assign(field, fromHash.field)
    } else {
      Object.assign(member, parseMemberTabs(searchParams.get('perfMemberTabs')))
      Object.assign(field, parseFieldTabs(searchParams.get('perfFieldTabs')))
    }

    const urlMemberId = searchParams.get('perfMember')
    const urlMemberTab = searchParams.get('perfMemberTab')
    if (urlMemberId && isMemberCardTab(urlMemberTab)) {
      member[urlMemberId] = urlMemberTab
    }

    const urlFieldId = searchParams.get('perfField')
    const urlFieldTab = searchParams.get('perfFieldTab')
    if (urlFieldId && isFieldCardTab(urlFieldTab)) {
      field[urlFieldId] = urlFieldTab
    }

    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMemberCardTab(sanitizeMemberTabs(member))
    setFieldCardTab(field)
    setTabsHydrated(true)
  }, [searchParams])

  useEffect(() => {
    if (!tabsHydrated) return

    const applyHashPerf = () => {
      const fromHash = readPerfFromHash()
      if (!fromHash) return
      setMemberCardTab(prev => ({ ...prev, ...fromHash.member }))
      setFieldCardTab(prev => ({ ...prev, ...fromHash.field }))
    }

    window.addEventListener('hashchange', applyHashPerf)
    window.addEventListener('popstate', applyHashPerf)
    return () => {
      window.removeEventListener('hashchange', applyHashPerf)
      window.removeEventListener('popstate', applyHashPerf)
    }
  }, [tabsHydrated])

  useEffect(() => {
    if (!tabsHydrated) return
    sessionStorage.setItem(
      TEAM_TAB_STORAGE_KEY,
      JSON.stringify({ member: memberCardTab, field: fieldCardTab }),
    )
  }, [memberCardTab, fieldCardTab, tabsHydrated])

  const selectMemberTab = (userId: string, tab: MemberCardTab) => {
    setMemberCardTab(prev => {
      const next = {
        ...prev,
        [userId]: prev[userId] === tab ? undefined : tab,
      }
      syncPerfTabsToUrl(next, fieldCardTab)
      return next
    })
  }

  const getMemberTab = (userId: string): MemberCardTab | undefined => memberCardTab[userId]

  const prefetchMemberActivity = useCallback((userId: string) => {
    const periods: SheetActivityPeriod[] = ['today', '7d', '30d', 'ytd']
    for (const p of periods) {
      void queryClient.prefetchQuery({
        queryKey: ['member-activity', ws.workspaceId, userId, p],
        queryFn: () => getMemberActivityDetailAction(ws.workspaceId, userId, p),
        staleTime: 15_000,
      })
    }
  }, [queryClient, ws.workspaceId])

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
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#FEECEC] dark:bg-red-950/25 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400">{fieldPartnerCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700/80 dark:text-red-300/90">
              {t('team.statFieldPartner')}
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
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#FEECEC] dark:bg-red-950/25 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400">{fieldPartnerCount}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700/80 dark:text-red-300/90">
              {t('team.statFieldPartner')}
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
              placeholder={t('team.searchMembers')}
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
              onPrefetchActivity={() => prefetchMemberActivity(m.user_id)}
              onSetOnboardingWeek={week => setOnboardingWeekByMember(prev => ({ ...prev, [m.user_id]: week }))}
              onToggleOnboardingStep={(stepId, isDone) => { onMemberSearchChange(''); void toggleOnboardingStep(m.user_id, stepId, isDone) }}
              onLinkToPipeline={() => { onMemberSearchChange(''); void handleLinkMemberToPipeline(m) }}
              onInviteMember={() => { onMemberSearchChange(''); handleInviteMember(m) }}
              onSetOnboardingCoachData={setOnboardingCoachData}
              onOpenUpgrade={openUpgrade}
            />
          )}
        />

        {isPlusCapReached && (
          <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 to-rose-500/5 p-8 text-center space-y-4 shadow-lg my-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 text-xl">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-base font-bold text-white">
                {t('team.teamLimitReached')}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('team.teamLimitDescPro')}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => router.push('/odeme')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition active:scale-95 cursor-pointer shadow-lg shadow-pink-500/15"
              >
                <span>{t('team.upgradeToPro')}</span>
              </button>
            </div>
          </div>
        )}

        {isSolo && isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-5 py-4 text-center text-sm font-semibold text-[var(--text-2)] leading-relaxed border border-[var(--border)]">
            {t('team.soloHint')}
          </p>
        )}
        {!isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-5 py-4 text-center text-sm font-semibold text-[var(--text-2)] leading-relaxed border border-[var(--border)]">
            {t('team.memberHint')}
          </p>
        )}

        {hasTeamTools ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] pt-2">
            <button
              type="button"
              onClick={() => setToolsOpen(v => !v)}
              aria-expanded={toolsOpen}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 cursor-pointer"
            >
              <span className="text-sm font-bold text-[var(--text-1)]">
                {t('team.toolsCollapsibleTitle')}
              </span>
              <ChevronDown
                className={clsx(
                  'h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform',
                  toolsOpen && 'rotate-180',
                )}
              />
            </button>
            {toolsOpen ? (
              <div className="space-y-6 border-t border-[var(--border)] px-4 pb-4 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                {isLeader ? (
                  <InviteTeammateSection
                    inviteCode={inviteCode}
                    copied={copied}
                    onCopy={onCopyInviteCode}
                    t={t}
                  />
                ) : null}

                {!hasUpline ? (
                  <JoinByInviteSection
                    inviteCodeInput={inviteCodeInput}
                    joining={joining}
                    onInviteCodeChange={onInviteCodeChange}
                    onSubmit={onJoinSubmit}
                    t={t}
                  />
                ) : null}

                {isLeader && teamPageUnlocked ? (
                  <BroadcastPanel members={visibleMembers} t={t} />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      {UpgradePrompt}
      </>
  )
}
