'use server'

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { generateMessage } from '@/lib/ai/generateMessage'
import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { serverError } from '@/lib/utils/serverError'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { resolveGeminiModel } from '@/lib/ai/resolveModel'
import {
  clampAIUserInput,
  rejectIfAIInputTooLong,
  trimAggregateContext,
} from '@/lib/domain/aiInputLimit'
import { buildObjectionKnowledgeBase } from '@/app/(dashboard)/itirazlar/data/itirazlar'
import { generateLocalFallbackMessage, generateLocalCoachAnswer } from '@/lib/domain/aiFallback'
import { parseRoleplayDifficulty, roleplayDifficultyInstruction } from '@/lib/domain/roleplayDifficulty'
import { buildSocialContentUserPrompt, parseSocialGoal, parseSocialPlatform } from '@/lib/domain/socialContent'

function toLang(lang: string): 'tr' | 'en' {
  return lang === 'en' ? 'en' : 'tr'
}

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
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const context     = (formData.get('context')     as string | null)?.trim() ?? ''
  const tone        = (formData.get('tone')        as string | null)?.trim() ?? 'samimi'
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'
  const warmth      = (formData.get('warmth')      as string | null)?.trim() ?? 'ilik'

  if (!name) return { error: 'Kişi adı zorunlu.' }
  const contextErr = rejectIfAIInputTooLong(context)
  if (contextErr) return { error: contextErr }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY eksik, yerel taslak oluşturuluyor.')
    const message = generateLocalFallbackMessage({ name, stage, context, tone, warmth })
    return { message }
  }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  try {
    const message = await generateMessage({
      name,
      stage,
      context: clampAIUserInput(context),
      tone,
      messageType,
      warmth,
    })

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      aiModel: GEMINI_FLASH,
    })

    return { message, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
  } catch (err: unknown) {
    console.error('Gemini API hatası, yerel taslağa geçiliyor:', err)
    const message = generateLocalFallbackMessage({ name, stage, context, tone, warmth })
    return { message, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
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
  lang: string,
  difficulty: string = 'orta'
): Promise<RoleplayResponseState> {
  const l = toLang(lang)
  if (!process.env.GEMINI_API_KEY) {
    return { error: serverError('geminiMissing', l) }
  }

  const replyErr = rejectIfAIInputTooLong(userReply, l)
  if (replyErr) return { error: replyErr }

  const quota = await checkAIQuota('roleplay', { lang: l })
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  const safeReply = clampAIUserInput(userReply)

  // Construct message history string
  const promptHistory = trimAggregateContext(messageHistory.map(m => {
    if (m.role === 'candidate') {
      return `Aday: ${m.text}`
    } else if (m.role === 'user') {
      return `Distribütör: ${m.text}`
    } else {
      return `YZK Notu: Puan: ${m.score}, Güçlü Yönler: ${m.strengths?.join(', ')}, Tavsiye: ${m.improvements}`
    }
  }).join('\n'))

  const coachModel = resolveGeminiModel('deep_coach', quota.licenseType)

  const systemPrompt = `Sen bir Network Marketing simülatörü ve Lider Gelişim Koçusun (Yapay Zeka Koçu).

GÖREVİN:
1. ADAY ROLÜ (SIMÜLASYON): Seçilen senaryoya (${scenarioId}) uygun olarak davran. Distribütörün en son yazdığı yanıta (${safeReply}) karşılık, gerçek bir adaymışsın gibi bir sonraki yanıtını Türkçe olarak yaz. Gerçekçi, hafif itiraz eden, sohbete açık bir duruş sergile. Cevabı JSON'daki "candidate_reply" alanına yerleştir.
2. MENTÖR KOÇ ROLÜ: Distribütörün son yazdığı yanıtı (${safeReply}) network marketing ilkelerine (empati kurma, merak uyandırma, profesyonellik) göre değerlendir:
   - 0 ile 100 arasında bir liderlik puanı belirle ve JSON'daki "yzk_score" alanına yerleştir.
   - En fazla 2 adet çok net ve pozitif güçlü yönünü belirtip JSON'daki "yzk_strengths" dizisine yerleştir.
   - Distribütörün bir sonraki sefere daha iyi yapması için en fazla 1 adet motivasyonel ve eyleme dökülebilir tavsiye yazıp JSON'daki "yzk_improvements" alanına yerleştir.

${roleplayDifficultyInstruction(parseRoleplayDifficulty(difficulty), l)}

DİL POLİTİKASI:
Eğer dil (language) parametresi 'en' ise, tüm JSON içeriğini (candidate_reply, yzk_strengths, yzk_improvements) tamamen İngilizce yaz. Eğer 'tr' ise tamamen Türkçe yaz.

MARKA İTİRAZ BANKASI (KÜRATÖRLÜ):
Aşağıda uygulamamızın onaylı İtiraz Bankası var. ADAY ROLÜNDE gerçekçi ve markamızın senaryolarına uygun itirazlar üretmek için bu bankadan ilham al; MENTÖR KOÇ ROLÜNDE distribütörün yanıtını puanlarken bu bankadaki yaklaşımı (empati → yeniden çerçeveleme → şeffaflık → "karar sende") referans al ve "yzk_improvements" tavsiyeni mümkünse ilgili itirazın yaklaşımına/örnek diyaloğuna dayandır.
${buildObjectionKnowledgeBase(l)}

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
      model: coachModel,
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Konuşma Geçmişi:\n${promptHistory}\n\nDistribütörün Son Yanıtı: ${safeReply}\n\nDil Parametresi: ${lang === 'en' ? 'en' : 'tr'}`
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
      aiModel: coachModel,
    })

    return {
      candidate_reply: parsed.candidate_reply,
      yzk_score: parsed.yzk_score,
      yzk_strengths: parsed.yzk_strengths,
      yzk_improvements: parsed.yzk_improvements,
      remaining: quota.isSuperAdmin ? undefined : quota.remaining
    }
  } catch (err: unknown) {
    console.error('YZK Simülasyon Hatası:', err)
    return {
      error: serverError('simulationFailed', l, {
        detail: (err instanceof Error ? err.message : String(err)),
      }),
    }
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

  const l = toLang(lang)
  if (!question) return { error: l === 'en' ? 'Please enter a question.' : 'Lütfen bir soru yazın.' }
  const questionErr = rejectIfAIInputTooLong(question, l)
  if (questionErr) return { error: questionErr }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY eksik, yerel koç yanıtı oluşturuluyor.')
    const answer = generateLocalCoachAnswer(question, l)
    return { answer }
  }

  const quota = await checkAIQuota('message', { lang: l })
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  const safeQuestion = clampAIUserInput(question)
  const coachModel = resolveGeminiModel('deep_coach', quota.licenseType)

  const systemPrompt = `Sen bir Network Marketing Uzmanı ve Lider Gelişim Koçusun (Yapay Zeka Koçu).
Kullanıcı sana network marketing sektörü, aday ilişkileri, takım kurma, sponsorluk, liderlik, satış teknikleri, zaman yönetimi veya bu sektörle doğrudan ilgili herhangi bir konuda soru soruyor.

GÖREVİN:
1. Kullanıcıya son derece profesyonel, yapıcı, ilham verici ve eyleme dökülebilir tavsiyeler ver. Cevapların kısa, net and anlaşılır olsun.
2. GÜVENLİK FİLTRESİ / KAPSAM DIŞI KURALI:
Kullanıcının sorusu network marketing (ağ pazarlaması), doğrudan satış, liderlik, kişisel gelişim, aday ilişkileri, takım yönetimi vb. ile ilgili DEĞİLSE, nazik, son derece profesyonel ve samimi bir dille bu konunun ilgi alanının dışında olduğunu belirt. Sadece Network Marketing ve ilgili konularla ilgili soruları cevaplayabileceğini söyle. Başka hiçbir genel kültüre, kod yazmaya, ilgisiz akademik konuya vb. cevap verme.

DİL POLİTİKASI:
Elbette dil (language) parametresi 'en' ise cevabını İngilizce, 'tr' ise Türkçe olarak yaz.

MARKA İTİRAZ BANKASI (KÜRATÖRLÜ — ÖNCELİKLİ KAYNAK):
Aşağıda uygulamamızın onaylı İtiraz Bankası var. Kullanıcının sorusu bir saha itirazıyla ilgiliyse (örn. "param yok", "vaktim yok", "piramit mi", "ailem karşı", "satıcı değilim"), cevabını ÖNCELİKLE bu bankadaki yaklaşım ve örnek diyaloglara dayandır; markanın tonunu (empati → yeniden çerçeveleme → şeffaflık/resmi belge → "karar sende", baskısızlık, ürün-önce, etik) birebir koru. Bankada birebir karşılık yoksa AYNI ilkelerle yanıt üret. Asla baskıcı, garanti-vaat eden veya manipülatif dil kullanma.
${buildObjectionKnowledgeBase(l)}`;

  try {
    const model = genAI.getGenerativeModel({
      model: coachModel,
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Kullanıcı Sorusu: ${safeQuestion}\n\nDil Parametresi: ${lang}`
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
      aiModel: coachModel,
    })

    return { answer, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
  } catch (err: unknown) {
    console.error('Yapay Zeka Koçu Hatası, yerel koç yanıtına geçiliyor:', err)
    const answer = generateLocalCoachAnswer(question, l)
    return { answer, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
  }
}

export interface SocialContentState {
  content?: string
  error?: string
  remaining?: number
}

export async function generateSocialContentAction(input: {
  goal: string
  platform: string
  tone: string
  topic: string
  lang: string
}): Promise<SocialContentState> {
  const l = toLang(input.lang)

  const topicErr = rejectIfAIInputTooLong(input.topic ?? '', l)
  if (topicErr) return { error: topicErr }

  if (!process.env.GEMINI_API_KEY) {
    return { error: l === 'en' ? 'AI is unavailable right now.' : 'Yapay zeka şu an kullanılamıyor.' }
  }

  const quota = await checkAIQuota('message', { lang: l })
  if (!quota.ok) return { error: quota.message, remaining: 0 }

  const userPrompt = buildSocialContentUserPrompt({
    goal: parseSocialGoal(input.goal),
    platform: parseSocialPlatform(input.platform),
    tone: input.tone,
    topic: clampAIUserInput(input.topic ?? ''),
    lang: l,
  })

  const contentModel = resolveGeminiModel('deep_coach', quota.licenseType)

  const systemPrompt = `Sen bir Network Marketing sosyal medya içerik uzmanısın. Distribütörün sosyal hesaplarında paylaşacağı, spam'siz, özgün ve etkili içerikler üretirsin.

GÖREVİN: Verilen platform, amaç, ton ve konuya göre 3 FARKLI içerik varyantı yaz. Her varyant:
- Platforma uygun uzunluk ve biçimde olsun (Instagram: akıcı caption + 3-5 ilgili hashtag; WhatsApp Durumu: çok kısa, emojili; Facebook: biraz daha uzun, sohbet başlatan).
- Doğal, samimi ve değer veren bir dille yazılsın; satış baskısı ve klişe olmasın.
- Yumuşak bir eylem çağrısı (CTA) içersin (DM at, yorum yaz gibi) — agresif olmasın.

UYUM / ETİK (ZORUNLU): Sağlık iddiası (hastalık iyileştirme vb.) ve gelir garantisi/abartısı YAPMA. "Kesin kazanç", "garanti sonuç", "mucize" gibi ifadeler kullanma; yasal ve dürüst kal.

ÇIKTI BİÇİMİ: Varyantları "1)", "2)", "3)" diye numaralandır, aralarına boş satır koy. Başka açıklama ekleme.

DİL POLİTİKASI: language 'en' ise tamamen İngilizce, 'tr' ise tamamen Türkçe yaz.`

  try {
    const model = genAI.getGenerativeModel({ model: contentModel, systemInstruction: systemPrompt })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${userPrompt}\n\nlanguage: ${l}` }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.85 },
    })
    const content = result.response.text().trim()
    if (!content) {
      return { error: l === 'en' ? 'Empty response, please try again.' : 'Boş yanıt geldi, tekrar dener misin?' }
    }

    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      aiModel: contentModel,
    })

    return { content, remaining: quota.isSuperAdmin ? undefined : quota.remaining }
  } catch (err) {
    console.error('generateSocialContentAction error:', err)
    return { error: l === 'en' ? 'Something went wrong. Please try again.' : 'Bir şeyler ters gitti. Tekrar dener misin?' }
  }
}

