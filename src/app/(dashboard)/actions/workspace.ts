'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin, resolveWorkspaceLicense } from '@/lib/auth'
import type { WorkspaceContext } from '@/hooks/useWorkspace'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Read-only: returns null when the user has no workspace membership yet. */
export async function fetchWorkspaceAction(): Promise<WorkspaceContext | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Oturum bulunamadı.')

  const { data: membership, error: memSelectError } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, role, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memSelectError) {
    throw new Error(`Üyelik okunamadı: ${memSelectError.message}`)
  }

  if (!membership) return null

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null
  const admin = isSuperAdmin(user)

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('invite_code, license_type, license_expires_at')
    .eq('id', membership.workspace_id)
    .single()

  const license = resolveWorkspaceLicense(user, ws)

  return {
    userId: user.id,
    workspaceId: membership.workspace_id,
    inviteCode: ws?.invite_code ?? membership.workspace_id.slice(0, 8).toUpperCase(),
    role: membership.role,
    fullName: membership.full_name,
    avatarUrl,
    licenseType: license.licenseType,
    licenseExpiresAt: license.licenseExpiresAt,
    isSuperAdmin: admin,
  }
}

/** Creates workspace + leader membership when missing (idempotent for existing members). */
export async function ensureWorkspaceAction(): Promise<WorkspaceContext> {
  const existing = await fetchWorkspaceAction()
  if (existing) return existing

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Oturum bulunamadı.')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Kullanıcı'
  const inviteCode = generateInviteCode()
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null
  const admin = isSuperAdmin(user)

  const { data: ws, error: wsError } = await supabase
    .from('nmm_workspaces')
    .insert({ name: `${fullName}'in Ekibi`, owner_id: user.id, invite_code: inviteCode })
    .select('id, invite_code')
    .single()

  if (wsError || !ws) {
    throw new Error(`Workspace oluşturulamadı: ${wsError?.message}`)
  }

  const { error: memInsertError } = await supabase.from('nmm_workspace_members').insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: 'leader',
    full_name: fullName,
    avatar_url: avatarUrl,
  })

  if (memInsertError) {
    throw new Error(`Üyelik oluşturulamadı: ${memInsertError.message}`)
  }

  const license = resolveWorkspaceLicense(user, { license_type: 'free', license_expires_at: null })

  return {
    userId: user.id,
    workspaceId: ws.id,
    inviteCode: ws.invite_code ?? inviteCode,
    role: 'leader',
    fullName,
    avatarUrl,
    licenseType: license.licenseType,
    licenseExpiresAt: license.licenseExpiresAt,
    isSuperAdmin: admin,
  }
}
