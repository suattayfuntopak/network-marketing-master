'use server'

import { createClient } from '@/lib/supabase/server'
import { DAILY_MESSAGE_LIMIT } from '@/lib/aiUsage'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      error: lang === 'en' ? 'Authentication required.' : 'Oturum açmanız gerekmektedir.',
    }
  }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  // Quota verification
  let remaining = DAILY_MESSAGE_LIMIT
  if (!isSuperAdmin) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .or('note.is.null,note.eq.message')
      .gte('created_at', today.toISOString())

    const used = count ?? 0
    if (used >= DAILY_MESSAGE_LIMIT) {
      return {
        error: lang === 'en'
          ? `You have reached the daily AI coaching limit of ${DAILY_MESSAGE_LIMIT} messages. Please try again tomorrow.`
          : `Günlük ${DAILY_MESSAGE_LIMIT} yapay zeka mesaj/koçluk limitinize ulaştınız. Yarın tekrar deneyebilirsiniz.`,
        remaining: 0,
      }
    }
    remaining = DAILY_MESSAGE_LIMIT - used - 1
  }

  // Get active workspace membership
  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

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

    if (membership && !isSuperAdmin) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate',
        note: 'message',
      })
    }

    return {
      message: generatedText,
      remaining: isSuperAdmin ? undefined : remaining,
    }
  } catch (err: any) {
    console.error('[generateOnboardingGuidanceAction] error:', err)
    return {
      error: lang === 'en'
        ? 'Failed to generate guidance message: ' + (err?.message || String(err))
        : 'Rehberlik mesajı üretilemedi: ' + (err?.message || String(err)),
    }
  }
}
