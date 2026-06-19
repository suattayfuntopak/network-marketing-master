'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdmin, isSuperAdmin } from '@/lib/domain/auth'
import { SUPER_ADMIN_EMAIL } from '@/lib/domain/constants'
import type { Json } from '@/types/database.types'
import { sendModerationAlertEmail, sendModerationApprovedEmail, sendModerationRejectedEmail } from '@/lib/infra/mail'
import {
  rejectReasonForEmail,
} from '@/lib/domain/moderationDefaults'
import { buildBilingualRejectReason } from '@/lib/domain/moderationRejectReason'
import { enrichApprovedModerationData } from '@/lib/domain/moderationApproval'
import {
  embedNotificationActionLink,
  moderationApprovedHref,
} from '@/lib/domain/moderationNotificationLink'
import { translateNoteAction } from '@/app/(dashboard)/pipeline/[id]/actions'
import { extractYoutubeId } from '@/lib/utils/youtubeId'

export type ModerationContentType = 'training' | 'objection' | 'video'

interface ContentSubmissionResult {
  success: boolean
  isApproved: boolean
}

/**
 * Moderasyon sonucu (onay/red) için gönderene UYGULAMA İÇİ bildirim oluşturur —
 * e-postaya ek olarak. Kullanıcının tasarladığı akış: sonuç ne olursa olsun
 * kişiye hem e-posta hem NMM içi bildirim gider. admin-client RLS'i baypas eder.
 */
async function notifyModerationOutcome(
  admin: ReturnType<typeof createAdminClient>,
  userId: string | null | undefined,
  approved: boolean,
  contentType: ModerationContentType,
  title: string,
  itemKey?: string,
  reason?: string,
): Promise<void> {
  if (!userId) return
  const kindTr = contentType === 'video' ? 'video' : contentType === 'training' ? 'eğitim içeriği' : 'itiraz'
  const kindEn = contentType === 'video' ? 'video' : contentType === 'training' ? 'training content' : 'objection'
  const reasonTr = reason ? rejectReasonForEmail(reason, 'tr') : ''
  const reasonEn = reason ? rejectReasonForEmail(reason, 'en') : ''
  const humanTr = approved
    ? `"${title}" (${kindTr}) onaylandı ve yayına alındı. Teşekkürler!`
    : `"${title}" (${kindTr}) bu kez yayınlanmadı.${reasonTr ? ` Gerekçe: ${reasonTr}` : ''}`
  const humanEn = approved
    ? `"${title}" (${kindEn}) was approved and published. Thank you!`
    : `"${title}" (${kindEn}) was not published this time.${reasonEn ? ` Reason: ${reasonEn}` : ''}`
  const description_tr =
    approved && itemKey
      ? embedNotificationActionLink(moderationApprovedHref(contentType, itemKey), humanTr)
      : humanTr
  const description_en =
    approved && itemKey
      ? embedNotificationActionLink(moderationApprovedHref(contentType, itemKey), humanEn)
      : humanEn
  try {
    await admin.from('nmm_notifications').insert({
      user_id: userId,
      title_tr: approved ? 'İçerik talebin onaylandı ✅' : 'İçerik talebin onaylanmadı',
      title_en: approved ? 'Your submission was approved ✅' : 'Your submission was not approved',
      description_tr,
      description_en,
      type: 'info',
    })
  } catch (err) {
    console.error('[notifyModerationOutcome]', err)
  }
}

/**
 * Yeni bir moderasyon talebi geldiğinde Süper Admin'e UYGULAMA İÇİ (zil) bildirim
 * oluşturur — e-postaya ek olarak. E-posta gözden kaçabilir; zil her zaman görünür.
 * Hataya dayanıklı: bildirim başarısız olsa bile talep gönderimi etkilenmez.
 */
