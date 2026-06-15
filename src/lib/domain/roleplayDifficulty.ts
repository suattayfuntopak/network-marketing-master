/** Saha Provası zorluk seviyesi — AI aday personasının sertliğini belirler (SAF). */

export type RoleplayDifficulty = 'kolay' | 'orta' | 'zor'

export function parseRoleplayDifficulty(v: string | null | undefined): RoleplayDifficulty {
  return v === 'kolay' || v === 'zor' ? v : 'orta'
}

const INSTRUCTION: Record<RoleplayDifficulty, { tr: string; en: string }> = {
  kolay: {
    tr: 'ZORLUK: KOLAY — Aday sıcakkanlı ve sohbete açık; hafif itiraz eder ama ikna edilmeye yatkındır. Distribütör makul bir yaklaşım gösterdiğinde olumlu ilerle.',
    en: 'DIFFICULTY: EASY — The prospect is warm and open; raises only mild objections and is easy to win over. Progress positively when the distributor is reasonable.',
  },
  orta: {
    tr: 'ZORLUK: ORTA — Aday gerçekçi ve dengeli; doğal itirazlar üretir ve ikna için tutarlı bir yaklaşım bekler.',
    en: 'DIFFICULTY: MEDIUM — The prospect is realistic and balanced; raises natural objections and expects a coherent approach.',
  },
  zor: {
    tr: 'ZORLUK: ZOR — Aday çok şüpheci ve mesafeli; sert ve üst üste itirazlar üretir, kolay ikna olmaz. Distribütörü gerçekten zorla, yüzeysel yanıtları kabul etme ve puanlamada daha katı ol.',
    en: 'DIFFICULTY: HARD — The prospect is highly skeptical and guarded; raises tough, repeated objections and is hard to convince. Genuinely challenge the distributor, do not accept superficial replies, and score more strictly.',
  },
}

export function roleplayDifficultyInstruction(d: RoleplayDifficulty, lang: 'tr' | 'en'): string {
  return INSTRUCTION[d][lang]
}
