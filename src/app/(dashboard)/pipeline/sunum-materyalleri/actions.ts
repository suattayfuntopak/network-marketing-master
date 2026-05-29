'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  MAX_PRESENTATION_MATERIALS,
  normalizePresentationUrl,
  type PresentationMaterial,
} from '@/lib/domain/presentationMaterials'

async function requireWorkspaceAccess(workspaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum gerekli.')

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) return { supabase, user }

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user }

  throw new Error('Bu workspace için yetkiniz yok.')
}

export async function listPresentationMaterialsAction(
  workspaceId: string
): Promise<PresentationMaterial[]> {
  const { supabase } = await requireWorkspaceAccess(workspaceId)

  const { data, error } = await supabase
    .from('nmm_presentation_materials')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PresentationMaterial[]
}

export async function savePresentationMaterialAction(input: {
  workspaceId: string
  id?: string
  title: string
  url: string
  whatsappTemplate: string
  isDefault?: boolean
}): Promise<PresentationMaterial> {
  const { supabase } = await requireWorkspaceAccess(input.workspaceId)

  const title = input.title.trim()
  const whatsapp_template = input.whatsappTemplate.trim()
  if (!title) throw new Error('Başlık gerekli.')
  if (!whatsapp_template) throw new Error('WhatsApp şablonu gerekli.')
  const url = normalizePresentationUrl(input.url)

  if (input.id) {
    const { data: existing, error: fetchErr } = await supabase
      .from('nmm_presentation_materials')
      .select('id, workspace_id')
      .eq('id', input.id)
      .maybeSingle()

    if (fetchErr || !existing || existing.workspace_id !== input.workspaceId) {
      throw new Error('Materyal bulunamadı.')
    }

    const { data, error } = await supabase
      .from('nmm_presentation_materials')
      .update({
        title,
        url,
        whatsapp_template,
        is_default: !!input.isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    if (input.isDefault) {
      await supabase
        .from('nmm_presentation_materials')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('workspace_id', input.workspaceId)
        .neq('id', input.id)
    }

    revalidatePath('/pipeline/sunum-materyalleri')
    revalidatePath('/pipeline')
    return data as PresentationMaterial
  }

  const { count } = await supabase
    .from('nmm_presentation_materials')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', input.workspaceId)

  if ((count ?? 0) >= MAX_PRESENTATION_MATERIALS) {
    throw new Error(`En fazla ${MAX_PRESENTATION_MATERIALS} materyal ekleyebilirsiniz.`)
  }

  const makeDefault = !!input.isDefault || (count ?? 0) === 0

  if (makeDefault) {
    await supabase
      .from('nmm_presentation_materials')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('workspace_id', input.workspaceId)
  }

  const { data, error } = await supabase
    .from('nmm_presentation_materials')
    .insert({
      workspace_id: input.workspaceId,
      title,
      url,
      whatsapp_template,
      sort_order: count ?? 0,
      is_default: makeDefault,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/pipeline/sunum-materyalleri')
  revalidatePath('/pipeline')
  return data as PresentationMaterial
}

export async function deletePresentationMaterialAction(
  workspaceId: string,
  materialId: string
): Promise<void> {
  const { supabase } = await requireWorkspaceAccess(workspaceId)

  const { data: row } = await supabase
    .from('nmm_presentation_materials')
    .select('id, is_default')
    .eq('id', materialId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!row) throw new Error('Materyal bulunamadı.')

  const { error } = await supabase
    .from('nmm_presentation_materials')
    .delete()
    .eq('id', materialId)

  if (error) throw new Error(error.message)

  if (row.is_default) {
    const { data: nextDefault } = await supabase
      .from('nmm_presentation_materials')
      .select('id')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextDefault) {
      await supabase
        .from('nmm_presentation_materials')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', nextDefault.id)
    }
  }

  revalidatePath('/pipeline/sunum-materyalleri')
  revalidatePath('/pipeline')
}

export async function setDefaultPresentationMaterialAction(
  workspaceId: string,
  materialId: string
): Promise<void> {
  const { supabase } = await requireWorkspaceAccess(workspaceId)

  const { data: row } = await supabase
    .from('nmm_presentation_materials')
    .select('id')
    .eq('id', materialId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!row) throw new Error('Materyal bulunamadı.')

  await supabase
    .from('nmm_presentation_materials')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)

  const { error } = await supabase
    .from('nmm_presentation_materials')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', materialId)

  if (error) throw new Error(error.message)

  revalidatePath('/pipeline/sunum-materyalleri')
  revalidatePath('/pipeline')
}
