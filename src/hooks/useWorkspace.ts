'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface WorkspaceContext {
  workspaceId: string
  role: 'leader' | 'member'
  fullName: string | null
  avatarUrl: string | null
}

async function fetchOrCreateWorkspace(): Promise<WorkspaceContext> {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Oturum bulunamadı.')

  // Mevcut üyelik var mı?
  const { data: membership, error: memSelectError } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, role, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memSelectError) {
    console.error('[useWorkspace] membership select error:', memSelectError)
    throw new Error(`Üyelik okunamadı: ${memSelectError.message}`)
  }

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null

  if (membership) {
    return {
      workspaceId: membership.workspace_id,
      role: membership.role,
      fullName: membership.full_name,
      avatarUrl,
    }
  }

  // Yeni workspace + leader üyeliği oluştur
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Kullanıcı'

  const { data: ws, error: wsError } = await supabase
    .from('nmm_workspaces')
    .insert({ name: `${fullName}'in Ekibi`, owner_id: user.id })
    .select('id')
    .single()

  if (wsError || !ws) {
    console.error('[useWorkspace] workspace insert error:', wsError)
    throw new Error(`Workspace oluşturulamadı: ${wsError?.message}`)
  }

  const { error: memInsertError } = await supabase.from('nmm_workspace_members').insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: 'leader',
    full_name: fullName,
  })

  if (memInsertError) {
    console.error('[useWorkspace] membership insert error:', memInsertError)
    throw new Error(`Üyelik oluşturulamadı: ${memInsertError.message}`)
  }

  return { workspaceId: ws.id, role: 'leader', fullName, avatarUrl }
}

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: fetchOrCreateWorkspace,
    staleTime: Infinity,
  })
}
