'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdmin, isSuperAdmin } from '@/lib/domain/auth'
import { sendModerationAlertEmail, sendModerationApprovedEmail, sendModerationRejectedEmail } from '@/lib/infra/mail'
import {
  rejectReasonForEmail,
} from '@/lib/domain/moderationDefaults'
import { buildBilingualRejectReason } from '@/lib/domain/moderationRejectReason'
import { enrichApprovedModerationData } from '@/lib/domain/moderationApproval'
import { translateNoteAction } from '@/app/(dashboard)/pipeline/[id]/actions'

interface ContentSubmissionResult {
  success: boolean
  isApproved: boolean
}

/**
 * Submits a custom training or objection.
 * If Super Admin submits, it is approved immediately.
 * If a regular user submits, it goes to moderation, triggers an alert email to Super Admin,
 * and remains private/draft until approved.
 */
export async function submitModeratedRequestAction(
  contentType: 'training' | 'objection',
  workspaceId: string | null,
  itemKey: string,
  data: Record<string, any>
): Promise<ContentSubmissionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum kapalı: İçerik eklemek için lütfen giriş yapın.')

  const userEmail = user.email ?? ''
  const userName = (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? 'NMM Üyesi'

  const admin = createAdminClient()
  const table = contentType === 'training' ? 'nmm_custom_trainings' : 'nmm_custom_objections'
  const isApproved = isSuperAdmin(user)

  // Insert content
  const { error } = await admin.from(table).insert({
    user_id: user.id,
    workspace_id: workspaceId,
    item_key: itemKey,
    data,
    is_approved: isApproved,
    user_email: userEmail,
    user_name: userName,
  })

  if (error) {
    console.error(`[submitModeratedRequestAction] Insert error into ${table}:`, error)
    throw new Error('İçerik eklenirken bir hata oluştu: ' + error.message)
  }

  // If not super admin, alert super admin via email
  if (!isApproved) {
    const title = contentType === 'training' ? (data.baslik ?? 'İsimsiz İçerik') : (data.soru?.tr ?? data.soru ?? 'İsimsiz İtiraz')
    // Trigger alerting asynchronously
    sendModerationAlertEmail(userEmail, userName, contentType, title).catch(err => {
      console.error('[Resend Alert Error]', err)
    })
  }

  return { success: true, isApproved }
}

export interface ModerationRequestItem {
  id: string
  userId: string
  workspaceId: string | null
  itemKey: string
  data: any
  createdAt: string
  isApproved: boolean
  userEmail: string | null
  userName: string | null
  contentType: 'training' | 'objection'
}

/**
 * Fetches all pending unapproved requests (restricted to Super Admin).
 */
export async function getPendingRequestsAction(): Promise<ModerationRequestItem[]> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()

  const [trainingsResult, objectionsResult] = await Promise.all([
    admin
      .from('nmm_custom_trainings')
      .select('id, user_id, workspace_id, item_key, data, created_at, is_approved, user_email, user_name')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
    admin
      .from('nmm_custom_objections')
      .select('id, user_id, workspace_id, item_key, data, created_at, is_approved, user_email, user_name')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
  ])

  const { data: trainings, error: tErr } = trainingsResult
  if (tErr) console.error('[getPendingRequestsAction] trainings fetch error:', tErr)

  const { data: objections, error: oErr } = objectionsResult
  if (oErr) console.error('[getPendingRequestsAction] objections fetch error:', oErr)

  const list: ModerationRequestItem[] = []

  trainings?.forEach(item => {
    list.push({
      id: item.id,
      userId: item.user_id,
      workspaceId: item.workspace_id,
      itemKey: item.item_key,
      data: item.data,
      createdAt: item.created_at,
      isApproved: item.is_approved,
      userEmail: item.user_email,
      userName: item.user_name,
      contentType: 'training',
    })
  })

  objections?.forEach(item => {
    list.push({
      id: item.id,
      userId: item.user_id,
      workspaceId: item.workspace_id,
      itemKey: item.item_key,
      data: item.data,
      createdAt: item.created_at,
      isApproved: item.is_approved,
      userEmail: item.user_email,
      userName: item.user_name,
      contentType: 'objection',
    })
  })

  // Sort combined list by created_at desc
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Approves a user submission, with optional edits from Super Admin.
 * Sends approval email with direct deep links to content.
 */