export async function translateTextAction(text: string, targetLang: 'tr' | 'en'): Promise<{ translatedText?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: targetLang === 'en' ? 'GEMINI_API_KEY is missing! Please add GEMINI_API_KEY=your_key to your .env.local file.' : 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin.' }
  }

  if (!text) return {}
  const textErr = rejectIfAIInputTooLong(text, targetLang)
  if (textErr) return { error: textErr }

  const quota = await checkAIQuota('message', { lang: targetLang })
  if (!quota.ok) {
    return { error: quota.message }
  }

  const systemPrompt = `Sen profesyonel bir çevirmensin. Görevin, verilen metni anlamını ve tonunu koruyarak ${
    targetLang === 'en' ? 'İngilizceye' : 'Türkçeye'
  } çevirmektir.
Metnin dışına çıkma. Herhangi bir açıklama, giriş veya sonuç ekleme. Sadece çeviriyi döndür.`;

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH,
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: clampAIUserInput(text)
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

export type CandidateRecentAction = {
  action_type: string
  note: string | null
  note_tr: string | null
  note_en: string | null
  created_at: string
}

/** YazarForm bağlam doldurma: adayın son 10 aktivitesi (RLS workspace ile sınırlar). */
export async function getCandidateRecentActionsAction(
  candidateId: string,
): Promise<CandidateRecentAction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nmm_daily_actions')
    .select('action_type, note, note_tr, note_en, created_at')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return data ?? []
}
