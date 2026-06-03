'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdmin } from '@/lib/domain/auth'
import { buildCandidateContentFields } from '@/lib/domain/candidateFields'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import type { User } from '@supabase/supabase-js'
import { normalizeLicenseType } from '@/lib/domain/aiUsage'

export interface PlatformWorkspaceItem {
  workspaceId: string
  workspaceName: string
  ownerId: string
  ownerEmail: string
  ownerName: string
  avatarUrl: string | null
  createdAt: string
  licenseType: string
  licenseExpiresAt: string | null
  candidateCount: number
  downlineCount: number
  sponsorName: string | null
  sponsorEmail: string | null
  isIndependent: boolean
  /** Candidate id in the super admin's OWN pipeline, if this user is also their candidate. */
  pipelineCandidateId: string | null
  ownerPhone: string | null
}

async function listAllAuthUsers(admin: ReturnType<typeof createAdminClient>): Promise<User[]> {
  const users: User[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const batch = data.users ?? []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  return users
}

/**
 * Fetches all registered workspaces, users, candidate counts and sponsorship links.
 * Restricted strictly to the Super Admin suattayfuntopak@gmail.com.
 */
export async function getPlatformWorkspacesAction(): Promise<PlatformWorkspaceItem[]> {
  const { user } = await getAuthUser()

  assertSuperAdmin(user)

  const admin = createAdminClient()

  const [
    users,
    workspacesResult,
    countRpcResult,
    adminCandidatesResult,
  ] = await Promise.all([
    listAllAuthUsers(admin),
    admin
      .from('nmm_workspaces')
      .select('id, name, owner_id, parent_id, license_type, license_expires_at, created_at')
      .order('created_at', { ascending: true }),
    admin.rpc('nmm_count_candidates_per_workspace'),
    admin
      .from('nmm_candidates')
      .select('id, owner_id, full_name, phone')
      .eq('owner_id', user.id),
  ])

  const { data: workspaces, error: wsError } = workspacesResult
  if (wsError || !workspaces) {
    console.error('[getPlatformWorkspacesAction] workspaces error:', wsError)
    throw new Error('Çalışma alanları çekilemedi.')
  }

  const userMap = new Map<string, User>()
  users.forEach(u => userMap.set(u.id, u))

  const candidateCountMap = new Map<string, number>()
  const { data: countJson, error: countRpcError } = countRpcResult
  if (!countRpcError && countJson && typeof countJson === 'object') {
    Object.entries(countJson as Record<string, number>).forEach(([wsId, cnt]) => {
      candidateCountMap.set(wsId, cnt)
    })
  } else {
    const { data: candidates, error: cError } = await admin
      .from('nmm_candidates')
      .select('workspace_id')
    if (!cError && candidates) {
      candidates.forEach(c => {
        candidateCountMap.set(c.workspace_id, (candidateCountMap.get(c.workspace_id) ?? 0) + 1)
      })
    }
  }

  const parentCountMap = new Map<string, number>()
  workspaces.forEach(w => {
    if (w.parent_id) {
      parentCountMap.set(w.parent_id, (parentCountMap.get(w.parent_id) ?? 0) + 1)
    }
  })

  const workspaceById = new Map<string, typeof workspaces[0]>()
  workspaces.forEach(w => workspaceById.set(w.id, w))

  const ownerIdsForAvatars = [
    ...new Set(workspaces.map(w => w.owner_id).filter((id): id is string => !!id)),
  ]
  const avatarByOwnerId = new Map<string, string>()
  if (ownerIdsForAvatars.length > 0) {
    const { data: memberAvatars } = await admin
      .from('nmm_workspace_members')
      .select('user_id, avatar_url')
      .in('user_id', ownerIdsForAvatars)
      .not('avatar_url', 'is', null)
    memberAvatars?.forEach(row => {
      if (row.avatar_url && !avatarByOwnerId.has(row.user_id)) {
        avatarByOwnerId.set(row.user_id, row.avatar_url)
      }
    })
  }

  const { data: adminCandidates } = adminCandidatesResult

  const phoneByCandidateId = new Map<string, string>()
  adminCandidates?.forEach(c => {
    if (c.phone) phoneByCandidateId.set(c.id, c.phone)
  })

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
    const avatarUrl =
      (ownerUser?.user_metadata?.avatar_url as string | undefined) ??
      (w.owner_id ? avatarByOwnerId.get(w.owner_id) ?? null : null)

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

    const pipelineCandidateId = findLeaderCandidateForMember(adminCandidates ?? [], user.id, ownerName)
    const ownerPhone =
      (pipelineCandidateId ? phoneByCandidateId.get(pipelineCandidateId) : null) ??
      ownerUser?.phone ??
      ((ownerUser?.user_metadata?.phone as string | undefined) ?? null)

    result.push({
      workspaceId: w.id,
      workspaceName: w.name,
      ownerId: w.owner_id ?? '',
      ownerEmail,
      ownerName,
      avatarUrl,
      createdAt: w.created_at,
      licenseType: normalizeLicenseType(w.license_type),
      licenseExpiresAt: w.license_expires_at ?? null,
      candidateCount,
      downlineCount,
      sponsorName,
      sponsorEmail,
      isIndependent: !w.parent_id,
      pipelineCandidateId,
      ownerPhone,
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
  licenseType: 'free' | 'basic' | 'plus' | 'pro',
  days: number,
  unlimited: boolean = false
): Promise<{ success: boolean; expiresAt: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  assertSuperAdmin(user)

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

  assertSuperAdmin(user)

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

  const { error: insertErr } = await admin.from('nmm_candidates').insert({
    workspace_id: ws.id,
    owner_id: user.id,
    full_name: targetName,
    stage: 'yeni',
    ...buildCandidateContentFields({ noteTr: note, noteEn: '' }),
  })

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

  assertSuperAdmin(user)

  const admin = createAdminClient()

  const { error: delErr } = await admin.auth.admin.deleteUser(ownerId)
  if (delErr) {
    console.error('[deleteUserAction] Error deleting user:', delErr)
    throw new Error('Kullanıcı silinemedi: ' + delErr.message)
  }

  return { success: true }
}


// ─────────────────────────────────────────────────────────────
// Çözülemeyen Shopier siparişleri (müşteri ödedi, lisans eşleşmedi)
// ─────────────────────────────────────────────────────────────

export interface UnresolvedOrderItem {
  orderId: string
  note: string | null
  productId: string | null
  processedAt: string
}

/** Süper admin: lisansa dönüştürülemeyen siparişler (el ile müdahale bekler). */
export async function getUnresolvedOrdersAction(): Promise<UnresolvedOrderItem[]> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('nmm_shopier_processed_orders')
    .select('order_id, note, product_id, processed_at')
    .eq('status', 'unresolved')
    .order('processed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((o) => ({
    orderId: o.order_id,
    note: o.note,
    productId: o.product_id,
    processedAt: o.processed_at,
  }))
}

/** Süper admin lisansı el ile tanımladıktan sonra siparişi listeden düşürür. */
export async function markOrderResolvedAction(orderId: string): Promise<{ success: boolean }> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const { error } = await admin
    .from('nmm_shopier_processed_orders')
    .update({ status: 'resolved' })
    .eq('order_id', orderId)

  if (error) throw new Error(error.message)
  return { success: true }
}
