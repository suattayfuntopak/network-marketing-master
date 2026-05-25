'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { DAILY_MESSAGE_LIMIT, DAILY_ROLEPLAY_LIMIT } from '@/lib/aiUsage'
import Anthropic from '@anthropic-ai/sdk'

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'

export interface YazarFormState {
  message?: string
  error?: string
  remaining?: number
}

export async function generateMessageAction(
  _prev: YazarFormState,
  formData: FormData
): Promise<YazarFormState> {
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const context     = (formData.get('context')     as string | null)?.trim() ?? ''
  const tone        = (formData.get('tone')        as string | null)?.trim() ?? 'samimi'
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'
  const warmth      = (formData.get('warmth')      as string | null)?.trim() ?? 'ilik'

  if (!name) return { error: 'Kişi adı zorunlu.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

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
      return { error: `Günlük ${DAILY_MESSAGE_LIMIT} mesaj limitine ulaştınız. Yarın tekrar deneyin.`, remaining: 0 }
    }
    remaining = DAILY_MESSAGE_LIMIT - used - 1
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  try {
    const message = await generateMessage({ name, stage, context, tone, messageType, warmth })

    if (membership && !isSuperAdmin) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate' as const,
        note: 'message',
      })
    }

    return { message, remaining: isSuperAdmin ? undefined : remaining }
  } catch {
    return { error: 'Mesaj oluşturulamadı.' }
  }
}

export interface RoleplayResponseState {
  candidate_reply?: string
  yzk_score?: number
  yzk_strengths?: string[]
  yzk_improvements?: string
  remaining?: number
  error?: string
}

export async function generateRoleplayResponseAction(
  scenarioId: string,
  messageHistory: { role: string; text: string; score?: number; strengths?: string[]; improvements?: string }[],
  userReply: string,
  lang: string
): Promise<RoleplayResponseState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  let remaining = DAILY_ROLEPLAY_LIMIT
  if (!isSuperAdmin) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .eq('note', 'roleplay')
      .gte('created_at', today.toISOString())

    const used = count ?? 0
    if (used >= DAILY_ROLEPLAY_LIMIT) {
      return { error: `Günlük ${DAILY_ROLEPLAY_LIMIT} prova limitine ulaştınız. Yarın tekrar deneyin.`, remaining: 0 }
    }
    remaining = DAILY_ROLEPLAY_LIMIT - used - 1
  }

  // Construct message history string
  const promptHistory = messageHistory.map(m => {
    if (m.role === 'candidate') {
      return `Aday: ${m.text}`
    } else if (m.role === 'user') {
      return `Distribütör: ${m.text}`
    } else {
      return `YZK Notu: Puan: ${m.score}, Güçlü Yönler: ${m.strengths?.join(', ')}, Tavsiye: ${m.improvements}`
    }
  }).join('\n')

  const systemPrompt = `Sen bir Network Marketing simülatörü ve lider gelişim koçusun (Yapay Zeka Koçu).

GÖREVİN:
1. ADAY ROLÜ (SIMÜLASYON): Seçilen senaryoya (${scenarioId}) uygun olarak davran. Distribütörün en son yazdığı yanıta (${userReply}) karşılık, gerçek bir adaymışsın gibi bir sonraki yanıtını Türkçe olarak yaz. Gerçekçi, hafif itiraz eden, sohbete açık bir duruş sergile. Cevabı JSON'daki "candidate_reply" alanına yerleştir.
2. MENTÖR KOÇ ROLÜ: Distribütörün son yazdığı yanıtı (${userReply}) network marketing ilkelerine (empati kurma, merak uyandırma, profesyonellik) göre değerlendir:
   - 0 ile 100 arasında bir liderlik puanı belirle ve JSON'daki "yzk_score" alanına yerleştir.
   - En fazla 2 adet çok net ve pozitif güçlü yönünü belirtip JSON'daki "yzk_strengths" dizisine yerleştir.
   - Distribütörün bir sonraki sefere daha iyi yapması için en fazla 1 adet motivasyonel ve eyleme dökülebilir tavsiye yazıp JSON'daki "yzk_improvements" alanına yerleştir.

DİL POLİTİKASI:
Eğer dil (language) parametresi 'en' ise, tüm JSON içeriğini (candidate_reply, yzk_strengths, yzk_improvements) tamamen İngilizce yaz. Eğer 'tr' ise tamamen Türkçe yaz.

FORMAT KURALI:
Format kuralına kesinlikle uy. Sadece ve sadece geçerli bir JSON objesi döndür. Başında veya sonunda hiçbir kod bloğu işareti (\`\`\`), açıklama, giriş veya sonuç ekleme. JSON yapısı şu şekilde olmalıdır:
{
  "candidate_reply": "Adayın distribütöre vereceği cevap...",
  "yzk_score": 85,
  "yzk_strengths": ["Güçlü yön 1", "Güçlü yön 2"],
  "yzk_improvements": "Motivasyonel tavsiye..."
}
`;

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: [
        {
          type: 'text',
          text: systemPrompt,
        }
      ],
      messages: [
        {
          role: 'user',
          content: `Konuşma Geçmişi:\n${promptHistory}\n\nDistribütörün Son Yanıtı: ${userReply}\n\nDil Parametresi: ${lang === 'en' ? 'en' : 'tr'}`,
        }
      ]
    })

    let text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    // Strip markdown code fences if present
    if (text.startsWith('```json')) {
      text = text.substring(7)
    } else if (text.startsWith('```')) {
      text = text.substring(3)
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3)
    }
    text = text.trim()

    const parsed = JSON.parse(text)

    // Save action usage in Supabase
    const { data: membership } = await supabase
      .from('nmm_workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membership && !isSuperAdmin) {
      try {
        await supabase.from('nmm_daily_actions').insert({
          workspace_id: membership.workspace_id,
          user_id: user.id,
          candidate_id: null,
          action_type: 'ai_generate' as const,
          note: 'roleplay',
        })
      } catch (dbErr) {
        console.error('Failed to insert roleplay daily action log (constraint issues):', dbErr)
      }
    }

    return {
      candidate_reply: parsed.candidate_reply,
      yzk_score: parsed.yzk_score,
      yzk_strengths: parsed.yzk_strengths,
      yzk_improvements: parsed.yzk_improvements,
      remaining: isSuperAdmin ? undefined : remaining
    }
  } catch (err: any) {
    console.error('YZK Simülasyon Hatası:', err)
    return { error: (lang === 'en' ? 'Simulation failed: ' : 'Simülasyon yanıtı oluşturulamadı: ') + (err?.message || String(err)) }
  }
}