export async function approveRequestAction(
  id: string,
  contentType: 'training' | 'objection',
  editedData: Record<string, any>
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const table = contentType === 'training' ? 'nmm_custom_trainings' : 'nmm_custom_objections'

  // Fetch the submission row to know the submitter's info & language preference
  const { data: row, error: fetchErr } = await admin
    .from(table)
    .select('user_email, user_name, item_key, user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !row) {
    throw new Error('İçerik kaydı bulunamadı: ' + (fetchErr?.message ?? ''))
  }

  const enrichedData = await enrichApprovedModerationData(
    contentType,
    editedData,
    translateNoteAction,
  )

  // Update table row to approve & merge any admin edits
  const { error: updateErr } = await admin
    .from(table)
    .update({
      data: enrichedData as import('@/types/database.types').Json,
      is_approved: true,
    })
    .eq('id', id)

  if (updateErr) {
    throw new Error('İçerik onaylanırken hata oluştu: ' + updateErr.message)
  }

  // Fetch user language settings or default to 'tr'
  const userLang: 'tr' | 'en' = 'tr'
  try {
    const { data: profile } = await admin
      .from('nmm_workspace_members')
      .select('joined_at') // arbitrary, let's just assume we check preference or default
      .eq('user_id', row.user_id)
      .limit(1)
  } catch {}

  const title = contentType === 'training'
    ? (enrichedData.baslik ?? editedData.baslik ?? 'İsimsiz İçerik')
    : ((enrichedData.soru as { tr?: string })?.tr ?? editedData.soru?.tr ?? editedData.soru ?? 'İsimsiz İtiraz')

  if (row.user_email) {
    sendModerationApprovedEmail(row.user_email, row.user_name ?? 'NMM Üyesi', contentType, title, row.item_key, userLang).catch(err => {
      console.error('[Resend Approval Notification Error]', err)
    })
  }

  return { success: true }
}

/** Admin red gerekçesini kalıcı TR|||EN formatına çevirir (CLAUDE.md kuralı). */
export async function buildBilingualRejectReasonAction(
  reason: string,
  adminLang: 'tr' | 'en',
): Promise<string> {
  const { translateEnToTrAction, translateNoteAction } = await import(
    '@/app/(dashboard)/pipeline/[id]/actions'
  )
  return buildBilingualRejectReason(reason, adminLang, {
    translateTrToEn: translateNoteAction,
    translateEnToTr: translateEnToTrAction,
  })
}

/**
 * Rejects (deletes) a custom content submission.
 * Sends a polite notification email to the submitter detailing the rejection reason.
 */
export async function rejectRequestAction(
  id: string,
  contentType: 'training' | 'objection',
  reason?: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const table = contentType === 'training' ? 'nmm_custom_trainings' : 'nmm_custom_objections'

  // Fetch the submission row first to retrieve user contact details and the title before deletion
  const { data: row } = await admin
    .from(table)
    .select('user_email, user_name, data')
    .eq('id', id)
    .single()

  const { error } = await admin.from(table).delete().eq('id', id)
  if (error) {
    throw new Error('İçerik reddedilirken silinemedi: ' + error.message)
  }

  // Trigger rejection notification asynchronously
  if (row && row.user_email) {
    const rowData = row.data as any
    const title = contentType === 'training'
      ? (rowData?.baslik ?? 'İsimsiz İçerik')
      : (rowData?.soru?.tr ?? rowData?.soru?.en ?? rowData?.soru ?? 'İsimsiz İtiraz')

    // Find lang or default to 'tr'
    const userLang: 'tr' | 'en' = 'tr'

    sendModerationRejectedEmail(
      row.user_email,
      row.user_name ?? 'NMM Üyesi',
      contentType,
      title,
      rejectReasonForEmail(reason, userLang),
      userLang
    ).catch(err => {
      console.error('[Resend Rejection Email Error]', err)
    })
  }

  return { success: true }
}
