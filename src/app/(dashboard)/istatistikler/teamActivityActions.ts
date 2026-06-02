'use server'

import { createClient } from '@/lib/supabase/server'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { isSuperAdmin } from '@/lib/domain/auth'
import { periodStartIso, type PulsePeriod } from '@/lib/domain/pulse'

export type TeamMemberFieldActivity = {
  userId: string
  calls: number
  whatsapps: number
  newCandidates: number
  activeDays: number
}

export type TeamFieldActivityResult = {
  totals: {
    calls: number
    whatsapps: number
    newCandidates: number
  }
  byUser: Record<string, TeamMemberFieldActivity>
}

async function assertWorkspaceMember(workspaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum gerekli.')

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) return { supabase, user }

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id, license_type')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user, licenseType: ws.license_type }

  throw new Error('Bu workspace için yetkiniz yok.')
}

export async function getTeamFieldActivityAction(
  workspaceId: string,
  period: PulsePeriod,
  memberUserIds: string[]
): Promise<TeamFieldActivityResult> {
  const empty: TeamFieldActivityResult = {
    totals: { calls: 0, whatsapps: 0, newCandidates: 0 },
    byUser: {},
  }

  const ctx = await assertWorkspaceMember(workspaceId)
  const { supabase, user } = ctx
  const licenseType =
    'licenseType' in ctx && ctx.licenseType
      ? ctx.licenseType
      : (
          await supabase
            .from('nmm_workspaces')
            .select('license_type')
            .eq('id', workspaceId)
            .single()
        ).data?.license_type

  if (!hasTeamPageAccess(licenseType, isSuperAdmin(user))) return empty

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  if (uniqueIds.length === 0) return empty

  const byUser: Record<string, TeamMemberFieldActivity> = {}
  for (const uid of uniqueIds) {
    byUser[uid] = { userId: uid, calls: 0, whatsapps: 0, newCandidates: 0, activeDays: 0 }
  }

  const startIso = periodStartIso(period)

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('user_id, action_type, created_at')
    .in('user_id', uniqueIds)
    .in('action_type', ['call', 'whatsapp'])

  if (startIso) {
    actionsQuery = actionsQuery.gte('created_at', startIso)
  }

  const { data: actions } = await actionsQuery

  const activeDaySets: Record<string, Set<string>> = {}
  for (const uid of uniqueIds) activeDaySets[uid] = new Set()

  for (const act of actions ?? []) {
    const bucket = byUser[act.user_id]
    if (!bucket) continue
    if (act.action_type === 'call') bucket.calls++
    else if (act.action_type === 'whatsapp') bucket.whatsapps++
    activeDaySets[act.user_id]?.add(act.created_at.slice(0, 10))
  }

  for (const uid of uniqueIds) {
    byUser[uid].activeDays = activeDaySets[uid]?.size ?? 0
  }

  let candidatesQuery = supabase
    .from('nmm_candidates')
    .select('owner_id, created_at')
    .in('owner_id', uniqueIds)

  if (startIso) {
    candidatesQuery = candidatesQuery.gte('created_at', startIso)
  }

  const { data: newCandidates } = await candidatesQuery

  for (const c of newCandidates ?? []) {
    const bucket = byUser[c.owner_id]
    if (bucket) bucket.newCandidates++
  }

  const totals = { calls: 0, whatsapps: 0, newCandidates: 0 }
  for (const row of Object.values(byUser)) {
    totals.calls += row.calls
    totals.whatsapps += row.whatsapps
    totals.newCandidates += row.newCandidates
  }

  return { totals, byUser }
}
