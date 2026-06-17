'use server'

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { requireAuthUserId } from '@/lib/supabase/requireAuth'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type ObjectionFields = {
  kategori: string
  soru: string
  kisaCevap: string
  detayliCevap: string
  yaklasim: string
  ornekDiyalog: string
}

/**
 * CLAUDE.md Dil Politikası: dinamik içerik (custom itirazlar) DB'ye yazılmadan ÖNCE
 * kalıcı çevirisi üretilmeli ve hem TR hem EN saklanmalı — İngilizce istemcide
 * gecikmeli/on-the-fly çeviri yerine kalıcı çeviri gösterilir. Bu action, kullanıcının
 * girdiği dildeki alanları KARŞI dile çevirir (tek Gemini çağrısı, JSON şema). Çeviri
 * altyapısaldır; AI kotasına yazılmaz. Hata/anahtar yoksa kaynak metni döndürür (asla
 * boş bırakmaz) — kayıt akışı çeviri yüzünden bloklanmaz.
 */
export async function translateObjectionFieldsAction(
  fields: ObjectionFields,
  sourceLang: 'tr' | 'en',
): Promise<ObjectionFields> {
  await requireAuthUserId()

  const targetLang = sourceLang === 'en' ? 'tr' : 'en'
  const targetName = targetLang === 'en' ? 'English' : 'Turkish'

  // Çevrilecek bir şey yoksa veya anahtar eksikse aynen döndür (güvenli yedek).
  const hasContent = Object.values(fields).some(v => v.trim().length > 0)
  if (!process.env.GEMINI_API_KEY || !hasContent) return { ...fields }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_FLASH,
      systemInstruction: `You translate network-marketing objection-handling content into ${targetName}.
Rules: keep the warm, non-pushy, ethical, "the decision is yours" brand tone. Preserve line breaks and dialogue markers (e.g. "A:" / "B:"). Translate naturally, not literally. Do NOT add or remove meaning. If a field is empty, return it empty. Return ONLY the JSON object.`,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Translate these fields into ${targetName}:\n${JSON.stringify(fields)}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            kategori: { type: SchemaType.STRING },
            soru: { type: SchemaType.STRING },
            kisaCevap: { type: SchemaType.STRING },
            detayliCevap: { type: SchemaType.STRING },
            yaklasim: { type: SchemaType.STRING },
            ornekDiyalog: { type: SchemaType.STRING },
          },
          required: ['kategori', 'soru', 'kisaCevap', 'detayliCevap', 'yaklasim', 'ornekDiyalog'],
        },
      },
    })

    const parsed = JSON.parse(result.response.text().trim()) as Partial<ObjectionFields>
    // Boş gelen alanlarda kaynağa düş (asla içeriği kaybetme).
    return {
      kategori: parsed.kategori?.trim() || fields.kategori,
      soru: parsed.soru?.trim() || fields.soru,
      kisaCevap: parsed.kisaCevap ?? fields.kisaCevap,
      detayliCevap: parsed.detayliCevap ?? fields.detayliCevap,
      yaklasim: parsed.yaklasim ?? fields.yaklasim,
      ornekDiyalog: parsed.ornekDiyalog ?? fields.ornekDiyalog,
    }
  } catch (err) {
    console.error('[translateObjectionFieldsAction]', err)
    return { ...fields }
  }
}
