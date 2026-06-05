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
import { periodStartIso } from '@/lib/domain/pulse'
import type { TeamMember } from '@/hooks/useTeamMembers'
import type { MemberRow } from '@/lib/team/types'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import type { TeamFieldActivityResult } from '@/app/(dashboard)/istatistikler/teamActivityActions'

const ONBOARDING_TOTAL = ONBOARDING_STEPS.length

async function resolveWorkspaceId(): Promise<string | null> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return null
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (data?.workspace_id) return data.workspace_id
  const { data: owned } = await supabase
    .from('nmm_workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  return owned?.id ?? null
}

export type CrownDailyPayload = {
  progress: DailyProgress
  goal: UserGoal | null
}

export async function getCrownDailyPageAction(): Promise<CrownDailyPayload> {
  const [progress, goal] = await Promise.all([getDailyProgressAction(), fetchUserGoalAction()])
  return { progress, goal }
}

export type CrownTeamPayload = {
  rows: MemberRow[]
  videoMap: Record<string, VideoProgressSummary>
  goalsMap: Record<string, MemberGoalRow>
  totalTeam: number
}

export async function getCrownTeamPageAction(workspaceId: string): Promise<CrownTeamPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [videoMap, goalsMap] = await Promise.all([
    getTeamVideoSummaryMapAction(memberIds),
    getMemberGoalsMapAction(workspaceId, memberIds),
  ])
  return {
    rows: bundle.ekipRows,
    videoMap,
    goalsMap,
    totalTeam: bundle.ekipRows.length,
  }
}

export type CrownVideoPayload = {
  members: TeamMember[]
  videoTotal: number
  videoMap: Record<string, VideoProgressSummary>
  leaderSummary: VideoProgressSummary | null
}

export async function getCrownVideoPageAction(workspaceId: string): Promise<CrownVideoPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [catalog, videoMap] = await Promise.all([
    getVideoCatalogAction(workspaceId),
    getTeamVideoSummaryMapAction(memberIds),
  ])
  const { user } = await getAuthUser()
  const leaderSummary = user ? (videoMap[user.id] ?? null) : null
  return {
    members: bundle.members,
    videoTotal: catalog.summary.total,
    videoMap,
    leaderSummary: leaderSummary ?? catalog.summary,
  }
}

export type CrownPeriodPayload = {
  members: TeamMember[]
  activity: TeamFieldActivityResult
  joinedInPeriod: number
}

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

export async function getCrownWeeklyPageAction(workspaceId: string): Promise<CrownPeriodPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [activity, joinedInPeriod] = await Promise.all([
    getTeamFieldActivityAction(workspaceId, '7d', memberIds),
    countJoinedInPeriod(memberIds, periodStartIso('7d')),
  ])
  return { members: bundle.members, activity, joinedInPeriod }
}

export async function getCrownMonthlyPageAction(workspaceId: string): Promise<CrownPeriodPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [activity, joinedInPeriod] = await Promise.all([
    getTeamFieldActivityAction(workspaceId, '30d', memberIds),
    countJoinedInPeriod(memberIds, periodStartIso('30d')),
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
}

export type CrownFirst30Payload = {
  members: CrownFirst30Member[]
}

export async function getCrownFirst30PageAction(workspaceId: string): Promise<CrownFirst30Payload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const members: CrownFirst30Member[] = bundle.members.map(m => {
    const done = m.onboarding_steps?.length ?? 0
    const pct = ONBOARDING_TOTAL > 0 ? Math.round((done / ONBOARDING_TOTAL) * 100) : 0
    return {
      userId: m.user_id,
      fullName: m.full_name ?? '—',
      done,
      total: ONBOARDING_TOTAL,
      pct,
    }
  })
  members.sort((a, b) => b.pct - a.pct || b.done - a.done)
  return { members }
}

export async function getCrownWorkspaceIdAction(): Promise<string | null> {
  return resolveWorkspaceId()
}
