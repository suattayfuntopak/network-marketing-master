'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'
import { fetchTeamBundle } from '@/lib/team/fetchTeamBundle'
import { computeMemberGeneration } from '@/lib/team/memberGeneration'

export type GenerationTreeNode = {
  id: string
  name: string
  avatarUrl: string | null
  generation: number
  isAppUser: boolean
  joinedAt: string | null
  pipelineId: string | null
  /** Üst sponsor (ağaç genişletme için). Lider = null. */
  parentUserId: string | null
}

export async function getTeamGenerationTreeAction(workspaceId: string): Promise<GenerationTreeNode[]> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return []

  // bundle / wsMembers / tree birbirinden bağımsız — ardışık değil tek paralel
  // dalgada çekilir (3 round-trip → 1). leader kontrolü sonrasında yapılır.
  const [bundle, teamBundle, { data: wsMembers }, { data: treeRows }] = await Promise.all([
    fetchTeamWithDownlines(supabase, workspaceId),
    fetchTeamBundle(supabase, workspaceId),
    supabase.from('nmm_workspace_members').select('user_id').eq('workspace_id', workspaceId),
    supabase.rpc('nmm_leader_downline_workspace_tree'),
  ])
  const members = bundle?.members ?? []
  const ekipRows = teamBundle?.ekipRows ?? []
  const pipelineByUser = new Map(
    ekipRows
      .filter(row => row.isAppUser !== false && row.pipeline_id)
      .map(row => [row.user_id, row.pipeline_id as string]),
  )
  const avatarByUser = new Map(
    ekipRows.filter(row => row.user_id).map(row => [row.user_id, row.avatar_url ?? null]),
  )
  const leader = members.find(m => m.role === 'leader')
  if (!leader) return []

  const directIds = new Set((wsMembers ?? []).map(m => m.user_id))
  const tree = (treeRows ?? []) as { id: string; owner_id: string; parent_id: string | null }[]
  const wsById = new Map(tree.map(r => [r.id, r]))

  function resolveParentUserId(userId: string): string | null {
    if (userId === leader.user_id) return null
    const memberWs = tree.find(r => r.owner_id === userId)
    if (memberWs?.parent_id) {
      if (memberWs.parent_id === workspaceId) return leader.user_id
      const parentWs = wsById.get(memberWs.parent_id)
      if (parentWs) return parentWs.owner_id
    }
    if (directIds.has(userId)) return leader.user_id
    return leader.user_id
  }

  return members
    .map(m => ({
      id: m.user_id,
      name: m.full_name ?? '—',
      avatarUrl: avatarByUser.get(m.user_id) ?? m.avatar_url ?? null,
      generation: computeMemberGeneration(
        m.user_id,
        leader.user_id,
        workspaceId,
        tree,
        directIds,
      ),
      isAppUser: true,
      joinedAt: m.joined_at,
      pipelineId: pipelineByUser.get(m.user_id) ?? null,
      parentUserId: resolveParentUserId(m.user_id),
    }))
    .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name))
}
