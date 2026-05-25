'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { DAILY_AI_LIMIT } from '@/lib/aiUsage'
import Anthropic from '@anthropic-ai/sdk'

const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CoachState {
  message?: string
  error?: string
}

export async function generateCoachMessage(
  _prev: CoachState,
  formData: FormData,
): Promise<CoachState> {
  const candidateId = (formData.get('candidateId') as string | null)?.trim() ?? ''
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const note        = (formData.get('note')        as string | null)?.trim() ?? ''
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'

  if (!name || !stage) return { error: 'Kişi bilgisi eksik.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  // Ownership check: candidate must belong to caller's workspace
  if (candidateId && !isSuperAdmin) {
    const { data: membership } = await supabase
      .from('nmm_workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) return { error: 'Çalışma alanı bulunamadı.' }
    const { count } = await supabase
      .from('nmm_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('id', candidateId)
      .eq('workspace_id', membership.workspace_id)
    if ((count ?? 0) === 0) return { error: 'Erişim reddedildi.' }
  }

  if (!isSuperAdmin) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .gte('created_at', today.toISOString())

    if ((count ?? 0) >= DAILY_AI_LIMIT) {
      return { error: `Günlük ${DAILY_AI_LIMIT} mesaj limitine ulaştınız. Yarın tekrar deneyin.` }
    }
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  try {
    const message = await generateMessage({ name, stage, note, messageType })

    if (membership && !isSuperAdmin) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate' as const,
      })
    }

    return { message }
  } catch {
    return { error: 'Mesaj oluşturulamadı.' }
  }
}

export async function generateDownlineCoachingMessage(
  _prev: CoachState,
  formData: FormData
): Promise<CoachState> {
  const memberName     = (formData.get('memberName')     as string | null)?.trim() ?? ''
  const candidateCount = parseInt(formData.get('candidateCount') as string ?? '0')
  const yeniCount      = parseInt(formData.get('yeniCount')      as string ?? '0')
  const sunumCount     = parseInt(formData.get('sunumCount')     as string ?? '0')
  const takipCount     = parseInt(formData.get('takipCount')     as string ?? '0')
  const katildiCount   = parseInt(formData.get('katildiCount')   as string ?? '0')
  const daysInactive   = parseInt(formData.get('daysInactive')   as string ?? '7')

  if (!memberName) return { error: 'Üye bilgisi eksik.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  if (!isSuperAdmin) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .gte('created_at', today.toISOString())

    if ((count ?? 0) >= DAILY_AI_LIMIT) {
      return { error: `Günlük ${DAILY_AI_LIMIT} mesaj limitine ulaştınız. Yarın tekrar deneyin.` }
    }
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: [
        {
          type: 'text',
          text: `Sen bir network marketing lideri ve takım koçusun. Ekibindeki downline (alt hat) distribütörlerin sahadaki aktiflik durumuna göre onlara göndermek üzere motive edici, suçlayıcı olmayan, yapıcı ve doğrudan aksiyona yönlendiren mentörlük mesajları hazırlıyorsun.
Sana distribütörün adı, toplam aday sayısı, aşama dağılımı (yeni aday, sunum, takip, katıldı) ve kaç gündür inaktif (sisteme kayıt girmemiş veya eylem yapmamış) olduğu verilecek.
Amacın:
1. Onun durumunu anladığını belirtmek ve empatik olmak (suçlamadan).
2. İstatistiklerine göre (örneğin: sunum sayısı iyi ama takip yoksa takip yapmasını hatırlatmak; hiç aday yoksa aday listesi yapmayı önermek gibi) nokta atışı pratik saha tavsiyesi vermek.
3. Onu birebir bir kahve görüşmesine veya yardımlaşma aramasına davet etmek.
Kısa, samimi, 2-3 emoji içeren ve WhatsApp'tan gönderilmeye uygun Türkçe bir koçluk mesajı yaz. Başka açıklama ekleme.`,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: `Distribütör Adı: ${memberName}
Toplam Aday: ${candidateCount}
Dağılım: ${yeniCount} Yeni, ${sunumCount} Sunum, ${takipCount} Takip, ${katildiCount} Katıldı
İnaktif Gün: ${daysInactive} gündür sisteme veri girişi yapılmadı.`,
        }
      ]
    })

    const message = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    if (!message) throw new Error('Boş yanıt döndü.')

    if (membership && !isSuperAdmin) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate' as const,
      })
    }

    return { message }
  } catch (err: any) {
    console.error('Coaching message error', err)
    return { error: 'Koçluk mesajı oluşturulamadı.' }
  }
}
