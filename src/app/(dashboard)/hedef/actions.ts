'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  EMPTY_FUNNEL,
  computeRoadmap,
  dailyTargetsForMonth,
  currentMonthIndex,
  type RoadmapStage,
  type FunnelCounts,
} from '@/lib/domain/roadmap'
import { stageForRoadmapMonth } from '@/lib/domain/hubFunnelTargets'
import { fetchFunnelActualsForToday } from '@/lib/domain/funnelActuals'

export interface UserGoal {
  targetPeople: number
  targetMonths: number
  startAt: string
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

/** Downline üyenin kendi belirlediği hedefi (lider okur; yoksa null). */
export async function fetchMemberUserGoalAction(memberUserId: string): Promise<UserGoal | null> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user || !memberUserId) return null

  const { data } = await supabase
    .from('nmm_user_goals')
    .select('target_people, target_months, start_at')
    .eq('user_id', memberUserId)
    .maybeSingle()

  if (!data) return null
  return {
    targetPeople: data.target_people,
    targetMonths: data.target_months,
    startAt: data.start_at,
  }
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

/**
 * Mevcut doğrudan downline (ekip) sayısı — roadmap'in currentTeam'i. Kolon-kısıtlı
 * definer rpc (055) auth.uid()'in downline'ını (her iki parent_id formatı dahil) döndürür.
 */
async function directTeamCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number> {
  const { data } = await supabase.rpc('nmm_leader_downline_workspaces')
  return data?.length ?? 0
}

/** Üyenin doğrudan downline workspace sayısı (yol haritası currentTeam). */
async function memberDirectTeamCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberUserId: string,
): Promise<number> {
  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('id')
    .eq('owner_id', memberUserId)
    .maybeSingle()
  if (!ws) return 0

  const { count } = await supabase
    .from('nmm_workspaces')
    .select('id', { count: 'exact', head: true })
    .or(`parent_id.eq.${ws.id},parent_id.eq.${memberUserId}`)

  return count ?? 0
}

/**
 * Downline üyenin huni hedefleri — önce kendi hedefi (nmm_user_goals), yoksa lider ataması (nmm_member_goals).
 */
export async function getMemberGoalFunnelContextAction(
  workspaceId: string,
  memberUserId: string,
): Promise<GoalFunnelContextPayload> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  const empty: GoalFunnelContextPayload = {
    hasGoal: false,
    goal: null,
    roadmap: [],
    teamSize: 0,
  }
  if (!user || !memberUserId) return empty

  const [userGoalRes, memberGoalRes, teamSize] = await Promise.all([
    supabase
      .from('nmm_user_goals')
      .select('target_people, target_months, start_at')
      .eq('user_id', memberUserId)
      .maybeSingle(),
    supabase
      .from('nmm_member_goals')
      .select('target_people, target_months, created_at')
      .eq('workspace_id', workspaceId)
      .eq('member_user_id', memberUserId)
      .maybeSingle(),
    memberDirectTeamCount(supabase, memberUserId),
  ])

  const row = userGoalRes.data
  const goal: UserGoal | null = row
    ? {
        targetPeople: row.target_people,
        targetMonths: row.target_months,
        startAt: row.start_at,
      }
    : memberGoalRes.data
      ? {
          targetPeople: memberGoalRes.data.target_people,
          targetMonths: memberGoalRes.data.target_months,
          startAt: memberGoalRes.data.created_at,
        }
      : null

  if (!goal) return { ...empty, teamSize }

  return {
    hasGoal: true,
    goal,
    roadmap: computeRoadmap(goal.targetPeople, goal.targetMonths, teamSize),
    teamSize,
  }
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

export interface GoalFunnelContextPayload {
  hasGoal: boolean
  goal: UserGoal | null
  roadmap: RoadmapStage[]
  teamSize: number
}

/** Hedef + yol haritası — Saha Özetim dönem hedefleri için tek kaynak. */
export async function getGoalFunnelContextAction(): Promise<GoalFunnelContextPayload> {
  return getGoalFunnelContextCached()
}

const getGoalFunnelContextCached = cache(async (): Promise<GoalFunnelContextPayload> => {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  const empty: GoalFunnelContextPayload = {
    hasGoal: false,
    goal: null,
    roadmap: [],
    teamSize: 0,
  }
  if (!user) return empty

  const [goal, workspaceId] = await Promise.all([
    fetchUserGoalAction(),
    ownWorkspaceId(supabase, user.id),
  ])
  const teamSize = workspaceId ? await directTeamCount(supabase) : 0
  if (!goal) return { ...empty, teamSize }

  return {
    hasGoal: true,
    goal,
    roadmap: computeRoadmap(goal.targetPeople, goal.targetMonths, teamSize),
    teamSize,
  }
})

