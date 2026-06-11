'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { buildAvatarStoragePath } from '@/lib/utils/avatarStoragePath'

const AVATAR_BUCKET = 'nmm-avatars'
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export type ProfileInfo = {
  userId: string
  email: string
  avatarUrl: string | null
  fullName: string
}

export async function getProfileAction(): Promise<ProfileInfo> {
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const supabase = await createClient()
  const { data: member } = await supabase
    .from('nmm_workspace_members')
    .select('full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    userId: user.id,
    email: user.email ?? '',
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    fullName: member?.full_name ?? '',
  }
}

/**
 * Avatar/aday fotoğrafı yükler (nmm-avatars bucket).
 * FormData: `file` (zorunlu) + `scope` ('user' | 'candidate') + `candidateId`.
 * Not: server action body limiti next.config'te 3mb'ye yükseltildi (UI 2MB sınırı + FormData payı).
 */
export async function uploadAvatarAction(formData: FormData): Promise<{ publicUrl: string }> {
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const file = formData.get('file')
  if (!(file instanceof File)) throw new Error('Dosya bulunamadı.')
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Fotoğraf 2MB'den büyük olamaz.")
  if (!file.type.startsWith('image/')) throw new Error('Lütfen geçerli bir resim dosyası seçin.')

  const isCandidateScope = formData.get('scope') === 'candidate'
  const rawCandidateId = String(formData.get('candidateId') ?? '').trim()
  const path = buildAvatarStoragePath({
    scope: isCandidateScope ? 'candidate' : 'user',
    userId: user.id,
    candidateId: isCandidateScope ? rawCandidateId : undefined,
    fileName: file.name,
  })

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return { publicUrl }
}

/** Yüklenen avatar URL'sini auth metadata'sına yazar (ProfileModal akışı). */
export async function setUserAvatarAction(publicUrl: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
  if (error) throw new Error(error.message)
}

export async function updateProfileAction(input: {
  fullName?: string
  email?: string
  password?: string
}): Promise<{ emailChangeRequested: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const fullName = input.fullName?.trim()
  if (fullName) {
    const { error: memberError } = await supabase
      .from('nmm_workspace_members')
      .update({ full_name: fullName })
      .eq('user_id', user.id)
    if (memberError) throw new Error(memberError.message)
    const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    if (metaError) throw new Error(metaError.message)
  }

  let emailChangeRequested = false
  if (input.email && input.email !== user.email) {
    const { error } = await supabase.auth.updateUser({ email: input.email })
    if (error) throw new Error(error.message)
    emailChangeRequested = true
  }

  if (input.password) {
    const { error } = await supabase.auth.updateUser({ password: input.password })
    if (error) throw new Error(error.message)
  }

  return { emailChangeRequested }
}
