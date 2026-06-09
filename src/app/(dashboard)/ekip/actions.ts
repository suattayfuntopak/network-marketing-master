'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { resolveGeminiModel } from '@/lib/ai/resolveModel'
import { findLeaderCandidateForMember, scoreMemberCandidateNameMatch } from '@/lib/team/matchCandidate'
import { getAuthUser } from '@/lib/supabase/authUser'
import { isSuperAdmin } from '@/lib/domain/auth'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import type { MemberRow } from '@/lib/team/types'

export type CoachingHistoryItem = {
  id: string
  preview: string
  createdAt: string
}

export type CoachingTemplates = {
  active: string
  recent: string
  silent: string
}

export type MemberDetailPayload = {
  member: MemberRow | null
  weeklyActivity: { calls: number; whatsapps: number }
  coachingHistory: CoachingHistoryItem[]
  dailyActivity: Array<{ date: string; count: number }>
  memberGoal: { targetPeople: number; targetMonths: number } | null
  hasAccess: boolean
}

export async function getMemberDetailAction(
  workspaceId: string,
  targetUserId: string,
): Promise<MemberDetailPayload> {
  const empty: MemberDetailPayload = {
    member: null,
    weeklyActivity: { calls: 0, whatsapps: 0 },
    coachingHistory: [],
    dailyActivity: [],
    memberGoal: null,
    hasAccess: false,
  }
  const { user } = await getAuthUser()
  if (!user) return empty

  const supabase = await createClient()
  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (ws?.owner_id !== user.id && !isSuperAdmin(user)) return empty

  const bundle = await fetchTeamBundleAction(workspaceId)
  const member = bundle.ekipRows.find(m => m.user_id === targetUserId) ?? null
  if (!member) return empty

  const now = new Date()

  const [activityResult, coachRows, actRows, goalRow] = await Promise.all([
    getTeamFieldActivityAction(workspaceId, '7d', [targetUserId]),
    supabase
      .from('nmm_daily_actions')
      .select('id, note_tr, created_at')
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .like('note_tr', `coaching:${targetUserId}:%`)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('nmm_daily_actions')
      .select('created_at')
      .eq('user_id', targetUserId)
      .gte('created_at', new Date(now.getTime() - 7 * 86_400_000).toISOString())
      .neq('action_type', 'ai_generate'),
    supabase
      .from('nmm_member_goals')
      .select('target_people, target_months')
      .eq('workspace_id', workspaceId)
      .eq('member_user_id', targetUserId)
      .maybeSingle(),
  ])

  const ua = activityResult.byUser[targetUserId]

  const coachingHistory: CoachingHistoryItem[] = (coachRows.data ?? []).map(r => ({
    id: r.id,
    preview: (r.note_tr ?? '').replace(`coaching:${targetUserId}:`, ''),
    createdAt: r.created_at,
  }))

  const countByDate: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    countByDate[d.toISOString().slice(0, 10)] = 0
  }
  for (const r of actRows.data ?? []) {
    const key = r.created_at.slice(0, 10)
    if (key in countByDate) countByDate[key]++
  }
  const dailyActivity = Object.entries(countByDate).map(([date, count]) => ({ date, count }))

  const memberGoal = goalRow.data
    ? { targetPeople: goalRow.data.target_people, targetMonths: goalRow.data.target_months }
    : null

  return {
    member,
    weeklyActivity: {
      calls: ua?.calls ?? 0,
      whatsapps: ua?.whatsapps ?? 0,
    },
    coachingHistory,
    dailyActivity,
    memberGoal,
    hasAccess: true,
  }
}

