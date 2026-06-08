'use client'

import { useState, useEffect, useCallback, type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import {
  Crown, Check, TrendingUp, BarChart2, Rocket, Bot,
  Phone, Search, BarChart3, Target,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { getTeamMemberCardClasses } from '@/lib/ui/teamMemberCard'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import { ONBOARDING_STEP_COUNT } from '@/lib/domain/pulse'
import { waHref } from '@/lib/utils/waLink'
import type { MemberRow } from '@/lib/team/types'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import { MemberActivitySheet } from '@/app/(dashboard)/_components/team/MemberActivitySheet'
import { getMemberActivityDetailAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import type { SheetActivityPeriod } from '@/lib/domain/pulse'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { addTeamMemberAsCandidateAction } from '../actions'
import { invalidateHubMetrics } from '@/lib/query/invalidateHubMetrics'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

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
}

type MemberCardTab = 'funnel' | 'onboarding' | 'call' | 'whatsapp' | 'activity'
type FieldCardTab = 'aiInvite' | 'nmmInvite'

const MEMBER_CARD_TABS: MemberCardTab[] = ['funnel', 'onboarding', 'call', 'whatsapp', 'activity']
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
    return { member: parsed.member ?? {}, field: parsed.field ?? {} }
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

export function TeamPerformanceSection(props: TeamPerformanceSectionProps) {
  const {
    t, lang, ws, members, visibleMembers, isLeader, isSolo, isPlusCapReached, hasMasterAccess,
    setOnboardingCoachData,
    toggleOnboardingStep, handleInviteMember,
    memberSearch, onMemberSearchChange,
    teamPulseUnlocked, teamPageUnlocked,
    memberGoalsMap = {},
  } = props
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [linkingMemberId, setLinkingMemberId] = useState<string | null>(null)
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  async function handleLinkMemberToPipeline(member: MemberRow) {
    if (!member.full_name || linkingMemberId) return
    setLinkingMemberId(member.user_id)
    try {
      const result = await addTeamMemberAsCandidateAction(ws.workspaceId, member.full_name, {
        memberPhone: member.phone,
      })
      invalidateHubMetrics(queryClient, ws.workspaceId)
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

    setMemberCardTab(member)
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
    const periods: SheetActivityPeriod[] = ['today', '7d', '30d']
    for (const p of periods) {
      void queryClient.prefetchQuery({
        queryKey: ['member-activity', ws.workspaceId, userId, p],
        queryFn: () => getMemberActivityDetailAction(ws.workspaceId, userId, p),
        staleTime: 15_000,
      })
    }
  }, [queryClient, ws.workspaceId])

  const selectFieldTab = (userId: string, tab: FieldCardTab) => {
    setFieldCardTab(prev => {
      const next = {
        ...prev,
        [userId]: prev[userId] === tab ? undefined : tab,
      }
      syncPerfTabsToUrl(memberCardTab, next)
      return next
    })
  }

  const getFieldTab = (userId: string): FieldCardTab | undefined => fieldCardTab[userId]

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
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          {t('team.performancePanel')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[#E8F5E9] dark:bg-emerald-950/25 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">1</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-300/90">
              {t('team.statLeader')}
            </p>
          </div>
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
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          {t('team.performancePanel')}
        </h2>

        {/* Özet istatistik kartları */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[#E8F5E9] dark:bg-emerald-950/25 p-5 sm:p-6 shadow-sm">
            <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">1</p>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-300/90">
              {t('team.statLeader')}
            </p>
          </div>
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
              value={memberSearch}
              onChange={e => onMemberSearchChange(e.target.value)}
              placeholder={t('team.searchMembers')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition"
            />
          </div>
        )}

        {/* Üye performans listesi */}
        <ul className="space-y-5">
          {visibleMembers.map(m => {
            const isCurrentUser = m.user_id === ws.userId
            const lastActiveDate = m.last_activity_at ? new Date(m.last_activity_at) : null
            const daysInactive = lastActiveDate ? Math.floor((now - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : 999
            const isInactive = daysInactive >= 7 && !isCurrentUser
            const onboardingDone = m.onboarding_steps?.length ?? 0
            const onboardingPct = Math.min(100, Math.round((onboardingDone / ONBOARDING_STEP_COUNT) * 100))
            const telHref = m.phone ? `tel:${m.phone.replace(/\s/g, '')}` : null
            const waQuick = waHref(m.phone, t('team.activityWaCheckIn', { name: (m.full_name ?? '').split(' ')[0] || t('common.member') }))

            return (
              <li
                key={m.user_id}
                className={clsx(
                  'overflow-hidden rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-sm hover:shadow-md space-y-4',
                  getTeamMemberCardClasses(m, isInactive)
                )}
              >
                {/* Kart üst: kompakt profil */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  {(() => {
                    const roleBadge = m.role === 'leader' ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200/30 dark:border-amber-900/20 px-2 py-0.5 text-[10px] font-black text-[#854F0B] dark:text-amber-400 leading-none">
                        <Crown className="h-3 w-3" strokeWidth={2.5} />
                        <span>{t('common.leader')}</span>
                      </span>
                    ) : m.isAppUser !== false ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200/30 dark:border-purple-900/20 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 leading-none">
                        <span>💎</span>
                        <span>{t('team.nmmPartner')}</span>
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/30 dark:border-zinc-700/20 px-2 py-0.5 text-[10px] font-black text-zinc-600 dark:text-zinc-400 leading-none">
                        <span>🤝</span>
                        <span>{t('team.fieldPartner')}</span>
                      </span>
                    )
                    const profileClass = 'flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3'
                    const profileInner = (
                      <>
                        <PersonAvatar
                          name={m.full_name ?? '?'}
                          imageUrl={m.avatar_url}
                          size="md"
                          className="font-black shrink-0"
                        />
                        <p className="min-w-0 truncate text-sm sm:text-base font-black text-[var(--text-1)] leading-tight">
                          {m.full_name ?? t('statsPage.unnamedMember')}
                        </p>
                        {roleBadge}
                      </>
                    )
                    return m.pipeline_id ? (
                      <Link href={`/pipeline/${m.pipeline_id}`} className={`${profileClass} hover:opacity-80 transition cursor-pointer`}>
                        {profileInner}
                      </Link>
                    ) : (
                      <div className={profileClass}>{profileInner}</div>
                    )
                  })()}
                </div>

                {isLeader && m.isAppUser !== false && m.role === 'member' && !m.pipeline_id && (
                  <button
                    type="button"
                    disabled={linkingMemberId === m.user_id}
                    onClick={e => {
                      e.stopPropagation()
                      void handleLinkMemberToPipeline(m)
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand/5 px-4 py-2.5 text-xs font-bold text-brand transition hover:bg-brand/10 disabled:opacity-50 sm:w-auto"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span>{t('team.linkToPipeline')}</span>
                  </button>
                )}

                {/* Saha ortağı: davet sekmeleri */}
                {m.isAppUser === false && (() => {
                  const activeFieldTab = getFieldTab(m.user_id)
                  return (
                    <div className="border-t border-dashed border-[var(--border)] pt-4 space-y-4">
                      <div
                        className="flex items-stretch gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1"
                        role="tablist"
                        aria-label={t('team.fieldPartnerTabs')}
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeFieldTab === 'aiInvite'}
                          onClick={e => {
                            e.stopPropagation()
                            selectFieldTab(m.user_id, 'aiInvite')
                          }}
                          className={clsx(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] sm:text-xs font-bold transition-all cursor-pointer min-w-0',
                            activeFieldTab === 'aiInvite'
                              ? 'bg-[var(--bg-card)] text-[#534AB7] dark:text-indigo-300 shadow-sm border border-[var(--border)]'
                              : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                          )}
                        >
                          <Bot className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t('team.fieldAiInviteTab')}</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeFieldTab === 'nmmInvite'}
                          onClick={e => {
                            e.stopPropagation()
                            selectFieldTab(m.user_id, 'nmmInvite')
                          }}
                          className={clsx(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] sm:text-xs font-black transition-all cursor-pointer min-w-0',
                            activeFieldTab === 'nmmInvite'
                              ? 'bg-[var(--bg-card)] text-emerald-700 dark:text-emerald-400 shadow-sm border border-[var(--border)]'
                              : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                          )}
                        >
                          <WhatsAppIcon className="h-4 w-4 shrink-0 fill-current" />
                          <span className="truncate">{t('team.inviteToNmm')}</span>
                        </button>
                      </div>

                      {activeFieldTab != null && (
                        <div
                          className="animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6"
                          role="tabpanel"
                        >
                          {activeFieldTab === 'aiInvite' ? (
                            <>
                              <p className="text-sm text-[var(--text-2)] text-center leading-relaxed max-w-sm">
                                {t('team.aiInviteTitle')}
                              </p>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  if (m.pipeline_id) router.push(`/pipeline/${m.pipeline_id}?nmmInvite=1`)
                                }}
                                disabled={!m.pipeline_id}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#534AB7]/30 dark:border-indigo-400/40 bg-[#534AB7]/5 dark:bg-indigo-400/10 text-[#534AB7] dark:text-indigo-300 hover:bg-[#534AB7]/10 dark:hover:bg-indigo-400/20 active:scale-95 transition cursor-pointer disabled:opacity-40 px-5 py-3 text-sm font-bold"
                              >
                                <Bot className="h-5 w-5" />
                                <span>{t('team.fieldAiInviteTab')}</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-[var(--text-2)] text-center leading-relaxed max-w-sm">
                                {t('team.fieldNmmInviteHint')}
                              </p>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleInviteMember(m)
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white px-5 py-3 text-sm font-black shadow-md cursor-pointer"
                              >
                                <WhatsAppIcon className="h-5 w-5 fill-current text-white" />
                                <span>{t('team.inviteToNmm')}</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* NMM kullanıcıları: ikon sekmeleri + sekme içeriği */}
                {m.isAppUser !== false && (() => {
                  const activeTab = getMemberTab(m.user_id)
                  const weekTab = getOnboardingWeek(m.user_id)
                  const memberTabs: {
                    id: MemberCardTab
                    Icon: ComponentType<{ className?: string }>
                    label: string
                    show: boolean
                    wa?: boolean
                  }[] = [
                    { id: 'funnel', Icon: TrendingUp, label: t('team.funnelDistribution'), show: true },
                    { id: 'onboarding', Icon: Rocket, label: t('team.correctStartGuide'), show: m.role === 'member' },
                    { id: 'activity', Icon: BarChart3, label: t('team.activityBtn'), show: isLeader },
                    { id: 'call', Icon: Phone, label: t('team.callBtn'), show: !!telHref },
                    { id: 'whatsapp', Icon: WhatsAppIcon, label: 'WhatsApp', show: !!waQuick, wa: true },
                  ]
                  const visibleTabs = memberTabs.filter(tab => tab.show)

                  const funnelPanel = (
                    <div className="grid grid-cols-2 gap-3 pt-1 text-center sm:grid-cols-4">
                      <div className="rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 p-4 border border-blue-100/30 dark:border-blue-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                        <span className="block text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{m.yeni_count || 0}</span>
                        <span className="text-xs text-[var(--text-2)] font-bold block mt-1">{t('stages.yeni')}</span>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 p-4 border border-emerald-100/30 dark:border-emerald-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                        <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{m.sunum_count || 0}</span>
                        <span className="text-xs text-[var(--text-2)] font-bold block mt-1">{t('stages.sunum')}</span>
                      </div>
                      <div className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 p-4 border border-amber-100/30 dark:border-amber-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                        <span className="block text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{m.takip_count || 0}</span>
                        <span className="text-xs text-[var(--text-2)] font-bold block mt-1">{t('stages.takip')}</span>
                      </div>
                      <div className="rounded-2xl bg-[#FAEEDA]/50 dark:bg-[#3a2200]/20 p-4 border border-[#FAEEDA]/30 dark:border-[#3a2200]/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                        <span className="block text-xl font-black text-[#854F0B] dark:text-[#fcd34d] tabular-nums">{m.katildi_count || 0}</span>
                        <span className="text-xs font-black text-[#854F0B] dark:text-[#fcd34d] block mt-1">{t('stages.katildi')}</span>
                      </div>
                    </div>
                  )

                  return (
                    <div className="border-t border-dashed border-[var(--border)] pt-4 space-y-4">
                      <div
                        className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1"
                        role="tablist"
                        aria-label={t('team.memberDetailTabs')}
                      >
                        {visibleTabs.map(({ id, Icon, label, wa }) => (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === id}
                            aria-label={label}
                            title={label}
                            onClick={e => {
                              e.stopPropagation()
                              if (id === 'activity') prefetchMemberActivity(m.user_id)
                              selectMemberTab(m.user_id, id)
                            }}
                            onPointerEnter={() => {
                              if (id === 'activity') prefetchMemberActivity(m.user_id)
                            }}
                            className={clsx(
                              'flex h-10 flex-1 items-center justify-center rounded-lg transition-all cursor-pointer',
                              activeTab === id
                                ? 'bg-[var(--bg-card)] text-brand dark:text-indigo-300 shadow-sm border border-[var(--border)]'
                                : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                            )}
                          >
                            {wa ? (
                              <WhatsAppIcon className="h-5 w-5 fill-current" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </button>
                        ))}
                      </div>

                      {memberGoalsMap[m.user_id] && activeTab === 'onboarding' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                          <Target className="h-3.5 w-3.5 shrink-0" />
                          {t('team.memberGoalChip', {
                            people: memberGoalsMap[m.user_id].targetPeople,
                            months: memberGoalsMap[m.user_id].targetMonths,
                          })}
                        </div>
                      )}

                      {activeTab != null && (
                        <div
                          className="animate-in fade-in slide-in-from-top-1 duration-200"
                          role="tabpanel"
                        >
                          {!hasMasterAccess && m.user_id !== ws.userId ? (
                            <div className="rounded-2xl border border-[#534AB7]/30 bg-[#12111E]/40 p-6 text-center space-y-4 max-w-xl mx-auto my-3 backdrop-blur-xl">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#534AB7]/10 mx-auto text-[#534AB7]">
                                <Crown className="h-5 w-5 animate-bounce" />
                              </div>
                              <div>
                                <h4 className="text-sm font-extrabold text-white">
                                  {t('team.plusRequired')}
                                </h4>
                                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                  {t('team.plusRequiredDesc')}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  router.push('/odeme')
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-indigo-500/10 active:scale-95 transition cursor-pointer border-0"
                              >
                                <span>{t('team.upgradeToMaster')}</span>
                              </button>
                            </div>
                          ) : activeTab === 'funnel' ? (
                            funnelPanel
                          ) : activeTab === 'onboarding' ? (
                            <div className="space-y-4">
                              <div className="flex gap-2 bg-[var(--bg-subtle)] dark:bg-zinc-900/50 p-1 rounded-xl border border-[var(--border)]">
                                {([1, 2, 3, 4] as const).map(w => (
                                  <button
                                    key={w}
                                    type="button"
                                    onClick={() => setOnboardingWeekByMember(prev => ({ ...prev, [m.user_id]: w }))}
                                    className={clsx(
                                      'flex-1 text-xs font-extrabold py-2 rounded-lg transition-all cursor-pointer',
                                      weekTab === w
                                        ? 'bg-[var(--bg-card)] dark:bg-zinc-800 text-[#854F0B] dark:text-[#fbbf24] shadow-sm border border-[var(--border)]'
                                        : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                                    )}
                                  >
                                    {t('team.weekLabel', { w })}
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-end gap-2 text-xs">
                                  <span className="font-black tabular-nums text-[#854F0B] dark:text-[#fbbf24]">
                                    {onboardingDone}/{ONBOARDING_STEP_COUNT} · %{onboardingPct}
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                                  <div
                                    className="h-full rounded-full bg-[#854F0B] dark:bg-[#fbbf24] transition-all"
                                    style={{ width: `${onboardingPct}%` }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                {ONBOARDING_STEPS.filter(s => s.week === weekTab).map(step => {
                                  const isStepDone = m.onboarding_steps?.includes(step.id) ?? false
                                  return (
                                    <div
                                      key={step.id}
                                      className={clsx(
                                        'w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all',
                                        isStepDone
                                          ? 'border-emerald-200/50 dark:border-emerald-950/20 bg-emerald-50/5 dark:bg-emerald-950/5 text-[var(--text-1)]'
                                          : 'border-[var(--border)] bg-[var(--bg-subtle)] dark:bg-zinc-900/30 text-[var(--text-2)]'
                                      )}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => toggleOnboardingStep(m.user_id, step.id, isStepDone)}
                                        className="flex-1 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] transition-all"
                                      >
                                        <span className={clsx(
                                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                                          isStepDone ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--text-3)] bg-transparent'
                                        )}>
                                          {isStepDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                                        </span>
                                        <span className="text-sm font-semibold leading-tight pr-2">
                                          {lang === 'en' ? step.label_en : step.label_tr}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation()
                                          if (!hasAiFieldAccess) {
                                            openUpgrade('ai_field')
                                            return
                                          }
                                          setOnboardingCoachData({
                                            memberName: m.full_name || '',
                                            stepId: step.id,
                                            phone: m.phone ?? null,
                                          })
                                        }}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#0F6E56] dark:text-[#5eead4] hover:scale-105 active:scale-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer"
                                        title={t('team.aiCoachingScript')}
                                      >
                                        <Bot className="h-5 w-5" />
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : activeTab === 'call' && telHref ? (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
                              <p className="text-sm font-semibold text-[var(--text-2)] text-center">
                                {t('team.callMemberHint', {
                                  name: (m.full_name ?? '').split(' ')[0] || t('common.member'),
                                  phone: m.phone ?? '',
                                })}
                              </p>
                              <a
                                href={telHref}
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50/80 dark:bg-blue-950/20 px-6 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 transition active:scale-95"
                              >
                                <Phone className="h-5 w-5" />
                                {t('team.callBtn')}
                              </a>
                            </div>
                          ) : activeTab === 'whatsapp' && waQuick ? (
                            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
                              <p className="text-sm text-[var(--text-2)] text-center leading-relaxed max-w-sm">
                                {t('team.activityWaCheckIn', { name: (m.full_name ?? '').split(' ')[0] || t('common.member') })}
                              </p>
                              <a
                                href={waQuick}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition active:scale-95"
                              >
                                <WhatsAppIcon className="h-5 w-5 fill-current" />
                                WhatsApp
                              </a>
                            </div>
                          ) : activeTab === 'activity' && isLeader ? (
                            <MemberActivitySheet
                              embedded
                              workspaceId={ws.workspaceId}
                              member={{
                                userId: m.user_id,
                                fullName: m.full_name,
                                phone: m.phone,
                                pipelineHref: m.pipeline_id ? `/pipeline/${m.pipeline_id}` : null,
                              }}
                              teamPulseUnlocked={teamPulseUnlocked}
                              memberIsLeader={m.role === 'leader'}
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </li>
            )
          })}
        </ul>

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
      </section>
      {UpgradePrompt}
      </>
  )
}
