'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { inviteShortToken } from '@/lib/domain/inviteLink'

export type InviteSignupPrefill = {
  fullName: string
  email: string
  ref: string
  aday: string
}

/**
 * Davet linkinden (?ref=KOD&aday=ID) kayıt formu ön-doldurma.
 * Yalnızca kod + aday sponsor workspace'ine aitse döner (RLS bypass — public kayıt akışı).
 */
export async function getInviteSignupPrefillAction(
  ref: string,
  aday: string,
): Promise<InviteSignupPrefill | null> {
  const code = ref.trim().toUpperCase()
  const candidateId = aday.trim()
  if (!code || !candidateId) return null

  const admin = createAdminClient()

  const { data: ws } = await admin
    .from('nmm_workspaces')
    .select('id')
    .eq('invite_code', code)
    .maybeSingle()

  if (!ws?.id) return null

  const { data: cand } = await admin
    .from('nmm_candidates')
    .select('id, full_name, email, workspace_id')
    .eq('id', candidateId)
    .eq('workspace_id', ws.id)
    .maybeSingle()

  if (!cand?.full_name?.trim()) return null

  return {
    fullName: cand.full_name.trim(),
    email: (cand.email ?? '').trim(),
    ref: code,
    aday: candidateId,
  }
}

/**
 * Kısa davet token'ından (`/d/{ref}/{token}`) tam aday id çözümler.
 * Token = UUID'nin ilk 8 hex karakteri; workspace + invite_code ile sınırlı.
 */
export async function resolveInviteCandidateFromShortToken(
  ref: string,
  token: string,
): Promise<string | null> {
  const code = ref.trim().toUpperCase()
  const prefix = token.trim().toLowerCase().replace(/[^a-f0-9]/g, '').slice(0, 8)
  if (!code || prefix.length < 8) return null

  const admin = createAdminClient()

  const { data: ws } = await admin
    .from('nmm_workspaces')
    .select('id')
    .eq('invite_code', code)
    .maybeSingle()

  if (!ws?.id) return null

  const { data: rows } = await admin
    .from('nmm_candidates')
    .select('id')
    .eq('workspace_id', ws.id)
    .ilike('id', `${prefix}%`)

  if (!rows?.length) return null
  if (rows.length === 1) return rows[0].id

  const exact = rows.find(
    r => inviteShortToken(r.id) === prefix,
  )
  return exact?.id ?? rows[0].id
}

/** Kayıt sırasında davet adayının lider kayıtlı adını doğrula. */
export async function resolveInviteSignupName(
  ref: string,
  aday: string,
  submittedName: string,
): Promise<string> {
  const prefill = await getInviteSignupPrefillAction(ref, aday)
  if (prefill?.fullName) return prefill.fullName
  return submittedName.trim()
}