export async function getCoachingTemplatesAction(
  workspaceId: string,
): Promise<CoachingTemplates> {
  const { user } = await getAuthUser()
  if (!user) return { active: '', recent: '', silent: '' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('nmm_workspaces')
    .select('coaching_templates')
    .eq('id', workspaceId)
    .single()

  const raw = data?.coaching_templates as Record<string, string> | null
  return {
    active: raw?.active ?? '',
    recent: raw?.recent ?? '',
    silent: raw?.silent ?? '',
  }
}

export async function saveCoachingTemplatesAction(
  workspaceId: string,
  templates: CoachingTemplates,
): Promise<void> {
  const { user } = await getAuthUser()
  if (!user) return

  const supabase = await createClient()
  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (ws?.owner_id !== user.id && !isSuperAdmin(user)) return

  await supabase
    .from('nmm_workspaces')
    .update({ coaching_templates: templates })
    .eq('id', workspaceId)
}

/** Per-member coaching templates stored in nmm_workspace_members. */
export async function getMemberCoachingTemplatesAction(
  workspaceId: string,
  targetUserId: string,
): Promise<CoachingTemplates> {
  const { user } = await getAuthUser()
  if (!user) return { active: '', recent: '', silent: '' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('coaching_templates')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .maybeSingle()

  const raw = data?.coaching_templates as Record<string, string> | null
  return {
    active: raw?.active ?? '',
    recent: raw?.recent ?? '',
    silent: raw?.silent ?? '',
  }
}

export async function saveMemberCoachingTemplatesAction(
  workspaceId: string,
  targetUserId: string,
  templates: CoachingTemplates,
): Promise<void> {
  const { user } = await getAuthUser()
  if (!user) return

  const supabase = await createClient()
  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (ws?.owner_id !== user.id && !isSuperAdmin(user)) return

  await supabase
    .from('nmm_workspace_members')
    .update({ coaching_templates: templates })
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
}

/**
 * Resolves profile photo URLs for team members (downlines + workspace members).
 * Uses auth metadata when workspace_members.avatar_url is null on the sponsor side.
 */
export async function resolveTeamAvatarsAction(
  workspaceId: string,
  userIds: string[]
): Promise<Record<string, string>> {
  if (!userIds.length) return {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: ownWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (!ownWs || ownWs.owner_id !== user.id) return {}

  const allowedIds = new Set<string>([ownWs.owner_id])
  const { data: wsMembers } = await supabase
    .from('nmm_workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
  wsMembers?.forEach(m => allowedIds.add(m.user_id))

  // Downline keşfi kolon-kısıtlı definer rpc ile (055) — davet kodu/lisans sızdırmaz.
  const { data: downlineWs } = await supabase.rpc('nmm_leader_downline_workspaces')

  downlineWs?.forEach(w => {
    if (w.owner_id) allowedIds.add(w.owner_id)
  })

  const requested = userIds.filter(id => allowedIds.has(id))
  if (!requested.length) return {}

  const { data: avatarMap, error: rpcError } = await supabase.rpc('nmm_resolve_team_avatars', {
    p_workspace_id: workspaceId,
    p_user_ids: requested,
  })

  if (rpcError) {
    console.error('[resolveTeamAvatarsAction] rpc error:', rpcError)
    return {}
  }

  if (!avatarMap || typeof avatarMap !== 'object') return {}

  const result: Record<string, string> = {}
  for (const [userId, url] of Object.entries(avatarMap as Record<string, unknown>)) {
    if (typeof url === 'string' && url.trim()) result[userId] = url
  }
  return result
}

export async function toggleOnboardingStepAction(
  userId: string,
  stepId: string,
  markDone: boolean
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  if (markDone) {
    const { error } = await supabase.from('nmm_onboarding_progress').insert({
      user_id: userId,
      step_id: stepId,
    })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('nmm_onboarding_progress')
      .delete()
      .eq('user_id', userId)
      .eq('step_id', stepId)
    if (error) throw new Error(error.message)
  }
}

type AddTeamMemberAsCandidateOptions = {
  memberUserId?: string
  memberPhone?: string | null
}

/** Ekip üyesini sponsor boru hattına aday olarak bağla (eşleşme yoksa yeni katildi kaydı). */
export async function addTeamMemberAsCandidateAction(
  workspaceId: string,
  memberName: string,
  options?: AddTeamMemberAsCandidateOptions,
): Promise<{ candidateId: string; created: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const trimmedName = memberName.trim()
  if (!trimmedName) throw new Error('Üye adı gerekli.')

  const { data: ownWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (!ownWs || ownWs.owner_id !== user.id) {
    throw new Error('Bu işlem için lider yetkisi gerekli.')
  }

  const { data: leaderCandidates, error: candErr } = await supabase
    .from('nmm_candidates')
    .select('id, full_name, owner_id, stage, phone')
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)

  if (candErr) throw new Error(candErr.message)

  const pool = leaderCandidates ?? []
  const existingId = findLeaderCandidateForMember(pool, user.id, trimmedName)
  if (existingId) {
    if (options?.memberUserId) {
      await supabase.from('nmm_team_pipeline_links').upsert(
        {
          workspace_id: workspaceId,
          member_user_id: options.memberUserId,
          candidate_id: existingId,
        },
        { onConflict: 'workspace_id,member_user_id' },
      )
      await supabase
        .from('nmm_team_pipeline_match_blocks')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('member_user_id', options.memberUserId)
    }
    return { candidateId: existingId, created: false }
  }

  let resolvedPhone = options?.memberPhone?.trim() || null
  if (!resolvedPhone) {
    for (const c of pool) {
      if (scoreMemberCandidateNameMatch(trimmedName, c.full_name) >= 80 && c.phone?.trim()) {
        resolvedPhone = c.phone.trim()
        break
      }
    }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('nmm_candidates')
    .insert({
      workspace_id: workspaceId,
      owner_id: user.id,
      full_name: trimmedName,
      stage: 'katildi',
      note_tr: 'Ekibimden boru hattına eklendi',
      note_en: 'Added from my team to pipeline',
      warmth: 'ilik',
      ...(resolvedPhone ? { phone: resolvedPhone } : {}),
    })
    .select('id')
    .single()

  if (insertErr || !inserted) throw new Error(insertErr?.message ?? 'Aday eklenemedi.')

  const candidateId = inserted.id
  if (options?.memberUserId) {
    await supabase.from('nmm_team_pipeline_links').upsert(
      {
        workspace_id: workspaceId,
        member_user_id: options.memberUserId,
        candidate_id: candidateId,
      },
      { onConflict: 'workspace_id,member_user_id' },
    )
    await supabase
      .from('nmm_team_pipeline_match_blocks')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('member_user_id', options.memberUserId)
  }

  await supabase.from('nmm_daily_actions').insert([
    {
      workspace_id: workspaceId,
      user_id: user.id,
      candidate_id: inserted.id,
      action_type: 'note',
      note: 'system_note:candidate_created',
    },
    {
      workspace_id: workspaceId,
      user_id: user.id,
      candidate_id: inserted.id,
      action_type: 'stage_change',
      note: 'joined',
    },
  ])

  return { candidateId, created: true }
}

export async function joinWorkspaceByInviteAction(
  inviteCode: string
): Promise<{ workspace_name?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data, error } = await supabase.rpc('nmm_join_workspace', {
    p_invite_code: inviteCode.trim().toUpperCase(),
  })
  if (error) throw new Error(error.message)

  if (data && typeof data === 'object' && 'workspace_name' in data) {
    return { workspace_name: String((data as { workspace_name?: string }).workspace_name ?? '') }
  }
  return {}
}

export async function removeTeamMemberAction(
  memberId: string,
  memberName: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { error } = await supabase.rpc('nmm_remove_member', {
    p_member_id: memberId,
    p_member_name: memberName,
  })
  if (error) throw new Error(error.message)
}

export async function syncMemberAvatarAction(avatarUrl: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('nmm_sync_member_avatar', { p_avatar_url: avatarUrl })
  if (error) throw new Error(error.message)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const ONBOARDING_STEPS_TR: Record<string, string> = {
  'step_why': 'Başlangıç Görüşmesi & "Neden?" Belirleme',
  'step_list': '20-50 Kişilik Liste Oluşturma',
  'step_first_5': 'İlk 5 Adayı Belirleme',
  'step_3way': 'Sponsorla İlk 3\'lü Görüşme (3-Way Call)',
  'step_social': 'Sosyal Medyada İlk Ürün Paylaşımı',
  'step_independent': 'Sponsorsuz İlk Bağımsız Sunum',
  'step_objections': 'İtirazlara Cevaplar Modülü Eğitimi',
  'step_90day': '90 Günlük Saha Aksiyon Planı Yazımı',
  'step_complete': '30. Gün Kapanış & Değerlendirme',
}

const ONBOARDING_STEPS_EN: Record<string, string> = {
  'step_why': 'Kickoff Meeting & Define "Why"',
  'step_list': 'Create a list of 20-50 Names',
  'step_first_5': 'Identify first 5 and send messages',
  'step_3way': 'First 3-Way Call with Sponsor',
  'step_social': 'First Product Post on Social Media',
  'step_independent': 'First Independent Presentation',
  'step_objections': 'Study Objection Handling Module',
  'step_90day': 'Write 90-Day Field Action Plan',
  'step_complete': 'Day 30 Review & Reflection',
}

export interface CoachGuidanceState {
  message?: string
  error?: string
  remaining?: number
}

export async function generateOnboardingGuidanceAction(
  memberName: string,
  stepId: string,
  lang: 'tr' | 'en'
): Promise<CoachGuidanceState> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      error: lang === 'en'
        ? 'GEMINI_API_KEY is missing! Please configure it in your workspace.'
        : 'GEMINI_API_KEY eksik! Lütfen sistem yöneticinizle iletişime geçin.',
    }
  }

  const quota = await checkAIQuota('message', { lang })
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  const stepLabel = lang === 'en'
    ? (ONBOARDING_STEPS_EN[stepId] || stepId)
    : (ONBOARDING_STEPS_TR[stepId] || stepId)

  const coachModel = resolveGeminiModel('deep_coach', quota.licenseType)

  try {
    const model = genAI.getGenerativeModel({
      model: coachModel,
      systemInstruction: lang === 'en'
        ? `You are an expert Network Marketing (MLM) AI Leadership Coach. Your task is to generate a highly motivational, professional, and practical message/script written from the perspective of a supportive sponsor (team leader) to their new team member ${memberName} to guide them through their onboarding checklist step: "${stepLabel}".
The message should be action-oriented, encouraging, include a few relevant emojis, and contain a small, actionable pro-tip tailored to that specific step (e.g. for listing, remind them not to prejudge; for a 3-way call, mention edification and validation).
The tone must be close, supportive, and professional.
Output ONLY the message itself, formatted clean and ready to copy & paste onto WhatsApp. Do not include any conversational intros, titles, or outros.`
        : `Sen deneyimli bir Network Marketing (MLM) Yapay Zeka Liderlik Koçusun. Görevin, bir sponsorun (ekip liderinin) yeni distribütör ortağı olan ${memberName} isimli ekip üyesine, distribütör başlatma/onboarding sürecindeki "${stepLabel}" adımını gerçekleştirmesi için yazacağı motive edici, son derece pratik ve profesyonel bir rehberlik/aksiyon mesajı (senaryosu) üretmektir.
Mesaj doğrudan WhatsApp üzerinden gönderilmeye uygun, samimi ama profesyonel, birkaç ilgili emoji barındıran ve bu adıma özel pratik bir ipucu içeren (örneğin isim listesi için "asla ön yargıda bulunma, herkesi yaz"; 3'lü görüşme için "sponsorunu doğru edifiye etmenin gücü" vb.) yapıda olmalıdır.
Sadece mesajın kendisini çıktı olarak ver. "İşte mesajınız:", başlıklar ya da başka açıklama paragrafları ekleme. Lider doğrudan kopyalayıp WhatsApp'tan gönderebilsin.`,
    })

    const promptText = lang === 'en'
      ? `Generate a WhatsApp script for ${memberName} on step "${stepLabel}" to help them complete it successfully.`
      : `Ekip üyem ${memberName} için "${stepLabel}" adımını başarıyla tamamlamasını sağlayacak, kopyalayıp WhatsApp'tan gönderebileceğim bir koçluk/destek mesajı yaz.`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
    })

    const generatedText = result.response.text()?.trim() || ''

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      aiModel: coachModel,
    })

    return {
      message: generatedText,
      remaining: quota.isSuperAdmin ? undefined : quota.remaining,
    }
  } catch (err: unknown) {
    console.error('[generateOnboardingGuidanceAction] error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return {
      error: lang === 'en'
        ? 'Failed to generate guidance message: ' + msg
        : 'Rehberlik mesajı üretilemedi: ' + msg,
    }
  }
}
