'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { isSuperAdmin } from '@/lib/domain/auth'

export type MemberGoalRow = {
  memberUserId: string
  targetPeople: number
  targetMonths: number
  updatedAt: string
}

async function assertLeader(workspaceId: string) {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum gerekli.')

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id, license_type')
    .eq('id', workspaceId)
    .single()

  if (!ws || ws.owner_id !== user.id) {
    throw new Error('Yalnızca ekip lideri hedef belirleyebilir.')
  }

  if (!hasTeamPageAccess(ws.license_type, isSuperAdmin(user))) {
    throw new Error('Ekip hedefi için Plus veya Pro plan gerekli.')
  }

  return { supabase, user, workspaceId }
}

// Downline doğrulaması kolon-kısıtlı definer rpc ile (055): rpc DAİMA auth.uid()'in kendi
// downline'ını döndürür → memberUserId çağıranın doğrudan downline'ı mı diye kontrol edilir.
async function assertDownline(supabase: Awaited<ReturnType<typeof createClient>>, memberUserId: string) {
  const { data: downline } = await supabase.rpc('nmm_leader_downline_workspaces')
  if (!downline?.some(w => w.owner_id === memberUserId)) {
    throw new Error('Bu kullanıcı doğrudan downline değil.')
  }
}

export async function getMemberGoalsMapAction(
  workspaceId: string,
  memberUserIds: string[]
): Promise<Record<string, MemberGoalRow>> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user || memberUserIds.length === 0) return {}

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  const { data: rows } = await supabase
    .from('nmm_member_goals')
    .select('member_user_id, target_people, target_months, updated_at')
    .eq('workspace_id', workspaceId)
    .in('member_user_id', uniqueIds)

  const map: Record<string, MemberGoalRow> = {}
  for (const row of rows ?? []) {
    map[row.member_user_id] = {
      memberUserId: row.member_user_id,
      targetPeople: row.target_people,
      targetMonths: row.target_months,
      updatedAt: row.updated_at,
    }
  }
  return map
}

export async function upsertMemberGoalAction(
  workspaceId: string,
  memberUserId: string,
  targetPeople: number,
  targetMonths: number
): Promise<void> {
  const people = Math.round(targetPeople)
  const months = Math.round(targetMonths)
  if (people < 1 || people > 10000) throw new Error('Geçersiz hedef kişi sayısı.')
  if (months < 1 || months > 120) throw new Error('Geçersiz hedef süresi.')

  const { supabase, user } = await assertLeader(workspaceId)
  await assertDownline(supabase, memberUserId)

  const { error } = await supabase.from('nmm_member_goals').upsert(
    {
      workspace_id: workspaceId,
      member_user_id: memberUserId,
      set_by_user_id: user.id,
      target_people: people,
      target_months: months,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,member_user_id' }
  )

  if (error) throw new Error(error.message)
}

export async function deleteMemberGoalAction(
  workspaceId: string,
  memberUserId: string
): Promise<void> {
  const { supabase } = await assertLeader(workspaceId)
  await assertDownline(supabase, memberUserId)

  const { error } = await supabase
    .from('nmm_member_goals')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('member_user_id', memberUserId)

  if (error) throw new Error(error.message)
}
