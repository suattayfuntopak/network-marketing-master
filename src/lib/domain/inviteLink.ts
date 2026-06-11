import { REGISTER_URL } from '@/lib/domain/constants'

/**
 * Sponsor davet linkini TEK kaynaktan üretir: `${REGISTER_URL}?ref=KOD[&aday=ID]`.
 * `ref` (workspace invite_code) → kişi linkten kaydolunca davet kodunu ELLE girmeden
 * otomatik bu ekibe bağlanır (ensureWorkspaceAction → nmm_join_workspace) ve boru
 * hattındaki "katıldı" adayıyla eşleşip NMM Ortağı olur. `aday` (candidate id) eşleşmeyi
 * netleştirir. Kod yoksa düz kayıt linki döner. (Eskiden 4+ yerde elle kuruluyordu.)
 */
export function buildInviteLink(
  inviteCode: string | null | undefined,
  candidateId?: string | null,
): string {
  const code = (inviteCode ?? '').trim()
  if (!code) return REGISTER_URL
  const params = new URLSearchParams({ ref: code })
  if (candidateId) params.set('aday', candidateId)
  return `${REGISTER_URL}?${params.toString()}`
}
