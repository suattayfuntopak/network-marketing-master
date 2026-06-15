'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { sortContentPlans, type ContentPlanRecord } from '@/lib/domain/contentPlans'

async function ownWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.workspace_id ?? null
}

export async function getContentPlansAction(): Promise<ContentPlanRecord[]> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return []

  const { data } = await supabase
    .from('nmm_content_plans')
    .select('id, platform, scheduled_for, body, is_posted')
    .eq('owner_id', user.id)
    .limit(200)

  return sortContentPlans(data ?? [])
}

export async function addContentPlanAction(input: {
  platform: string
  scheduledFor: string
  body: string
}): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const body = input.body.trim()
  const scheduledFor = input.scheduledFor.trim()
  if (!body) throw new Error('İçerik boş olamaz.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) throw new Error('Geçerli bir tarih seç.')

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) throw new Error('Çalışma alanı bulunamadı.')

  const { error } = await supabase.from('nmm_content_plans').insert({
    workspace_id: workspaceId,
    owner_id: user.id,
    platform: input.platform || 'instagram',
    scheduled_for: scheduledFor,
    body: body.slice(0, 2000),
  })
  if (error) throw new Error(error.message)
}

export async function toggleContentPlanPostedAction(id: string, isPosted: boolean): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')
  if (!id) return

  const { error } = await supabase
    .from('nmm_content_plans')
    .update({ is_posted: isPosted })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)
}

export async function deleteContentPlanAction(id: string): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')
  if (!id) return

  const { error } = await supabase
    .from('nmm_content_plans')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)
}
