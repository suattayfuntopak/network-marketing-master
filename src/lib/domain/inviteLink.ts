import { REGISTER_URL } from '@/lib/domain/constants'

/** Kayıt sayfası kökü — kısa davet yolu `/d/{ref}/{token}` için. */
export const REGISTER_ORIGIN = REGISTER_URL.replace(/\/kayit\/?$/i, '')

/**
 * Aday UUID'sinden 8 karakterlik kısa token (workspace içi çözümleme).
 * Örn. `00fa3484-97b1-4683-b987-638df261b6e2` → `00fa3484`
 */
export function inviteShortToken(candidateId: string): string {
  return candidateId.replace(/-/g, '').slice(0, 8).toLowerCase()
}

/**
 * Sponsor davet linkini TEK kaynaktan üretir.
 * - Kod + aday: kısa yol `${REGISTER_ORIGIN}/d/KOD/token` (WhatsApp dostu).
 * - Yalnız kod: `${REGISTER_URL}?ref=KOD`
 */
export function buildInviteLink(
  inviteCode: string | null | undefined,
  candidateId?: string | null,
): string {
  const code = (inviteCode ?? '').trim()
  if (!code) return REGISTER_URL
  const upper = code.toUpperCase()
  const id = (candidateId ?? '').trim()
  if (id) {
    return `${REGISTER_ORIGIN}/d/${encodeURIComponent(upper)}/${inviteShortToken(id)}`
  }
  return `${REGISTER_URL}?${new URLSearchParams({ ref: upper }).toString()}`
}
