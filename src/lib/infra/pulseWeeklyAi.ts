import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import {
  parseDailyMetrics,
  sumDailyMetrics,
  type PulseDailyMetrics,
} from '@/lib/domain/pulseRollup'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type PulseWeeklyAiResult = {
  summary_tr: string
  summary_en: string
  bullets_tr: string[]
  bullets_en: string[]
  risk_flags: string[]
}

export async function generatePulseWeeklyInsight(input: {
  scope: 'personal' | 'team'
  leaderName?: string
  weekStart: string
  weekTotals: PulseDailyMetrics
  contextJson: string
}): Promise<PulseWeeklyAiResult | null> {
  if (!process.env.GEMINI_API_KEY) return null

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a Network Marketing leadership coach. Produce a concise weekly pulse summary from aggregated metrics only (no invented names or private notes).
Output valid JSON only. Turkish and English must both be natural and professional.
risk_flags: use only these keys when applicable: inactive, low_training, objections_gap, low_field, video_dropoff, team_inactive.
Keep summary under 120 words per language; bullets max 4 items each.`,
  })

  const scopeLabel =
    input.scope === 'team'
      ? `Team pulse for leader ${input.leaderName ?? 'sponsor'}`
      : 'Personal development pulse'

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${scopeLabel}\nWeek starting: ${input.weekStart}\nWeek totals: ${JSON.stringify(input.weekTotals)}\nDetailed context:\n${input.contextJson}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary_tr: { type: SchemaType.STRING },
            summary_en: { type: SchemaType.STRING },
            bullets_tr: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            bullets_en: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            risk_flags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ['summary_tr', 'summary_en', 'bullets_tr', 'bullets_en', 'risk_flags'],
        },
      },
    })

    const raw = result.response.text()?.trim()
    if (!raw) return null
    const parsed = JSON.parse(raw) as PulseWeeklyAiResult
    return {
      summary_tr: parsed.summary_tr?.trim() ?? '',
      summary_en: parsed.summary_en?.trim() ?? '',
      bullets_tr: Array.isArray(parsed.bullets_tr) ? parsed.bullets_tr : [],
      bullets_en: Array.isArray(parsed.bullets_en) ? parsed.bullets_en : [],
      risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    }
  } catch (err) {
    console.error('[pulseWeeklyAi]', err)
    return null
  }
}

export function aggregateRollupRows(
  rows: { day: string; metrics: unknown }[]
): PulseDailyMetrics {
  return sumDailyMetrics(rows.map(r => parseDailyMetrics(r.metrics)))
}
