'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

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

  // 2. Fetch all workspaces (oldest first → primary workspace per user kept after dedup)
  const { data: workspaces, error: wsError } = await admin
    .from('nmm_workspaces')
    .select('*')
    .order('created_at', { ascending: true })

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

  // 4. Count downlines per workspace (parent_id is a workspace UUID)
  const parentCountMap = new Map<string, number>()
  workspaces.forEach(w => {
    if (w.parent_id) {
      parentCountMap.set(w.parent_id, (parentCountMap.get(w.parent_id) ?? 0) + 1)
    }
  })

  // Build workspace lookup by ID for sponsor resolution
  const workspaceById = new Map<string, typeof workspaces[0]>()
  workspaces.forEach(w => workspaceById.set(w.id, w))

  // 5. Combine and build result — deduplicate by owner_id (keep most recent workspace per user)
  const seenOwners = new Set<string>()
  const result: PlatformWorkspaceItem[] = []

  for (const w of workspaces) {
    // Skip the super admin's own workspaces — admin views the page, not a regular user entry
    if (w.owner_id === user.id) continue

    // Deduplicate: keep oldest workspace per owner (ascending order → first occurrence is primary)
    if (w.owner_id && seenOwners.has(w.owner_id)) continue
    if (w.owner_id) seenOwners.add(w.owner_id)

    const ownerUser = w.owner_id ? userMap.get(w.owner_id) : null
    const ownerEmail = ownerUser?.email ?? 'Bilinmiyor'
    const ownerName = (ownerUser?.user_metadata?.full_name as string | undefined) ?? ownerUser?.email?.split('@')[0] ?? 'İsimsiz Üye'

    // Resolve sponsor via workspace chain: parent workspace → owner user
    // Supports both formats: parent_id as workspace UUID (new) and as user UUID (legacy)
    let sponsorName: string | null = null
    let sponsorEmail: string | null = null
    if (w.parent_id) {
      const parentWorkspace = workspaceById.get(w.parent_id)
      const sponsorUser = parentWorkspace?.owner_id
        ? userMap.get(parentWorkspace.owner_id)
        : userMap.get(w.parent_id) // legacy format: parent_id was stored as user UUID
      if (sponsorUser) {
        sponsorEmail = sponsorUser.email ?? null
        sponsorName = (sponsorUser.user_metadata?.full_name as string | undefined) ?? sponsorUser.email?.split('@')[0] ?? 'Lider'
      }
    }

    const candidateCount = candidateCountMap.get(w.id) ?? 0
    // downlineCount: how many workspaces have parent_id pointing to THIS workspace
    const downlineCount = parentCountMap.get(w.id) ?? 0

    result.push({
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
      isIndependent: !w.parent_id,
    })
  }

  return result
}

/**
 * Securely upgrades or extends a workspace's license.
 * Restricted strictly to the Super Admin suattayfuntopak@gmail.com.
 */
export async function adminExtendLicenseAction(
  workspaceId: string,
  licenseType: 'free' | 'leader' | 'master' | 'pro',
  days: number,
  unlimited: boolean = false
): Promise<{ success: boolean; expiresAt: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error('Yetkisiz erişim: Bu işlemi sadece Süper Admin gerçekleştirebilir.')
  }

  const admin = createAdminClient()

  // Free plan → always no expiry
  if (licenseType === 'free') {
    const { error: updateErr } = await admin
      .from('nmm_workspaces')
      .update({ license_type: 'free', license_expires_at: null })
      .eq('id', workspaceId)
    if (updateErr) throw new Error('Lisans güncellenemedi.')
    return { success: true, expiresAt: null }
  }

  // Paid + unlimited → null expiry (indefinite access)
  if (unlimited) {
    const { error: updateErr } = await admin
      .from('nmm_workspaces')
      .update({ license_type: licenseType, license_expires_at: null })
      .eq('id', workspaceId)
    if (updateErr) throw new Error('Lisans güncellenemedi.')
    return { success: true, expiresAt: null }
  }

  // Paid + time-limited → extend from current expiry (or today if already expired)
  const { data: current, error: fetchErr } = await admin
    .from('nmm_workspaces')
    .select('license_expires_at')
    .eq('id', workspaceId)
    .single()

  if (fetchErr || !current) throw new Error('Çalışma alanı bulunamadı.')

  const base = current.license_expires_at && new Date(current.license_expires_at) > new Date()
    ? new Date(current.license_expires_at)
    : new Date()

  base.setDate(base.getDate() + days)
  const expiresIso = base.toISOString()

  const { error: updateErr } = await admin
    .from('nmm_workspaces')
    .update({ license_type: licenseType, license_expires_at: expiresIso })
    .eq('id', workspaceId)

  if (updateErr) {
    console.error('[adminExtendLicenseAction] Update error:', updateErr)
    throw new Error('Lisans güncellenemedi.')
  }

  return { success: true, expiresAt: expiresIso }
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
export async function deleteUserAction(ownerId: string, email: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error('Yetkisiz erişim: Bu işlemi sadece Süper Admin gerçekleştirebilir.')
  }

  const admin = createAdminClient()

  const { error: delErr } = await admin.auth.admin.deleteUser(ownerId)
  if (delErr) {
    console.error('[deleteUserAction] Error deleting user:', delErr)
    throw new Error('Kullanıcı silinemedi: ' + delErr.message)
  }

  return { success: true }
}

