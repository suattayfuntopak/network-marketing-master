'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { REGISTER_URL } from '@/lib/domain/constants'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { mergeDailyActionNoteUpdate } from '@/lib/domain/dailyActionNote'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { clampAIUserInput, trimAggregateContext } from '@/lib/domain/aiInputLimit'
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

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message }

  // Ownership check: candidate must belong to caller's workspace
  if (candidateId && !quota.isSuperAdmin && quota.workspaceId) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('nmm_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('id', candidateId)
      .eq('workspace_id', quota.workspaceId)
      .eq('owner_id', quota.user.id)
    if ((count ?? 0) === 0) return { error: 'Erişim reddedildi.' }
  }

  try {
    const message = await generateMessage({ name, stage, note, messageType })

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      aiModel: GEMINI_FLASH,
    })

    return { message }
  } catch (err: unknown) {
    return { error: 'Mesaj oluşturulamadı: ' + (err instanceof Error ? err.message : String(err)) }
  }
}

/**
 * Saha tanıdığı bir kişiye (aday) özel NMM'e KATILIM daveti metni üretir.
 * Kişinin adı/notu dikkate alınır; sonuna davet linki + kodu eklenir.
 * Ekibim'deki "Saha Ortağı" robot butonundan, kişinin kendi sayfasında açılır.
 */
export async function generateNmmInviteMessage(candidateId: string): Promise<CoachState> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve sunucuyu yeniden başlatın.' }
  }
  if (!candidateId) return { error: 'Kişi bilgisi eksik.' }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message }

  const supabase = await createClient()
  const { data: cand } = await supabase
    .from('nmm_candidates')
    .select('full_name, note_tr, note, workspace_id')
    .eq('id', candidateId)
    .maybeSingle()
  if (!cand) return { error: 'Kişi bulunamadı.' }
  if (!quota.isSuperAdmin && cand.workspace_id !== quota.workspaceId) {
    return { error: 'Erişim reddedildi.' }
  }

  const { data: wsRow } = await supabase
    .from('nmm_workspaces')
    .select('invite_code')
    .eq('id', cand.workspace_id)
    .maybeSingle()
  const inviteCode = wsRow?.invite_code ?? ''
  const name = cand.full_name ?? ''
  const note = (cand.note_tr ?? cand.note ?? '').slice(0, 500)
  const linkBlock = `\n\nKayıt linki: ${REGISTER_URL}\nEkibim sayfasından gireceğin kod: ${inviteCode}`

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH,
      systemInstruction: `Sen deneyimli, sıcak bir network marketing liderisin. Saha tanıdığın bir kişiyi benimle Network Marketing Master (NMM) kullanmaya davet eden, kişiye özel bir WhatsApp mesajı yazıyorsun.
Kurallar:
1. Kişinin adıyla seslen; varsa notundaki bağlamı doğal şekilde kullan (zorlama yok).
2. Baskıcı/suçlayıcı olma; merak ve güven duygusu uyandır.
3. Vurgu: Sadece uygulamaya kayıt değil — senin sponsorluğun altında, aynı sistemle saha disiplinini birlikte kurmak. Gerçek hayatta zaten ekibinde olabilir ama NMM'de sana bağlı değildir; bunu nazikçe ima et.
4. NMM'in pratik faydasını 1 cümlede belirt (aday takibi, YZ koçu, saha provası).
5. Mesajın SONUNA sana verilen davet linkini ve kodu AYNEN, değiştirmeden ekle.
6. 2-3 emoji, kısa (en fazla ~90 kelime), akıcı Türkçe. SADECE mesaj metnini döndür.`
    })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Kişi adı: ${name}\nNot/bağlam: ${note || '(yok)'}\nMesajın sonuna olduğu gibi eklenecek davet bloğu:${linkBlock}` }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.8 },
    })
    let message = result.response.text().trim()
    if (!message) throw new Error('Boş yanıt döndü.')
    if (inviteCode && !message.includes(inviteCode)) message += linkBlock

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      aiModel: GEMINI_FLASH,
    })
    return { message }
  } catch (err: unknown) {
    console.error('NMM invite message error', err)
    return { error: 'Davet mesajı oluşturulamadı: ' + (err instanceof Error ? err.message : String(err)) }
  }
}

export async function generateNotesSummary(notes: string[]): Promise<{ summary?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

  if (!notes || notes.length === 0) return { error: 'Not bulunamadı.' }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH,
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
              text: `Lider Notları:\n${trimAggregateContext(
                notes.map((n, i) => `${i + 1}. ${clampAIUserInput(n)}`).join('\n'),
              )}`
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

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      aiModel: GEMINI_FLASH,
    })

    return { summary }
  } catch (err: unknown) {
    console.error('Notes summary generation error', err)
    return { error: 'Özet oluşturulurken bir hata meydana geldi.' }
  }
}

/**
 * TR notu kalıcı EN çeviriye dönüştürür (CLAUDE.md: `TR ||| EN` saklama kuralı).
 * Kota sayılmaz — kullanıcı tetiklemeli YZ üretimi değil, çeviri persist katmanı.
 * Oturum zorunlu; hata/boşta girdi aynen döner.
 */
export async function translateNoteAction(text: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return text
  if (!text?.trim()) return text ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH,
      systemInstruction:
        'Translate the following Turkish text to natural English. Return ONLY the translated text, no explanations or quotation marks.',
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
    })

    return result.response.text().trim() || text
  } catch {
    return text
  }
}

/** EN → TR kalıcı çeviri (moderasyon red gerekçesi vb.). */
export async function translateEnToTrAction(text: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return text
  if (!text?.trim()) return text ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH,
      systemInstruction:
        'Translate the following English text to natural Turkish. Return ONLY the translated text, no explanations or quotation marks.',
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
    })

    return result.response.text().trim() || text
  } catch {
    return text
  }
}

/**
 * Lider notunun otomatik EN çevirisini kalıcı saklar — istemci tarafı doğrudan DB
 * yazımı yerine (AGENTS: mutasyonlar server action ile). Oturum zorunlu; RLS owner
 * kontrolü uygular. Davranış eskiyle aynı: mevcut not alanları + noteEn birleştirilir.
 */
export async function persistLeaderNoteTranslationAction(
  actionId: string,
  noteEn: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data: action } = await supabase
    .from('nmm_daily_actions')
    .select('*')
    .eq('id', actionId)
    .single()
  if (!action) return

  await supabase
    .from('nmm_daily_actions')
    .update(mergeDailyActionNoteUpdate(action, { noteEn }))
    .eq('id', actionId)
}

