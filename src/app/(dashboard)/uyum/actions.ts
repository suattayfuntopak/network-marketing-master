'use server'

import { createClient } from '@/lib/supabase/server'
import { getLimitsForLicense } from '@/lib/aiUsage'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface ComplianceAuditState {
  score?: number
  safety_level?: 'safe' | 'warning' | 'danger'
  violations?: { phrase: string; category: string; reason: string }[]
  improved_text?: string
  remaining?: number
  error?: string
}

export async function auditComplianceMessageAction(
  textToAudit: string,
  lang: string
): Promise<ComplianceAuditState> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: lang === 'en' ? 'GEMINI_API_KEY is missing! Please add GEMINI_API_KEY=your_key to your .env.local file and restart Next.js server.' : 'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key değerini ekleyin ve Next.js sunucusunu yeniden başlatın.' }
  }

  if (!textToAudit.trim()) {
    return { error: lang === 'en' ? 'Please enter a message to audit.' : 'Lütfen denetlenecek bir metin girin.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: lang === 'en' ? 'Session required.' : 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let remaining = 0
  if (!isSuperAdmin) {
    const { data: ws } = await supabase
      .from('nmm_workspaces')
      .select('license_type, license_expires_at')
      .eq('id', membership?.workspace_id ?? '')
      .maybeSingle()
    const licenseType = ws?.license_expires_at && new Date(ws.license_expires_at) < new Date() ? 'free' : (ws?.license_type ?? 'free')
    const { complianceLimit } = getLimitsForLicense(licenseType)

    if (complianceLimit === 0) {
      return {
        error: lang === 'en'
          ? 'Compliance auditing requires a paid plan. Please upgrade to access this feature.'
          : 'Uyum denetimi özelliği ücretli planlarda kullanılabilir. Bu özelliğe erişmek için planınızı yükseltin.',
        remaining: 0
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .eq('note', 'compliance')
      .gte('created_at', today.toISOString())

    const used = count ?? 0
    if (used >= complianceLimit) {
      return {
        error: lang === 'en'
          ? `You have reached your daily ${complianceLimit} compliance audit limit. Try again tomorrow.`
          : `Günlük ${complianceLimit} uyum denetleme limitine ulaştınız. Yarın tekrar deneyin.`,
        remaining: 0
      }
    }
    remaining = complianceLimit - used - 1
  }

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
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Denetlenecek Metin:\n"${textToAudit}"\n\nDil Parametresi: ${lang === 'en' ? 'en' : 'tr'}`
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

    if (membership && !isSuperAdmin) {
      try {
        await supabase.from('nmm_daily_actions').insert({
          workspace_id: membership.workspace_id,
          user_id: user.id,
          candidate_id: null,
          action_type: 'ai_generate' as const,
          note: 'compliance',
        })
      } catch (dbErr) {
        console.error('Failed to insert compliance daily action log (constraint issues):', dbErr)
      }
    }

    return {
      score: parsed.score,
      safety_level: parsed.safety_level,
      violations: parsed.violations,
      improved_text: parsed.improved_text,
      remaining: isSuperAdmin ? undefined : remaining
    }
  } catch (err: any) {
    console.error('Uyum Denetimi Hatası:', err)
    return { 
      error: (lang === 'en' ? 'Audit failed: ' : 'Metin denetlenirken hata oluştu: ') + (err?.message || String(err))
    }
  }
}
