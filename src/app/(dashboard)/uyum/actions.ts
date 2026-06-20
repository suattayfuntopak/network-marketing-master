'use server'

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { checkAIQuota, logAIGenerationFromQuota, quotaErrorCode, type AiQuotaErrorCode } from '@/lib/ai/checkQuota'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { serverError } from '@/lib/utils/serverError'
import { clampAIUserInput, rejectIfAIInputTooLong } from '@/lib/domain/aiInputLimit'

function toLang(lang: string): 'tr' | 'en' {
  return lang === 'en' ? 'en' : 'tr'
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface ComplianceAuditState {
  score?: number
  safety_level?: 'safe' | 'warning' | 'danger'
  violations?: { phrase: string; category: string; reason: string }[]
  improved_text?: string
  remaining?: number
  error?: string
  quotaError?: AiQuotaErrorCode
}

export async function auditComplianceMessageAction(
  textToAudit: string,
  lang: string
): Promise<ComplianceAuditState> {
  const l = toLang(lang)
  if (!process.env.GEMINI_API_KEY) {
    return { error: serverError('geminiMissing', l) }
  }

  if (!textToAudit.trim()) {
    return { error: serverError('auditInputRequired', l) }
  }
  const lengthErr = rejectIfAIInputTooLong(textToAudit, l)
  if (lengthErr) return { error: lengthErr }

  const safeText = clampAIUserInput(textToAudit)

  const quota = await checkAIQuota('compliance', { lang: l })
  if (!quota.ok) return { error: quota.message, remaining: 0, quotaError: quotaErrorCode(quota.reason) }

  const systemPrompt = `Sen bir Network Marketing ve Doğrudan Satış yasal mevzuat uyum denetleyicisisin (Compliance Officer).
Görevin, kullanıcının girdiği pazarlama metnini, reklam ve tüketici koruma kanunlarına (FTC standartları, TKHK ve yasal mevzuatlar) göre analiz etmek.

ÖZELLİKLE AŞAĞIDAKİ İHLALLERİ DENETLE:
1. Sağlık / Tıbbi İddialar (Örn: "kanser iyileştirir", "diyabeti önler", "migrene son", "ilacımı bıraktım bunu kullandım"). Tıbbi iddialar kesinlikle yasaktır, ürünler sadece gıda takviyesi/kozmetik olarak tanıtılabilir.
2. Gelir Garantileri ve Pasif Gelir Vaatleri (Örn: "garantili aylık 50bin kazanç", "uyurken para kazan", "yarı zamanlı çalış tam maaş al", "bu iş beni zengin etti"). Kesin rakam veya garantili kazanç vaadi yasaktır.
3. Agresif veya Yanıltıcı İletişim (Örn: banka dekontu paylaşımı, spam benzeri taciz edici recruitment metinleri, yanlış "öncesi/sonrası" iddiaları).

ÇIKTI FORMATI VE DİL KURALI:
- Eğer dil (language) 'en' ise tüm ihlaller, açıklamalar, kategoriler ve improved_text tamamen İNGİLİZCE olmalıdır.
- Eğer dil 'tr' ise tüm içerik tamamen TÜRKÇE olmalıdır.
- Kesinlikle sadece geçerli bir JSON objesi döndür.

JSON ŞABLONU (Bu yapıyı tam olarak takip et, asla yorum satırı veya açıklama ekleme):
{
  "score": 85,
  "safety_level": "safe",
  "violations": [
    {
      "phrase": "riskli veya yasaklı kelime öbeği",
      "category": "Sağlık İddiası",
      "reason": "Neden riskli olduğuna dair yasal ve kısa açıklama"
    }
  ],
  "improved_text": "Kullanıcının girdiği metnin yasalara 100% uyumlu hale getirilmiş, onaylı ifadeler içeren, hem yasal hem de çekici ve etkili olan düzeltilmiş versiyonu."
}

Not: Eğer hiç ihlal yoksa score 100 olmalı, safety_level "safe" olmalı and violations dizisi boş kalmalıdır ( [] ).
safety_level değeri: score >= 90 ise "safe", score 65-89 arası ise "warning", score < 65 ise "danger" olmalıdır.
category değeri yalnızca şunlardan biri olabilir: "Sağlık İddiası", "Gelir İddiası", "Yanıltıcı/Agresif Tanıtım" (veya İngilizce dilinde karşılığı).`

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
              text: `Denetlenecek Metin:\n"${safeText}"\n\nDil Parametresi: ${lang === 'en' ? 'en' : 'tr'}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: {
              type: SchemaType.INTEGER,
              description: "Metnin mevzuata uyumluluk puanı (0-100)."
            },
            safety_level: {
              type: SchemaType.STRING,
              description: "Metnin güvenli olup olmadığını belirten seviye: 'safe', 'warning' veya 'danger'."
            },
            violations: {
              type: SchemaType.ARRAY,
              description: "Tespit edilen yasal mevzuat ihlalleri listesi.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  phrase: {
                    type: SchemaType.STRING,
                    description: "Metinde geçen riskli veya yasaklı kelime/cümle öbeği."
                  },
                  category: {
                    type: SchemaType.STRING,
                    description: "İhlal kategorisi: 'Sağlık İddiası', 'Gelir İddiası' veya 'Yanıltıcı/Agresif Tanıtım'."
                  },
                  reason: {
                    type: SchemaType.STRING,
                    description: "Bu ifadenin neden riskli olduğuna dair yasal ve kısa açıklama."
                  }
                },
                required: ["phrase", "category", "reason"]
              }
            },
            improved_text: {
              type: SchemaType.STRING,
              description: "Kullanıcının girdiği metnin yasalara %100 uyumlu hale getirilmiş, onaylı ifadeler içeren düzeltilmiş versiyonu."
            }
          },
          required: ["score", "safety_level", "violations", "improved_text"]
        }
      }
    })

    const text = result.response.text().trim()
    const parsed = JSON.parse(text)

    await logAIGenerationFromQuota(quota, { note: 'compliance', aiModel: GEMINI_FLASH })

    return {
      score: parsed.score,
      safety_level: parsed.safety_level,
      violations: parsed.violations,
      improved_text: parsed.improved_text,
      remaining: quota.isSuperAdmin ? undefined : quota.remaining
    }
  } catch (err: unknown) {
    console.error('Uyum Denetimi Hatası:', err)
    return {
      error: serverError('auditFailed', l, { detail: (err instanceof Error ? err.message : String(err)) }),
    }
  }
}
