'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateAchievementMessageAction(input: {
  name: string
  note?: string | null
}): Promise<{ message?: string; error?: string }> {
  if (!input.name) return { error: 'Kişi adı eksik.' }
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `Sen bir Network Marketing lideri ve sponsorusun. Ekibine başarıyla yeni katılmış (onboarding aşamasındaki) bir iş ortağını kutlamak ve desteklemek için samimi, motive edici ve yol gösterici bir Türkçe karşılama ve tebrik mesajı yazıyorsun.
      
Mesajın Amacı:
1. Onun ekibe katılmasını büyük bir coşkuyla tebrik et.
2. Başarı yolundaki ilk adımları ve bundan sonra ne yapması gerektiği hakkında kısa, pratik ve cesaret verici 1-2 tüyo ver (örneğin: ilk eğitimleri incelemesi, ürün deneyimini başlatması veya birlikte ilk planlamayı yapmak gibi).
3. Her türlü soru ve sorununda sponsoru olarak her zaman yanında olduğunu, dilediği an çekinmeden kendisine ulaşabileceğini samimiyetle ifade et.

Ton: Samimi, sıcak, lider duruşlu, güven verici ve heyecanlandırıcı (2-3 emoji içerebilir). Kısa ve net, WhatsApp üzerinden gönderilmeye uygun (max 3 paragraf). Başka açıklama ekleme.`
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Yeni Ekip Üyesi Adı: ${input.name}\nVarsa Notlar: ${input.note ?? ''}` }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      }
    })

    const message = result.response.text().trim()
    return { message }
  } catch (err) {
    console.error(err)
    return { error: 'Mesaj oluşturulamadı.' }
  }
}