/** Bugünün huni hedefleri (hedeften türetilmiş) + gerçekleşenleri (mevcut veriden). */
/**
 * Server action sarmalayıcısı — gerçek iş `cache()`'li impl'de. Tek bir render
 * içinde birden çok hub action bunu çağırdığında (örn. saha-ozetim SSR prefetch'i
 * 4 hub periyodunu birden ısıtırken) hesaplama 4 kez değil 1 kez yapılır.
 * ('use server' export'u async fonksiyon olmalı; bu yüzden cache impl'i sarmalanır.)
 */
export async function getDailyProgressAction(): Promise<DailyProgress> {
  return getDailyProgressCached()
}

const getDailyProgressCached = cache(async (): Promise<DailyProgress> => {
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

  const [ctx, actuals] = await Promise.all([
    getGoalFunnelContextCached(),
    fetchFunnelActualsForToday(supabase, user.id),
  ])

  if (!ctx.hasGoal || !ctx.goal) return { ...empty, teamSize: ctx.teamSize, actuals }

  const monthIndex = currentMonthIndex(new Date(ctx.goal.startAt), ctx.goal.targetMonths)
  const stage = stageForRoadmapMonth(ctx.roadmap, monthIndex) ?? null
  const targets = dailyTargetsForMonth(stage ?? undefined)

  return {
    hasGoal: true,
    monthIndex,
    totalMonths: ctx.goal.targetMonths,
    teamSize: ctx.teamSize,
    targetTeamSize: ctx.goal.targetPeople,
    targets,
    actuals,
    stage,
  }
})

/** Yol haritası kademeleri (UI için) — hedeften türetilir. */
export async function getRoadmapAction(): Promise<RoadmapStage[]> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return []
  const goal = await fetchUserGoalAction()
  if (!goal) return []
  const workspaceId = await ownWorkspaceId(supabase, user.id)
  const teamSize = workspaceId ? await directTeamCount(supabase) : 0
  return computeRoadmap(goal.targetPeople, goal.targetMonths, teamSize)
}

export interface GoalDashboard {
  goal: UserGoal | null
  progress: DailyProgress
  roadmap: RoadmapStage[]
}

/**
 * HedefKart'ın TÜM verisi TEK geçişte (goal + günlük progress + roadmap). Üç ayrı
 * action yerine bunu kullan → daha az round-trip, "sonra dolma" yok (prefetch'lenir).
 */
export async function getGoalDashboardAction(): Promise<GoalDashboard> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  const emptyProgress: DailyProgress = {
    hasGoal: false, monthIndex: 1, totalMonths: 0, teamSize: 0,
    targetTeamSize: 0, targets: EMPTY_FUNNEL, actuals: EMPTY_FUNNEL, stage: null,
  }
  if (!user) return { goal: null, progress: emptyProgress, roadmap: [] }

  // workspaceId / goalRow / actuals bağımsız — ardışık 3 sorgu yerine tek
  // paralel dalga. teamSize workspace'e bağlı olduğu için sonraki dalgada kalır.
  // (/hedefim client sayfası, SSR prefetch yok → bu zincir doğrudan kullanıcıyı
  // bekletiyordu; ~5 round-trip → ~3.)
  const [workspaceId, goalRes, actuals] = await Promise.all([
    ownWorkspaceId(supabase, user.id),
    supabase
      .from('nmm_user_goals')
      .select('target_people, target_months, start_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    fetchFunnelActualsForToday(supabase, user.id),
  ])
  const teamSize = workspaceId ? await directTeamCount(supabase) : 0

  const goalRow = goalRes.data
  const goal: UserGoal | null = goalRow
    ? { targetPeople: goalRow.target_people, targetMonths: goalRow.target_months, startAt: goalRow.start_at }
    : null

  if (!goal) return { goal: null, progress: { ...emptyProgress, teamSize, actuals }, roadmap: [] }

  const roadmap = computeRoadmap(goal.targetPeople, goal.targetMonths, teamSize)
  const monthIndex = currentMonthIndex(new Date(goal.startAt), goal.targetMonths)
  const stage = roadmap[monthIndex - 1] ?? roadmap[roadmap.length - 1] ?? null
  const targets = dailyTargetsForMonth(stage ?? undefined)

  return {
    goal,
    progress: {
      hasGoal: true, monthIndex, totalMonths: goal.targetMonths, teamSize,
      targetTeamSize: goal.targetPeople, targets, actuals, stage,
    },
    roadmap,
  }
}
