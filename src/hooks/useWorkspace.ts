'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export interface WorkspaceContext {
  workspaceId: string
  inviteCode: string
  role: 'leader' | 'member'
  fullName: string | null
  avatarUrl: string | null
  licenseType: 'free' | 'leader' | 'master' | 'pro'
  licenseExpiresAt: string | null
  isSuperAdmin: boolean
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
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

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  if (membership) {
    // Workspace'in invite_code'unu ve lisans alanlarını çek
    const { data: ws } = await supabase
      .from('nmm_workspaces')
      .select('invite_code, license_type, license_expires_at')
      .eq('id', membership.workspace_id)
      .single()

    return {
      workspaceId: membership.workspace_id,
      inviteCode: ws?.invite_code ?? membership.workspace_id.slice(0, 8).toUpperCase(),
      role: membership.role,
      fullName: membership.full_name,
      avatarUrl,
      licenseType: isSuperAdmin ? 'pro' : (ws?.license_type ?? 'free') as any,
      licenseExpiresAt: isSuperAdmin ? null : (ws?.license_expires_at ?? null),
      isSuperAdmin,
    }
  }

  // Yeni workspace + leader üyeliği oluştur
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Kullanıcı'
  const inviteCode = generateInviteCode()

  const { data: ws, error: wsError } = await supabase
    .from('nmm_workspaces')
    .insert({ name: `${fullName}'in Ekibi`, owner_id: user.id, invite_code: inviteCode })
    .select('id, invite_code')
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

  return {
    workspaceId: ws.id,
    inviteCode: ws.invite_code ?? inviteCode,
    role: 'leader',
    fullName,
    avatarUrl,
    licenseType: isSuperAdmin ? 'pro' : 'free',
    licenseExpiresAt: null,
    isSuperAdmin,
  }
}

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: fetchOrCreateWorkspace,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
