'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  getDailyProgressAction,
  fetchUserGoalAction,
  type DailyProgress,
  type UserGoal,
} from '@/app/(dashboard)/hedef/actions'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import {
  getTeamVideoSummaryMapAction,
  getVideoCatalogAction,
} from '@/app/(dashboard)/egitim/videoActions'
import { getMemberGoalsMapAction } from '@/app/(dashboard)/ekip/memberGoalsActions'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import { periodStartIso, type PulsePeriod } from '@/lib/domain/pulse'

import type { TeamMember } from '@/hooks/useTeamMembers'
import type { MemberRow } from '@/lib/team/types'
import { VIDEO_COMPLETE_PERCENT, type VideoProgressSummary } from '@/lib/domain/videoProgress'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import type { TeamFieldActivityResult } from '@/app/(dashboard)/istatistikler/teamActivityActions'


const ONBOARDING_TOTAL = ONBOARDING_STEPS.length

async function countJoinedInPeriod(
  memberIds: string[],
  startIso: string | null,
): Promise<number> {
  if (memberIds.length === 0) return 0
  const supabase = await createClient()
  let q = supabase
    .from('nmm_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('stage', 'katildi')
    .in('owner_id', memberIds)
  if (startIso) q = q.gte('updated_at', startIso)
  const { count } = await q
  return count ?? 0
}

export type CrownDailyPayload = {
  progress: DailyProgress
  goal: UserGoal | null
}

export async function getCrownDailyPageAction(): Promise<CrownDailyPayload> {
  const [progress, goal] = await Promise.all([getDailyProgressAction(), fetchUserGoalAction()])
  return { progress, goal }
}

export type CrownTeamStats = {
  activeCount: number
  weeklyCalls: number
  newMembersWeek: number
}

export type CrownTeamPayload = {
  rows: MemberRow[]
  videoMap: Record<string, VideoProgressSummary>
  goalsMap: Record<string, MemberGoalRow>
  totalTeam: number
  stats: CrownTeamStats
}

export async function getCrownTeamPageAction(workspaceId: string): Promise<CrownTeamPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [videoMap, goalsMap, activity, newMembersWeek] = await Promise.all([
    getTeamVideoSummaryMapAction(memberIds),
    getMemberGoalsMapAction(workspaceId, memberIds),
    getTeamFieldActivityAction(workspaceId, '7d', memberIds),
    countJoinedInPeriod(memberIds, periodStartIso('7d')),
  ])
  const now = Date.now()
  const activeCount = bundle.ekipRows.filter(m => {
    if (!m.last_activity_at) return false
    return (now - new Date(m.last_activity_at).getTime()) / 86_400_000 < 7
  }).length
  return {
    rows: bundle.ekipRows,
    videoMap,
    goalsMap,
    totalTeam: bundle.ekipRows.length,
    stats: {
      activeCount,
      weeklyCalls: activity.totals.calls,
      newMembersWeek,
    },
  }
}

export type CrownVideoHighlight = {
  key: string
  titleTr: string
  titleEn: string
}

export type CrownVideoPayload = {
  members: TeamMember[]
  videoTotal: number
  videoMap: Record<string, VideoProgressSummary>
  leaderSummary: VideoProgressSummary | null
  lastWatched: CrownVideoHighlight | null
  nextVideo: CrownVideoHighlight | null
  teamAvgPct: number
}

export async function getCrownVideoPageAction(workspaceId: string): Promise<CrownVideoPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [catalog, videoMap, { user }] = await Promise.all([
    getVideoCatalogAction(workspaceId),
    getTeamVideoSummaryMapAction(memberIds),
    getAuthUser(),
  ])
  const leaderSummary = user ? (videoMap[user.id] ?? null) : null

  const sorted = [...catalog.videos].sort((a, b) => a.sortOrder - b.sortOrder)
  let lastWatched: CrownVideoHighlight | null = null
  let lastCompletedAt = ''
  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    const done = p?.status === 'completed' || (p?.watch_percent ?? 0) >= VIDEO_COMPLETE_PERCENT
    const at = p?.completed_at ?? p?.started_at ?? ''
    if (done && at >= lastCompletedAt) {
      lastCompletedAt = at
      lastWatched = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
    }
  }
  let nextVideo: CrownVideoHighlight | null = null
  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    const done = p?.status === 'completed' || (p?.watch_percent ?? 0) >= VIDEO_COMPLETE_PERCENT
    if (!done) {
      nextVideo = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
      break
    }
  }

  const pcts = Object.values(videoMap).map(s => s.pct)
  const teamAvgPct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0

  return {
    members: bundle.members,
    videoTotal: catalog.summary.total,
    videoMap,
    leaderSummary: leaderSummary ?? catalog.summary,
    lastWatched,
    nextVideo,
    teamAvgPct,
  }
}

export type CrownPeriodPayload = {
  members: TeamMember[]
  activity: TeamFieldActivityResult
  joinedInPeriod: number
}

export async function getCrownTeamWeeklyPulseAction(workspaceId: string): Promise<CrownPeriodPayload> {
  return getCrownTeamPeriodPulseAction(workspaceId, '7d')
}

