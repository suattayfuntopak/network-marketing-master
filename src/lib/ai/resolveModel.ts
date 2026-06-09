import { GEMINI_FLASH, GEMINI_PRO } from '@/lib/ai/models'

export type GeminiModelId = typeof GEMINI_PRO | typeof GEMINI_FLASH

/** Derin koçluk: YZ Koçu, saha provası, Pro ekip onboarding rehberi. */
export type AICoachTier = 'deep_coach' | 'standard'

/**
 * Hibrit model yönlendirme:
 * - Basic / Plus / deneme → her zaman Flash
 * - Pro → yalnızca `deep_coach` tier'da Pro model; veri/mesaj işlemleri Flash
 */
export function resolveGeminiModel(
  tier: AICoachTier,
  effectiveLicense: string,
): GeminiModelId {
  if (tier === 'deep_coach' && effectiveLicense === 'pro') {
    return GEMINI_PRO
  }
  return GEMINI_FLASH
}
