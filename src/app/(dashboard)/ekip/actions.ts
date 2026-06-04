'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
