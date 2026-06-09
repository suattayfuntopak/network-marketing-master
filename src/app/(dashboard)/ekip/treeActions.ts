'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'

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

  const { data: wsMembers } = await supabase
    .from('nmm_workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)

  const directIds = new Set((wsMembers ?? []).map(m => m.user_id))

  return members.map(m => ({
    id: m.user_id,
    name: m.full_name ?? '—',
    avatarUrl: m.avatar_url ?? null,
    generation: m.user_id === leader.user_id ? 0 : directIds.has(m.user_id) ? 1 : 2,
    isAppUser: true,
    joinedAt: m.joined_at,
  })).sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name))
}
