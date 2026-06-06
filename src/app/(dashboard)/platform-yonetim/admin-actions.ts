'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdmin } from '@/lib/domain/auth'
import { buildCandidateContentFields } from '@/lib/domain/candidateFields'
import { getAuthUser } from '@/lib/supabase/authUser'

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

  if (licenseType === 'free') {
    const { error: updateErr } = await admin
      .from('nmm_workspaces')
      .update({ license_type: 'free', license_expires_at: null })
      .eq('id', workspaceId)
    if (updateErr) throw new Error('Lisans güncellenemedi.')
    return { success: true, expiresAt: null }
  }

  if (unlimited) {
    const { error: updateErr } = await admin
      .from('nmm_workspaces')
      .update({ license_type: licenseType, license_expires_at: null })
      .eq('id', workspaceId)
    if (updateErr) throw new Error('Lisans güncellenemedi.')
    return { success: true, expiresAt: null }
  }

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

/** Adds an independent platform user as a candidate in the super admin pipeline. */
export async function addIndependentAsCandidateAction(
  targetEmail: string,
  targetName: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  assertSuperAdmin(user)

  const admin = createAdminClient()

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

export async function deleteUserAction(ownerId: string, _email: string): Promise<{ success: boolean }> {
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

export interface UnresolvedOrderItem {
  orderId: string
  note: string | null
  productId: string | null
  processedAt: string
}

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
