'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { getLimitsForLicense } from '@/lib/aiUsage'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { GoogleGenerativeAI } from '@google/generative-ai'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface CoachState {
  message?: string
  error?: string
}

export async function generateCoachMessage(
  _prev: CoachState,
  formData: FormData,
): Promise<CoachState> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

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
      .eq('owner_id', user.id)
    if ((count ?? 0) === 0) return { error: 'Erişim reddedildi.' }
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!isSuperAdmin) {
    const { data: ws } = await supabase
      .from('nmm_workspaces')
      .select('license_type, license_expires_at')
      .eq('id', membership?.workspace_id ?? '')
      .maybeSingle()
    const licenseType = ws?.license_expires_at && new Date(ws.license_expires_at) < new Date() ? 'free' : (ws?.license_type ?? 'free')
    const { messageLimit } = getLimitsForLicense(licenseType)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .or('note.is.null,note.eq.message')
      .gte('created_at', today.toISOString())

    if ((count ?? 0) >= messageLimit) {
      return { error: `Günlük ${messageLimit} mesaj limitine ulaştınız. Yarın tekrar deneyin.` }
    }
  }

  try {
    const message = await generateMessage({ name, stage, note, messageType })

    if (membership) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate' as const,
        note: 'message',
      })
    }

    return { message }
  } catch (err: any) {
    return { error: 'Mesaj oluşturulamadı: ' + (err?.message || String(err)) }
  }
}

export async function generateDownlineCoachingMessage(
  _prev: CoachState,
  formData: FormData
): Promise<CoachState> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

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

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!isSuperAdmin) {
    const { data: ws } = await supabase
      .from('nmm_workspaces')
      .select('license_type, license_expires_at')
      .eq('id', membership?.workspace_id ?? '')
      .maybeSingle()
    const licenseType = ws?.license_expires_at && new Date(ws.license_expires_at) < new Date() ? 'free' : (ws?.license_type ?? 'free')
    const { messageLimit } = getLimitsForLicense(licenseType)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .or('note.is.null,note.eq.message')
      .gte('created_at', today.toISOString())

    if ((count ?? 0) >= messageLimit) {
      return { error: `Günlük ${messageLimit} mesaj limitine ulaştınız. Yarın tekrar deneyin.` }
    }
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: `Sen bir network marketing lideri ve takım koçusun. Ekibindeki downline (alt hat) distribütörlerin sahadaki aktiflik durumuna göre onlara göndermek üzere motive edici, suçlayıcı olmayan, yapıcı ve doğrudan aksiyona yönlendiren mentörlük mesajları hazırlıyorsun.
Sana distribütörün adı, toplam aday sayısı, aşama dağılımı (yeni aday, sunum, takip, katıldı) ve kaç gündür inaktif (sisteme kayıt girmemiş veya eylem yapmamış) olduğu verilecek.
Amacın:
1. Onun durumunu anladığını belirtmek ve empatik olmak (suçlamadan).
2. İstatistiklerine göre (örneğin: sunum sayısı iyi ama takip yoksa takip yapmasını hatırlatmak; hiç aday yoksa aday listesi yapmayı önermek gibi) nokta atışı pratik saha tavsiyesi vermek.
3. Onu birebir bir kahve görüşmesine veya yardımlaşma aramasına davet etmek.
Kısa, samimi, 2-3 emoji içeren ve WhatsApp'tan gönderilmeye uygun Türkçe bir koçluk mesajı yaz. Başka açıklama ekleme.`
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Distribütör Adı: ${memberName}
Toplam Aday: ${candidateCount}
Dağılım: ${yeniCount} Yeni, ${sunumCount} Sunum, ${takipCount} Takip, ${katildiCount} Katıldı
İnaktif Gün: ${daysInactive} gündür sisteme veri girişi yapılmadı.`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      }
    })

    const message = result.response.text().trim()

    if (!message) throw new Error('Boş yanıt döndü.')

    if (membership) {
      try {
        await supabase.from('nmm_daily_actions').insert({
          workspace_id: membership.workspace_id,
          user_id: user.id,
          candidate_id: null,
          action_type: 'ai_generate' as const,
          note: 'message',
        })
      } catch (dbErr) {
        console.error('Failed to insert coaching daily action log (constraint issues):', dbErr)
      }
    }

    return { message }
  } catch (err: any) {
    console.error('Coaching message error', err)
    return { error: 'Koçluk mesajı oluşturulamadı: ' + (err?.message || String(err)) }
  }
}

export async function generateNotesSummary(notes: string[]): Promise<{ summary?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

  if (!notes || notes.length === 0) return { error: 'Not bulunamadı.' }
  
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: `Sen bir network marketing mentörüsün. Sana sunulan lider notlarını cerrah titizliğiyle analiz edeceksin.
Bu notlardan yola çıkarak adayın genel durumunu anlatan 1 cümlelik çok net bir özet ve hemen atılması gereken 1 cümlelik aksiyon planı üreteceksin.
Ürettiğin yanıtı hem Türkçe hem İngilizce olarak hazırlayacak ve tam olarak şu formatta döneceksin:
[Türkçe Özet + Aksiyon Planı] ||| [English Summary + Action Plan]

Örnek Yanıt formatı:
Aday ürünlere çok ilgili ancak bütçe kısıtı var. Takip planı yapıldı. Ürün paketlerinin detaylarını ve ödeme kolaylıklarını içeren kısa bir WhatsApp mesajı atın. ||| The candidate is very interested in products but has budget constraints. Follow-up plan completed. Send a short WhatsApp message explaining product package details and flexible payment terms.

Yalnızca bu formatta yanıt dön, başka açıklama, giriş veya sonuç ekleme.`
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Lider Notları:\n${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.3,
      }
    })

    const summary = result.response.text().trim()

    return { summary }
  } catch (err: any) {
    console.error('Notes summary generation error', err)
    return { error: 'Özet oluşturulurken bir hata meydana geldi.' }
  }
}

