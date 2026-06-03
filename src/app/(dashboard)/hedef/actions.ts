'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  computeRoadmap,
  dailyTargetsForMonth,
  currentMonthIndex,
  type RoadmapStage,
  type FunnelCounts,
} from '@/lib/domain/roadmap'

export interface UserGoal {
  targetPeople: number
  targetMonths: number
  startAt: string
}

/** Bugünün UTC gün başlangıcı (aiUsage ile tutarlı pencere). */
function todayStartIso(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())).toISOString()
}

async function ownWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.workspace_id ?? null
}

/** Kullanıcının kendi hedefi (yoksa null). */
export async function fetchUserGoalAction(): Promise<UserGoal | null> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return null

  const { data } = await supabase
    .from('nmm_user_goals')
    .select('target_people, target_months, start_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return null
  return {
    targetPeople: data.target_people,
    targetMonths: data.target_months,
    startAt: data.start_at,
  }
}

/** Hedefi kaydeder/günceller (self). start_at yalnız ilk kayıtta set edilir. */
export async function saveUserGoalAction(input: {
  targetPeople: number
  targetMonths: number
}): Promise<UserGoal> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const targetPeople = Math.floor(input.targetPeople)
  const targetMonths = Math.floor(input.targetMonths)
  if (targetPeople < 1 || targetPeople > 100000) throw new Error('Geçersiz kişi sayısı.')
  if (targetMonths < 1 || targetMonths > 120) throw new Error('Geçersiz süre.')

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) throw new Error('Çalışma alanı bulunamadı.')

  // start_at'i korumak için mevcut kaydı kontrol et.
  const { data: existing } = await supabase
    .from('nmm_user_goals')
    .select('start_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const startAt = existing?.start_at ?? new Date().toISOString()

  const { error } = await supabase.from('nmm_user_goals').upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      target_people: targetPeople,
      target_months: targetMonths,
      start_at: startAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)

  return { targetPeople, targetMonths, startAt }
}

/** Mevcut doğrudan downline (ekip) sayısı — roadmap'in currentTeam'i. */
async function directTeamCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspaceId: string,
): Promise<number> {
  // parent_id iki formatta tutulabilir (user id VEYA workspace id) — ikisini de say.
  const { count } = await supabase
    .from('nmm_workspaces')
    .select('id', { count: 'exact', head: true })
    .or(`parent_id.eq.${userId},parent_id.eq.${workspaceId}`)
  return count ?? 0
}

export interface DailyProgress {
  hasGoal: boolean
  monthIndex: number
  totalMonths: number
  teamSize: number
  targetTeamSize: number
  targets: FunnelCounts
  actuals: FunnelCounts
  stage: RoadmapStage | null
}

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

/** Bugünün huni hedefleri (hedeften türetilmiş) + gerçekleşenleri (mevcut veriden). */
export async function getDailyProgressAction(): Promise<DailyProgress> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  const empty: DailyProgress = {
    hasGoal: false,
    monthIndex: 1,
    totalMonths: 0,
    teamSize: 0,
    targetTeamSize: 0,
    targets: EMPTY_FUNNEL,
    actuals: EMPTY_FUNNEL,
    stage: null,
  }
  if (!user) return empty

  const goal = await fetchUserGoalAction()
  const workspaceId = await ownWorkspaceId(supabase, user.id)
  const teamSize = workspaceId ? await directTeamCount(supabase, user.id, workspaceId) : 0

  // ── Gerçekleşenler (bugün) — mevcut veriden, çift giriş yok ──
  const since = todayStartIso()
  const [callsRes, stageRes, newCandRes] = await Promise.all([
    supabase
      .from('nmm_daily_actions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'call')
      .gte('created_at', since),
    supabase
      .from('nmm_daily_actions')
      .select('note')
      .eq('user_id', user.id)
      .eq('action_type', 'stage_change')
      .gte('created_at', since),
    supabase
      .from('nmm_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .gte('created_at', since),
  ])

  let sunum = 0
  let yeniUye = 0
  for (const row of stageRes.data ?? []) {
    const note = (row.note ?? '').toLowerCase().trim()
    if (note === 'sunum' || note === 'sunum yapıldı') sunum++
    else if (note === 'katildi' || note === 'katıldı' || note === 'joined') yeniUye++
  }

  const actuals: FunnelCounts = {
    arama: callsRes.count ?? 0,
    tanisma: newCandRes.count ?? 0,
    sunum,
    yeniUye,
  }

  if (!goal) return { ...empty, teamSize, actuals }

  const roadmap = computeRoadmap(goal.targetPeople, goal.targetMonths, teamSize)
  const monthIndex = currentMonthIndex(new Date(goal.startAt), goal.targetMonths)
  const stage = roadmap[monthIndex - 1] ?? roadmap[roadmap.length - 1] ?? null
  const targets = dailyTargetsForMonth(stage ?? undefined)

  return {
    hasGoal: true,
    monthIndex,
    totalMonths: goal.targetMonths,
    teamSize,
    targetTeamSize: goal.targetPeople,
    targets,
    actuals,
    stage,
  }
}

/** Yol haritası kademeleri (UI için) — hedeften türetilir. */
export async function getRoadmapAction(): Promise<RoadmapStage[]> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return []
  const goal = await fetchUserGoalAction()
  if (!goal) return []
  const workspaceId = await ownWorkspaceId(supabase, user.id)
  const teamSize = workspaceId ? await directTeamCount(supabase, user.id, workspaceId) : 0
  return computeRoadmap(goal.targetPeople, goal.targetMonths, teamSize)
}
