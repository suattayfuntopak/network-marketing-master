'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface YazarFormState {
  message?: string
  error?: string
  remaining?: number
}

export async function generateMessageAction(
  _prev: YazarFormState,
  formData: FormData
): Promise<YazarFormState> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const context     = (formData.get('context')     as string | null)?.trim() ?? ''
  const tone        = (formData.get('tone')        as string | null)?.trim() ?? 'samimi'
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'
  const warmth      = (formData.get('warmth')      as string | null)?.trim() ?? 'ilik'

  if (!name) return { error: 'Kişi adı zorunlu.' }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  try {
    const message = await generateMessage({ name, stage, context, tone, messageType, warmth })

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
    })

    return { message, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
  } catch (err: any) {
    return { error: 'Mesaj oluşturulamadı: ' + (err?.message || String(err)) }
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
  if (!process.env.GEMINI_API_KEY) {
    return { error: lang === 'en' ? 'GEMINI_API_KEY is missing! Please add GEMINI_API_KEY=your_key to your .env.local file and restart Next.js server.' : 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

  const quota = await checkAIQuota('roleplay', { lang: lang === 'en' ? 'en' : 'tr' })
  if (!quota.ok) return { error: quota.message, remaining: 0 }

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

  const systemPrompt = `Sen bir Network Marketing simülatörü ve Lider Gelişim Koçusun (Yapay Zeka Koçu).

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
      model: 'gemini-2.5-pro',
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
        maxOutputTokens: 16384,
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

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'roleplay',
    })

    return {
      candidate_reply: parsed.candidate_reply,
      yzk_score: parsed.yzk_score,
      yzk_strengths: parsed.yzk_strengths,
      yzk_improvements: parsed.yzk_improvements,
      remaining: quota.isSuperAdmin ? undefined : quota.remaining
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

  if (!process.env.GEMINI_API_KEY) {
    return { error: lang === 'en' ? 'GEMINI_API_KEY is missing! Please add GEMINI_API_KEY=your_key to your .env.local file and restart Next.js server.' : 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

  if (!question) return { error: 'Lütfen bir soru yazın.' }

  const quota = await checkAIQuota('message', { lang: lang === 'en' ? 'en' : 'tr' })
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  const systemPrompt = `Sen bir Network Marketing Uzmanı ve Lider Gelişim Koçusun (Yapay Zeka Koçu).
Kullanıcı sana network marketing sektörü, aday ilişkileri, takım kurma, sponsorluk, liderlik, satış teknikleri, zaman yönetimi veya bu sektörle doğrudan ilgili herhangi bir konuda soru soruyor.

GÖREVİN:
1. Kullanıcıya son derece profesyonel, yapıcı, ilham verici ve eyleme dökülebilir tavsiyeler ver. Cevapların kısa, net ve anlaşılır olsun.
2. GÜVENLİK FİLTRESİ / KAPSAM DIŞI KURALI:
Kullanıcının sorusu network marketing (ağ pazarlaması), doğrudan satış, liderlik, kişisel gelişim, aday ilişkileri, takım yönetimi vb. ile ilgili DEĞİLSE, nazik, son derece profesyonel ve samimi bir dille bu konunun ilgi alanının dışında olduğunu belirt. Sadece Network Marketing ve ilgili konularla ilgili soruları cevaplayabileceğini söyle. Başka hiçbir genel kültüre, kod yazmaya, ilgisiz akademik konuya vb. cevap verme.

DİL POLİTİKASI:
Elbette dil (language) parametresi 'en' ise cevabını İngilizce, 'tr' ise Türkçe olarak yaz.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
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
        maxOutputTokens: 8192,
        temperature: 0.7,
      }
    })

    const answer = result.response.text().trim()

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
    })

    return { answer, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
  } catch (err: any) {
    console.error('Yapay Zeka Koçu Hatası:', err)
    return { error: 'Yanıt oluşturulurken bir hata oluştu.' }
  }
}

export async function translateTextAction(text: string, targetLang: 'tr' | 'en'): Promise<{ translatedText?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: targetLang === 'en' ? 'GEMINI_API_KEY is missing! Please add GEMINI_API_KEY=your_key to your .env.local file.' : 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin.' }
  }

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
      model: 'gemini-2.5-flash',
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
        maxOutputTokens: 8192,
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
