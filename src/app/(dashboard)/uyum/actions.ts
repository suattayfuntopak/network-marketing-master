'use server'

import { createClient } from '@/lib/supabase/server'
import { DAILY_AI_LIMIT } from '@/lib/aiUsage'
import Anthropic from '@anthropic-ai/sdk'

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'

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
  if (!textToAudit.trim()) {
    return { error: lang === 'en' ? 'Please enter a message to audit.' : 'Lütfen denetlenecek bir metin girin.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: lang === 'en' ? 'Session required.' : 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  let remaining = 20
  if (!isSuperAdmin) {
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
    if (used >= DAILY_AI_LIMIT) {
      return {
        error: lang === 'en'
          ? `You have reached your daily ${DAILY_AI_LIMIT} compliance audit limit. Try again tomorrow.`
          : `Günlük ${DAILY_AI_LIMIT} uyum denetleme limitine ulaştınız. Yarın tekrar deneyin.`,
        remaining: 0
      }
    }
    remaining = DAILY_AI_LIMIT - used - 1
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
- Kesinlikle sadece geçerli bir JSON objesi döndür. Başında veya sonunda hiçbir açıklama, giriş veya sonuç ekleme. JSON içinde asla yorum satırları (//) kullanma.

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

Not: Eğer hiç ihlal yoksa score 100 olmalı, safety_level "safe" olmalı ve violations dizisi boş kalmalıdır ( [] ).
safety_level değeri: score >= 90 ise "safe", score 65-89 arası ise "warning", score < 65 ise "danger" olmalıdır.
category değeri yalnızca şunlardan biri olabilir: "Sağlık İddiası", "Gelir İddiası", "Yanıltıcı/Agresif Tanıtım".
`;

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: [
        {
          type: 'text',
          text: systemPrompt,
        }
      ],
      messages: [
        {
          role: 'user',
          content: `Denetlenecek Metin:\n"${textToAudit}"\n\nDil Parametresi: ${lang === 'en' ? 'en' : 'tr'}`,
        }
      ]
    })

    let text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    // Strip markdown fences and extract clean JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }

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
      remaining
    }
  } catch (err: any) {
    console.error('Uyum Denetimi Hatası:', err)
    return { 
      error: (lang === 'en' ? 'Audit failed: ' : 'Metin denetlenirken hata oluştu: ') + (err?.message || String(err))
    }
  }
}
