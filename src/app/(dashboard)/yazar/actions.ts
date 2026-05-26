'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { DAILY_MESSAGE_LIMIT, DAILY_ROLEPLAY_LIMIT } from '@/lib/aiUsage'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
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
JSON yapısı şu şekilde olmalıdır:
{
  "candidate_reply": "Adayın distribütöre vereceği cevap...",
  "yzk_score": 85,
  "yzk_strengths": ["Güçlü yön 1", "Güçlü yön 2"],
  "yzk_improvements": "Motivasyonel tavsiye..."
}
`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Konuşma Geçmişi:\n${promptHistory}\n\nDistribütörün Son Yanıtı: ${userReply}\n\nDil Parametresi: ${lang === 'en' ? 'en' : 'tr'}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            candidate_reply: {
              type: SchemaType.STRING,
              description: "Adayın distribütöre vereceği cevap."
            },
            yzk_score: {
              type: SchemaType.INTEGER,
              description: "Distribütörün son cevabına verilen koçluk puanı (0-100)."
            },
            yzk_strengths: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Distribütörün cevabındaki en fazla 2 güçlü yön."
            },
            yzk_improvements: {
              type: SchemaType.STRING,
              description: "Bir sonraki sefere daha iyi yapması için motivasyonel tavsiye."
            }
          },
          required: ["candidate_reply", "yzk_score", "yzk_strengths", "yzk_improvements"]
        }
      }
    })

    const text = result.response.text().trim()
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

export interface KoclukFormState {
  answer?: string
  error?: string
  remaining?: number
}

export async function askCoachAction(
  _prev: KoclukFormState,
  formData: FormData
): Promise<KoclukFormState> {
  const question = (formData.get('question') as string | null)?.trim() ?? ''
  const lang     = (formData.get('lang')     as string | null)?.trim() ?? 'tr'

  if (!question) return { error: 'Lütfen bir soru yazın.' }

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
      return { error: `Günlük ${DAILY_MESSAGE_LIMIT} limitinize ulaştınız. Yarın tekrar deneyin.`, remaining: 0 }
    }
    remaining = DAILY_MESSAGE_LIMIT - used - 1
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const systemPrompt = `Sen bir Network Marketing Uzmanı ve Lider Gelişim Koçusun (Yapay Zeka Koçu).
Kullanıcı sana network marketing sektörü, aday ilişkileri, takım kurma, sponsorluk, liderlik, satış teknikleri, zaman yönetimi veya bu sektörle doğrudan ilgili herhangi bir konuda soru soruyor.

GÖREVİN:
1. Kullanıcıya son derece profesyonel, yapıcı, ilham verici ve eyleme dökülebilir tavsiyeler ver. Cevapların kısa, net ve anlaşılır olsun.
2. GÜVENLİK FİLTRESİ / KAPSAM DIŞI KURALI:
Kullanıcının sorusu network marketing (ağ pazarlaması), doğrudan satış, liderlik, kişisel gelişim, aday ilişkileri, takım yönetimi vb. ile ilgili DEĞİLSE, nazik, son derece profesyonel ve samimi bir dille bu konunun ilgi alanının dışında olduğunu belirt. Sadece Network Marketing ve ilgili konularla ilgili soruları cevaplayabileceğini söyle. Başka hiçbir genel kültüre, kod yazmaya, ilgisiz akademik konuya vb. cevap verme.

DİL POLİTİKASI:
Eğer dil (language) parametresi 'en' ise cevabını İngilizce, 'tr' ise Türkçe olarak yaz.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Kullanıcı Sorusu: ${question}\n\nDil Parametresi: ${lang}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    })

    const answer = result.response.text().trim()

    if (membership && !isSuperAdmin) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate' as const,
        note: 'message',
      })
    }

    return { answer, remaining: isSuperAdmin ? undefined : remaining }
  } catch (err: any) {
    console.error('Yapay Zeka Koçu Hatası:', err)
    return { error: 'Yanıt oluşturulurken bir hata oluştu.' }
  }
}

export async function translateTextAction(text: string, targetLang: 'tr' | 'en'): Promise<{ translatedText?: string; error?: string }> {
  if (!text) return {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const systemPrompt = `Sen profesyonel bir çevirmensin. Görevin, verilen metni anlamını ve tonunu koruyarak ${
    targetLang === 'en' ? 'İngilizceye' : 'Türkçeye'
  } çevirmektir.
Metnin dışına çıkma. Herhangi bir açıklama, giriş veya sonuç ekleme. Sadece çeviriyi döndür.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.3,
      }
    })

    const translatedText = result.response.text().trim()

    return { translatedText }
  } catch (err) {
    console.error('Translation error:', err)
    return { error: 'Çeviri başarısız oldu.' }
  }
}
