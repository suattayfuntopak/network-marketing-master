'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'

// Initialize Supabase Admin Client using Service Role Key to bypass RLS safely
function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface PlatformWorkspaceItem {
  workspaceId: string
  workspaceName: string
  ownerId: string
  ownerEmail: string
  ownerName: string
  createdAt: string
  licenseType: string
  licenseExpiresAt: string | null
  candidateCount: number
  downlineCount: number
  sponsorName: string | null
  sponsorEmail: string | null
  isIndependent: boolean
}

/**
 * Fetches all registered workspaces, users, candidate counts and sponsorship links.
 * Restricted strictly to the Super Admin suattayfuntopak@gmail.com.
 */
export async function getPlatformWorkspacesAction(): Promise<PlatformWorkspaceItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error('Yetkisiz erişim: Bu işlemi sadece Süper Admin gerçekleştirebilir.')
  }

  const admin = createAdminClient()

  // 1. Fetch all users from Supabase Auth
  const { data: { users = [] }, error: usersError } = await admin.auth.admin.listUsers()
  if (usersError) {
    console.error('[getPlatformWorkspacesAction] listUsers error:', usersError)
    throw new Error('Kullanıcı listesi çekilemedi.')
  }

  // Map users by ID for O(1) lookup
  const userMap = new Map<string, typeof users[0]>()
  users.forEach(u => userMap.set(u.id, u))

  // 2. Fetch all workspaces
  const { data: workspaces, error: wsError } = await admin
    .from('nmm_workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  if (wsError || !workspaces) {
    console.error('[getPlatformWorkspacesAction] workspaces error:', wsError)
    throw new Error('Çalışma alanları çekilemedi.')
  }

  // 3. Fetch all candidate counts grouped by workspace
  const { data: candidates, error: cError } = await admin
    .from('nmm_candidates')
    .select('workspace_id')

  const candidateCountMap = new Map<string, number>()
  if (!cError && candidates) {
    candidates.forEach(c => {
      candidateCountMap.set(c.workspace_id, (candidateCountMap.get(c.workspace_id) ?? 0) + 1)
    })
  }

  // 4. Fetch all team members count (downlines count)
  // Let's count how many leaders have this workspace owner as their parent_id
  const parentCountMap = new Map<string, number>()
  workspaces.forEach(w => {
    if (w.parent_id) {
      parentCountMap.set(w.parent_id, (parentCountMap.get(w.parent_id) ?? 0) + 1)
    }
  })

  // Map workspaces by owner_id to lookup sponsors
  const workspaceMapByOwner = new Map<string, typeof workspaces[0]>()
  workspaces.forEach(w => { if (w.owner_id) workspaceMapByOwner.set(w.owner_id, w) })

  // 5. Combine and build result
  const result: PlatformWorkspaceItem[] = workspaces.map(w => {
    const ownerUser = w.owner_id ? userMap.get(w.owner_id) : null
    const ownerEmail = ownerUser?.email ?? 'Bilinmiyor'
    const ownerName = (ownerUser?.user_metadata?.full_name as string | undefined) ?? ownerUser?.email?.split('@')[0] ?? 'İsimsiz Üye'
    
    // Find sponsor details if workspace has parent_id
    let sponsorName: string | null = null
    let sponsorEmail: string | null = null
    if (w.parent_id) {
      const sponsorUser = userMap.get(w.parent_id)
      if (sponsorUser) {
        sponsorEmail = sponsorUser.email ?? null
        sponsorName = (sponsorUser.user_metadata?.full_name as string | undefined) ?? sponsorUser.email?.split('@')[0] ?? 'Lider'
      }
    }

    const candidateCount = candidateCountMap.get(w.id) ?? 0
    const downlineCount = w.owner_id ? (parentCountMap.get(w.owner_id) ?? 0) : 0

    return {
      workspaceId: w.id,
      workspaceName: w.name,
      ownerId: w.owner_id ?? '',
      ownerEmail,
      ownerName,
      createdAt: w.created_at,
      licenseType: w.license_type ?? 'free',
      licenseExpiresAt: w.license_expires_at ?? null,
      candidateCount,
      downlineCount,
      sponsorName,
      sponsorEmail,
      isIndependent: !w.parent_id
    }
  })

  return result
}

/**
 * Securely upgrades or extends a workspace's license.
 * Restricted strictly to the Super Admin suattayfuntopak@gmail.com.
 */
export async function adminExtendLicenseAction(
  workspaceId: string,
  licenseType: 'free' | 'leader' | 'master' | 'pro',
  days: number
): Promise<{ success: boolean; expiresAt: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error('Yetkisiz erişim: Bu işlemi sadece Süper Admin gerçekleştirebilir.')
  }

  const admin = createAdminClient()

  // Find existing license expires date
  const { data: current, error: fetchErr } = await admin
    .from('nmm_workspaces')
    .select('license_type, license_expires_at')
    .eq('id', workspaceId)
    .single()

  if (fetchErr || !current) {
    throw new Error('Çalışma alanı bulunamadı.')
  }

  let expiresAt: Date
  if (current.license_expires_at && new Date(current.license_expires_at) > new Date()) {
    expiresAt = new Date(current.license_expires_at)
  } else {
    expiresAt = new Date()
  }

  // Add days
  expiresAt.setDate(expiresAt.getDate() + days)
  const expiresIso = expiresAt.toISOString()

  // Update in database bypassing RLS
  const { error: updateErr } = await admin
    .from('nmm_workspaces')
    .update({
      license_type: licenseType,
      license_expires_at: licenseType === 'free' ? null : expiresIso
    })
    .eq('id', workspaceId)

  if (updateErr) {
    console.error('[adminExtendLicenseAction] Update error:', updateErr)
    throw new Error('Lisans güncellenemedi.')
  }

  return {
    success: true,
    expiresAt: licenseType === 'free' ? null : expiresIso
  }
}

/**
 * Adds an independent platform user as a candidate (stage: yeni) in the admin's pipeline.
 * Restricted strictly to the Super Admin.
 */
export async function addIndependentAsCandidateAction(
  targetEmail: string,
  targetName: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error('Yetkisiz erişim.')
  }

  const admin = createAdminClient()

  // Find admin's workspace
  const { data: ws, error: wsErr } = await admin
    .from('nmm_workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (wsErr || !ws) {
    throw new Error('Çalışma alanınız bulunamadı.')
  }

  const note = `[Platform Üyesi] ${targetEmail}`.slice(0, 200)

  const { error: insertErr } = await (admin
    .from('nmm_candidates')
    .insert({
      workspace_id: ws.id,
      owner_id: user.id,
      full_name: targetName,
      stage: 'yeni',
      note,
    }) as any)

  if (insertErr) {
    if (insertErr.code === '23505') {
      throw new Error('Bu kişi zaten pipeline\'ınızda mevcut.')
    }
    throw new Error('Aday eklenirken bir hata oluştu.')
  }

  return { success: true }
}