export async function notifySuperAdminNewModerationRequest(
  contentType: ModerationContentType,
  title: string,
  submitterName: string,
): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const adminUser = usersPage?.users?.find(u => u.email === SUPER_ADMIN_EMAIL)
    if (!adminUser?.id) return
    const kindTr = contentType === 'video' ? 'video' : contentType === 'training' ? 'eğitim içeriği' : 'itiraz cevabı'
    const kindEn = contentType === 'video' ? 'video' : contentType === 'training' ? 'training content' : 'objection reply'
    await admin.from('nmm_notifications').insert({
      user_id: adminUser.id,
      title_tr: 'Yeni Onay Talebi 📝',
      title_en: 'New Approval Request 📝',
      description_tr: `${submitterName}, "${title}" (${kindTr}) ekleme talebinde bulundu. Onay Masası'nda inceleyebilirsin.`,
      description_en: `${submitterName} requested to add "${title}" (${kindEn}). Review it on the Approval Desk.`,
      type: 'info',
    })
  } catch (err) {
    console.error('[notifySuperAdminNewModerationRequest]', err)
  }
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
  data: Record<string, Json>
): Promise<ContentSubmissionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum kapalı: İçerik eklemek için lütfen giriş yapın.')

  const userEmail = user.email ?? ''
  const userName = (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? 'NMM Üyesi'

  const admin = createAdminClient()
  const table = contentType === 'training' ? 'nmm_custom_trainings' : 'nmm_custom_objections'
  const isApproved = isSuperAdmin(user)

  const { error } = await admin.from(table).insert({
    user_id: user.id,
    workspace_id: workspaceId,
    item_key: itemKey,
    data: data as Json,
    is_approved: isApproved,
    user_email: userEmail,
    user_name: userName,
  })

  if (error) {
    console.error(`[submitModeratedRequestAction] Insert error into ${table}:`, error)
    throw new Error('İçerik eklenirken bir hata oluştu: ' + error.message)
  }

  if (!isApproved) {
    const title = contentType === 'training'
      ? ((data.baslik as string | undefined) ?? 'İsimsiz İçerik')
      : (((data.soru as Record<string, string> | undefined)?.tr) ?? (data.soru as string | undefined) ?? 'İsimsiz İtiraz')
    sendModerationAlertEmail(userEmail, userName, contentType, title).catch(err => {
      console.error('[Resend Alert Error]', err)
    })
    void notifySuperAdminNewModerationRequest(contentType, title, userName)
  }

  return { success: true, isApproved }
}

export interface ModerationRequestItem {
  id: string
  userId: string
  workspaceId: string | null
  itemKey: string
  data: Json
  createdAt: string
  isApproved: boolean
  userEmail: string | null
  userName: string | null
  contentType: ModerationContentType
}

function videoRowToModerationData(row: {
  youtube_id: string
  title_tr: string
  title_en: string
  description_tr: string
  description_en: string
  duration_min: number
  category_tr: string
  category_en: string
  related_training_id: string | null
  sort_order: number
}): Json {
  return {
    youtubeUrlOrId: row.youtube_id,
    titleTr: row.title_tr,
    titleEn: row.title_en,
    descriptionTr: row.description_tr,
    descriptionEn: row.description_en,
    durationMin: row.duration_min,
    categoryTr: row.category_tr,
    categoryEn: row.category_en,
    relatedTrainingId: row.related_training_id,
    sortOrder: row.sort_order,
  } as Json
}

/**
 * Fetches all pending unapproved requests (restricted to Super Admin).
 */
