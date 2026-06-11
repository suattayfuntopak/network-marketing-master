'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
