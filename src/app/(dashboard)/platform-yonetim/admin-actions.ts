'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdmin } from '@/lib/domain/auth'
import { buildCandidateContentFields } from '@/lib/domain/candidateFields'
import { getAuthUser } from '@/lib/supabase/authUser'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import { sendWelcomeEmail } from '@/lib/infra/mail'
import { todayCalendarKey } from '@/lib/utils/calendarDates'

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

/**
 * Mevcut bir "dış kayıt"ı (bağımsız workspace) süper admin'in ekibine BAĞLAR:
 * hedef workspace'in parent_id'sini süper admin workspace'ine set eder. Bu, kişinin
 * davet kodunu elle girmesiyle aynı sonucu verir → artık "dış kayıt" olarak görünmez
 * ve liderin boru hattındaki aynı isimli "katıldı" adayıyla eşleşip çift sayılmaz.
 * (Örn. WhatsApp davet linkinden kaydolup kodu girmemiş saha ortağı.)
 * Başka bir lidere zaten bağlı kullanıcı KORUNUR (sponsor çalınmaz).
 */
export async function claimIndependentSignupToTeamAction(
  targetWorkspaceId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  assertSuperAdmin(user)

  const admin = createAdminClient()

  const { data: myWs, error: myErr } = await admin
    .from('nmm_workspaces')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (myErr || !myWs) throw new Error('Çalışma alanınız bulunamadı.')
  if (targetWorkspaceId === myWs.id) throw new Error('Kendi çalışma alanı bağlanamaz.')

  const { data: target, error: tErr } = await admin
    .from('nmm_workspaces')
    .select('id, parent_id, owner_id')
    .eq('id', targetWorkspaceId)
    .single()

  if (tErr || !target || !target.owner_id) throw new Error('Hedef çalışma alanı bulunamadı.')

  // Zaten BAŞKA bir lidere bağlıysa dokunma.
  if (target.parent_id && target.parent_id !== myWs.id) {
    throw new Error('Bu kullanıcı zaten başka bir lidere bağlı.')
  }

  // 1) parent_id set → kişi downline olur (referans kısıtı: parent_id = leader workspace_id)
  if (target.parent_id !== myWs.id) {
    const { error: updErr } = await admin
      .from('nmm_workspaces')
      .update({ parent_id: myWs.id })
      .eq('id', targetWorkspaceId)
    if (updErr) {
      console.error('[claimIndependentSignupToTeamAction] parent_id update failed:', updErr)
      throw new Error('Ekibe bağlama başarısız.')
    }
  }

  // 2) Hedef üyenin bilgilerini çek
  const { data: targetMember } = await admin
    .from('nmm_workspace_members')
    .select('full_name')
    .eq('user_id', target.owner_id)
    .eq('workspace_id', targetWorkspaceId)
    .maybeSingle()

  const { data: authUser } = await admin.auth.admin.getUserById(target.owner_id)
  const targetEmail = authUser?.user?.email ?? ''
  let targetName = (targetMember?.full_name ?? authUser?.user?.user_metadata?.full_name as string | undefined)?.trim() ?? ''
  const targetPhone = (authUser?.user?.user_metadata?.phone as string | undefined)?.trim() || null

  if (!targetName) {
    targetName = targetEmail ? targetEmail.split('@')[0] : 'Yeni Ortak'
  }

  // 3) Reconcile pipeline candidates
  if (targetName) {
    const { data: leaderCands } = await admin
      .from('nmm_candidates')
      .select('id, full_name, owner_id, stage, phone, email')
      .eq('workspace_id', myWs.id)
      .eq('owner_id', user.id)

    const pool = leaderCands ?? []
    let candidateId = findLeaderCandidateForMember(pool, user.id, targetName, targetPhone)

    if (candidateId) {
      const matched = pool.find(c => c.id === candidateId)
      const updates: { stage?: 'katildi'; email?: string; phone?: string } = {}
      if (matched && matched.stage !== 'katildi') {
        updates.stage = 'katildi'
      }
      if (matched && (!matched.email || !matched.email.trim()) && targetEmail) {
        updates.email = targetEmail
      }
      if (matched && (!matched.phone || !matched.phone.trim()) && targetPhone) {
        updates.phone = targetPhone
      }
      if (Object.keys(updates).length > 0) {
        await admin.from('nmm_candidates').update(updates).eq('id', candidateId)
      }
    } else {
      const { data: inserted } = await admin
        .from('nmm_candidates')
        .insert({
          workspace_id: myWs.id,
          owner_id: user.id,
          full_name: targetName,
          email: targetEmail || null,
          phone: targetPhone || null,
          stage: 'katildi',
          warmth: 'ilik',
          ...buildCandidateContentFields({ noteTr: 'Dış kayıt ekibe bağlandı', noteEn: 'External signup linked to team' }),
        })
        .select('id')
        .single()
      candidateId = inserted?.id ?? null
    }

    if (candidateId) {
      await admin
        .from('nmm_team_pipeline_links')
        .upsert(
          { workspace_id: myWs.id, member_user_id: target.owner_id, candidate_id: candidateId },
          { onConflict: 'workspace_id,member_user_id' },
        )
    }
  }

  // 4) Hoş geldin e-postası (welcome email) kontrolü ve gönderimi
  if (targetEmail) {
    const { data: emailLog } = await admin
      .from('nmm_email_sent_log')
      .select('id')
      .eq('workspace_id', targetWorkspaceId)
      .eq('kind', 'welcome')
      .maybeSingle()

    if (!emailLog) {
      try {
        await sendWelcomeEmail(targetEmail, targetName, 'tr')
        await admin.from('nmm_email_sent_log').insert({
          workspace_id: targetWorkspaceId,
          kind: 'welcome',
          sent_date: todayCalendarKey(),
        })
      } catch (emailErr) {
        console.error('[claimIndependentSignupToTeamAction] Welcome email failed:', emailErr)
      }
    }
  }

  // 5) Uygulama-içi bildirimlerin gönderimi
  const { data: myMember } = await admin
    .from('nmm_workspace_members')
    .select('full_name')
    .eq('user_id', user.id)
    .eq('workspace_id', myWs.id)
    .maybeSingle()

  const sponsorName = myMember?.full_name ?? 'Sponsorunuz'

  try {
    // Lidere bildirim:
    await admin.from('nmm_notifications').insert({
      user_id: user.id,
      title_tr: 'Ekibe bağlama başarılı! 🎉',
      title_en: 'Team linking successful! 🎉',
      description_tr: `${targetName} (${targetEmail || 'E-posta yok'}) ekibinize bağlandı ve dış kayıtlar tablosundan çıkarıldı.`,
      description_en: `${targetName} (${targetEmail || 'No email'}) linked to your team and removed from external signups.`,
      type: 'user',
    })

    // Bağlanan kullanıcıya bildirim:
    await admin.from('nmm_notifications').insert({
      user_id: target.owner_id,
      title_tr: 'Ekibe hoş geldiniz! 💎',
      title_en: 'Welcome to the team! 💎',
      description_tr: `${sponsorName} sizi kendi ekibine bağladı. Artık tüm eğitim ve koçluk araçlarına erişebilirsiniz.`,
      description_en: `${sponsorName} linked you to their team. You now have access to all training and coaching features.`,
      type: 'user',
    })
  } catch (notifErr) {
    console.error('[claimIndependentSignupToTeamAction] Notifications insert failed:', notifErr)
  }

  revalidatePath('/platform-yonetim')
  return { success: true }
}

export async function deleteUserAction(ownerId: string): Promise<{ success: boolean }> {
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