export async function getPendingRequestsAction(): Promise<ModerationRequestItem[]> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()

  const [trainingsResult, objectionsResult, videosResult] = await Promise.all([
    admin
      .from('nmm_custom_trainings')
      .select('id, user_id, workspace_id, item_key, data, created_at, is_approved, user_email, user_name')
      .eq('is_approved', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
    admin
      .from('nmm_custom_objections')
      .select('id, user_id, workspace_id, item_key, data, created_at, is_approved, user_email, user_name')
      .eq('is_approved', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
    admin
      .from('nmm_training_videos')
      .select('id, key, user_id, workspace_id, youtube_id, title_tr, title_en, description_tr, description_en, duration_min, category_tr, category_en, related_training_id, sort_order, created_at, is_approved, user_email, user_name')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
  ])

  const { data: trainings, error: tErr } = trainingsResult
  if (tErr) console.error('[getPendingRequestsAction] trainings fetch error:', tErr)

  const { data: objections, error: oErr } = objectionsResult
  if (oErr) console.error('[getPendingRequestsAction] objections fetch error:', oErr)

  const { data: videos, error: vErr } = videosResult
  if (vErr) console.error('[getPendingRequestsAction] videos fetch error:', vErr)

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

  videos?.forEach(item => {
    list.push({
      id: item.id,
      userId: item.user_id ?? '',
      workspaceId: item.workspace_id,
      itemKey: item.key,
      data: videoRowToModerationData(item),
      createdAt: item.created_at,
      isApproved: item.is_approved,
      userEmail: item.user_email,
      userName: item.user_name,
      contentType: 'video',
    })
  })

  // Süper admin kendi içerik/video/itiraz düzenlemelerini KENDİNE onaya göndermez —
  // kendi gönderilerini masadan gizle (auto-approve edilmemiş eski/legacy satırlar dahil).
  // Masada yalnız "başkalarının" talepleri kalır.
  const pending = list.filter(r => r.userId !== user.id)

  // Gönderen onarımı: eski/seed satırlarda user_email/user_name boş olabilir ama
  // user_id durur — kimliği auth'tan çözüp doldur. Böylece "kim gönderdi" her zaman görünür.
  const unresolvedIds = Array.from(
    new Set(pending.filter(r => r.userId && (!r.userName || !r.userEmail)).map(r => r.userId as string)),
  )
  if (unresolvedIds.length > 0) {
    const resolved = new Map<string, { email: string | null; name: string | null }>()
    await Promise.all(
      unresolvedIds.map(async id => {
        try {
          const { data } = await admin.auth.admin.getUserById(id)
          const u = data?.user
          if (u) {
            resolved.set(id, {
              email: u.email ?? null,
              name: (u.user_metadata?.full_name as string | undefined) ?? u.email?.split('@')[0] ?? null,
            })
          }
        } catch (err) {
          console.error('[getPendingRequestsAction] getUserById failed:', err)
        }
      }),
    )
    for (const r of pending) {
      if (!r.userId) continue
      const u = resolved.get(r.userId)
      if (!u) continue
      if (!r.userEmail) r.userEmail = u.email
      if (!r.userName) r.userName = u.name
    }
  }

  return pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Approves a user submission, with optional edits from Super Admin.
 * Sends approval email with direct deep links to content.
 */
export async function approveRequestAction(
  id: string,
  contentType: ModerationContentType,
  editedData: Json
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()

  if (contentType === 'video') {
    const edited = editedData as Record<string, unknown>
    const { data: row, error: fetchErr } = await admin
      .from('nmm_training_videos')
      .select('user_email, user_name, key, user_id')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      throw new Error('Video kaydı bulunamadı: ' + (fetchErr?.message ?? ''))
    }

    const youtubeId = extractYoutubeId(String(edited.youtubeUrlOrId ?? edited.youtube_id ?? ''))
    if (!youtubeId) throw new Error('Geçerli bir YouTube video bağlantısı/ID gerekli.')

    const { error: updateErr } = await admin
      .from('nmm_training_videos')
      .update({
        youtube_id: youtubeId,
        title_tr: String(edited.titleTr ?? edited.title_tr ?? '').trim(),
        title_en: String(edited.titleEn ?? edited.title_en ?? edited.titleTr ?? '').trim(),
        description_tr: String(edited.descriptionTr ?? edited.description_tr ?? '').trim(),
        description_en: String(edited.descriptionEn ?? edited.description_en ?? '').trim(),
        duration_min: Math.max(1, Math.round(Number(edited.durationMin ?? edited.duration_min ?? 10))),
        category_tr: String(edited.categoryTr ?? edited.category_tr ?? '').trim(),
        category_en: String(edited.categoryEn ?? edited.category_en ?? '').trim(),
        related_training_id: (edited.relatedTrainingId ?? edited.related_training_id ?? null) as string | null,
        sort_order: Number(edited.sortOrder ?? edited.sort_order ?? 999),
        is_approved: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) {
      throw new Error('Video onaylanırken hata oluştu: ' + updateErr.message)
    }

    const title = String(edited.titleTr ?? edited.title_tr ?? 'İsimsiz Video')
    if (row.user_email) {
      sendModerationApprovedEmail(
        row.user_email,
        row.user_name ?? 'NMM Üyesi',
        'video',
        title,
        row.key,
        'tr',
      ).catch(err => {
        console.error('[Resend Approval Notification Error]', err)
      })
    }
    await notifyModerationOutcome(admin, row.user_id, true, 'video', title, row.key)

    return { success: true }
  }

  const table = contentType === 'training' ? 'nmm_custom_trainings' : 'nmm_custom_objections'

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
    editedData as unknown as Record<string, unknown>,
    translateNoteAction,
  )

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

  const userLang: 'tr' | 'en' = 'tr'

  const editedRecord = (typeof editedData === 'object' && editedData !== null && !Array.isArray(editedData))
    ? (editedData as Record<string, unknown>)
    : null
  const title = contentType === 'training'
    ? ((enrichedData.baslik as string | undefined) ?? (editedRecord?.baslik as string | undefined) ?? 'İsimsiz İçerik')
    : (((enrichedData.soru as Record<string, string> | undefined)?.tr) ?? ((editedRecord?.soru as Record<string, string> | undefined)?.tr) ?? (editedRecord?.soru as string | undefined) ?? 'İsimsiz İtiraz')

  if (row.user_email) {
    sendModerationApprovedEmail(row.user_email, row.user_name ?? 'NMM Üyesi', contentType, title, row.item_key, userLang).catch(err => {
      console.error('[Resend Approval Notification Error]', err)
    })
  }
  await notifyModerationOutcome(admin, row.user_id, true, contentType, title, row.item_key)

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
  contentType: ModerationContentType,
  reason?: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()

  if (contentType === 'video') {
    const { data: row } = await admin
      .from('nmm_training_videos')
      .select('user_email, user_name, title_tr, user_id')
      .eq('id', id)
      .single()

    const { error } = await admin.from('nmm_training_videos').delete().eq('id', id)
    if (error) {
      throw new Error('Video reddedilirken silinemedi: ' + error.message)
    }

    if (row?.user_email) {
      sendModerationRejectedEmail(
        row.user_email,
        row.user_name ?? 'NMM Üyesi',
        'video',
        row.title_tr ?? 'İsimsiz Video',
        rejectReasonForEmail(reason, 'tr'),
        'tr',
      ).catch(err => {
        console.error('[Resend Rejection Email Error]', err)
      })
    }
    await notifyModerationOutcome(admin, row?.user_id, false, 'video', row?.title_tr ?? 'İsimsiz Video', undefined, reason)

    return { success: true }
  }

  const table = contentType === 'training' ? 'nmm_custom_trainings' : 'nmm_custom_objections'

  const { data: row } = await admin
    .from(table)
    .select('user_email, user_name, data, user_id')
    .eq('id', id)
    .single()

  const { error } = await admin.from(table).delete().eq('id', id)
  if (error) {
    throw new Error('İçerik reddedilirken silinemedi: ' + error.message)
  }

  if (row) {
    const rowData = row.data as Record<string, Json | undefined>
    const title = contentType === 'training'
      ? ((rowData?.baslik as string | undefined) ?? 'İsimsiz İçerik')
      : (((rowData?.soru as Record<string, string> | undefined)?.tr) ?? ((rowData?.soru as Record<string, string> | undefined)?.en) ?? (rowData?.soru as string | undefined) ?? 'İsimsiz İtiraz')

    const userLang: 'tr' | 'en' = 'tr'

    if (row.user_email) {
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
    await notifyModerationOutcome(admin, row.user_id, false, contentType, title, undefined, reason)
  }

  return { success: true }
}
