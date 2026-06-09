'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'
import { computeMemberGeneration } from '@/lib/team/memberGeneration'

export type GenerationTreeNode = {
  id: string
  name: string
  avatarUrl: string | null
  generation: number
  isAppUser: boolean
  joinedAt: string | null
}

export async function getTeamGenerationTreeAction(workspaceId: string): Promise<GenerationTreeNode[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const bundle = await fetchTeamWithDownlines(supabase, workspaceId)
  const members = bundle?.members ?? []
  const leader = members.find(m => m.role === 'leader')
  if (!leader) return []

  const [{ data: wsMembers }, { data: treeRows }] = await Promise.all([
    supabase.from('nmm_workspace_members').select('user_id').eq('workspace_id', workspaceId),
    supabase.rpc('nmm_leader_downline_workspace_tree'),
  ])

  const directIds = new Set((wsMembers ?? []).map(m => m.user_id))
  const tree = (treeRows ?? []) as { id: string; owner_id: string; parent_id: string | null }[]

  return members
    .map(m => ({
      id: m.user_id,
      name: m.full_name ?? '—',
      avatarUrl: m.avatar_url ?? null,
      generation: computeMemberGeneration(
        m.user_id,
        leader.user_id,
        workspaceId,
        tree,
        directIds,
      ),
      isAppUser: true,
      joinedAt: m.joined_at,
    }))
    .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name))
}
