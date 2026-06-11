import { PARTNER_AVATAR_OVERRIDE_URLS } from '@/lib/team/partnerAvatarOverrides'

export {
  SELDA_KIRATLI_USER_ID,
  EZGI_SAGAR_USER_ID,
  SELDA_CANDIDATE_ID,
  EZGI_CANDIDATE_ID,
  SELDA_DISPLAY_AVATAR_URL,
  EZGI_DISPLAY_AVATAR_URL,
} from '@/lib/team/partnerAvatarOverrides'

/** user_id veya candidate id için doğru profil fotoğrafı URL'si. */
export function canonicalPartnerAvatarUrl(
  entityId: string,
  fallback?: string | null,
): string | null {
  const override = PARTNER_AVATAR_OVERRIDE_URLS[entityId]
  if (override) return override
  const trimmed = fallback?.trim()
  return trimmed || null
}