export async function getCrownTeamMonthlyPulseAction(workspaceId: string): Promise<CrownPeriodPayload> {
  return getCrownTeamPeriodPulseAction(workspaceId, '30d')
}

export async function getCrownTeamPeriodPulseAction(
  workspaceId: string,
  period: PulsePeriod,
): Promise<CrownPeriodPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [activity, joinedInPeriod] = await Promise.all([
    getTeamFieldActivityAction(workspaceId, period, memberIds),
    countJoinedInPeriod(memberIds, periodStartIso(period)),
  ])
  return { members: bundle.members, activity, joinedInPeriod }
}

export type CrownMemberEntry = {
  userId: string
  fullName: string
  entryDays: number
  lastEntry: string | null
  calls: number
  newCandidates: number
  presentations: number
  newMembers: number
}

export type CrownEntriesPayload = {
  entries: CrownMemberEntry[]
}

export async function getCrownEntriesPageAction(workspaceId: string): Promise<CrownEntriesPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  if (memberIds.length === 0) return { entries: [] }

  const supabase = await createClient()
  const startIso = periodStartIso('30d')

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('user_id, action_type, created_at, note')
    .in('user_id', memberIds)

  if (startIso) actionsQuery = actionsQuery.gte('created_at', startIso)

  const { data: actions } = await actionsQuery

  const byUser: Record<
    string,
    { days: Set<string>; last: string | null; calls: number; newCand: number; sunum: number; yeniUye: number }
  > = {}
  for (const id of memberIds) {
    byUser[id] = { days: new Set(), last: null, calls: 0, newCand: 0, sunum: 0, yeniUye: 0 }
  }

  for (const act of actions ?? []) {
    const bucket = byUser[act.user_id]
    if (!bucket) continue
    const day = act.created_at.slice(0, 10)
    bucket.days.add(day)
    if (!bucket.last || act.created_at > bucket.last) bucket.last = act.created_at
    if (act.action_type === 'call') bucket.calls++
    else if (act.action_type === 'stage_change') {
      const note = (act.note ?? '').toLowerCase().trim()
      if (note === 'sunum' || note === 'sunum yapıldı') bucket.sunum++
      else if (note === 'katildi' || note === 'katıldı' || note === 'joined') bucket.yeniUye++
    }
  }

  let candQuery = supabase.from('nmm_candidates').select('owner_id').in('owner_id', memberIds)
  if (startIso) candQuery = candQuery.gte('created_at', startIso)
  const { data: newCands } = await candQuery
  for (const c of newCands ?? []) {
    const bucket = byUser[c.owner_id]
    if (bucket) bucket.newCand++
  }

  const entries: CrownMemberEntry[] = bundle.members.map(m => {
    const b = byUser[m.user_id]
    return {
      userId: m.user_id,
      fullName: m.full_name ?? '—',
      entryDays: b?.days.size ?? 0,
      lastEntry: b?.last ? b.last.slice(0, 10) : m.last_activity_at?.slice(0, 10) ?? null,
      calls: b?.calls ?? 0,
      newCandidates: b?.newCand ?? 0,
      presentations: b?.sunum ?? 0,
      newMembers: b?.yeniUye ?? 0,
    }
  })

  entries.sort((a, b) => b.entryDays - a.entryDays)
  return { entries }
}

export type CrownFirst30Member = {
  userId: string
  fullName: string
  done: number
  total: number
  pct: number
  joinedAt: string | null
  phone: string | null
  daysLeft: number
  daysElapsed: number
  missingStepIds: string[]
  riskLevel: 'ok' | 'warn' | 'danger'
}

export type CrownFirst30Payload = {
  members: CrownFirst30Member[]
}

export async function getCrownFirst30PageAction(workspaceId: string): Promise<CrownFirst30Payload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const now = Date.now()
  const members: CrownFirst30Member[] = bundle.ekipRows.map(m => {
    const doneSteps = m.onboarding_steps ?? []
    const done = doneSteps.length
    const pct = ONBOARDING_TOTAL > 0 ? Math.round((done / ONBOARDING_TOTAL) * 100) : 0
    const joinedMs = m.joined_at ? new Date(m.joined_at).getTime() : now
    const daysElapsed = Math.min(30, Math.floor((now - joinedMs) / 86_400_000))
    const daysLeft = Math.max(0, 30 - daysElapsed)
    const missingStepIds = ONBOARDING_STEPS.filter(s => !doneSteps.includes(s.id)).map(s => s.id)
    const riskLevel: CrownFirst30Member['riskLevel'] =
      pct < 30 && daysElapsed > 20 ? 'danger' : pct < 50 && daysElapsed > 14 ? 'warn' : 'ok'
    return {
      userId: m.user_id,
      fullName: m.full_name ?? '—',
      done,
      total: ONBOARDING_TOTAL,
      pct,
      joinedAt: m.joined_at,
      phone: m.phone ?? null,
      daysLeft,
      daysElapsed,
      missingStepIds,
      riskLevel,
    }
  })
  members.sort((a, b) => a.daysLeft - b.daysLeft || a.pct - b.pct)
  return { members }
}
