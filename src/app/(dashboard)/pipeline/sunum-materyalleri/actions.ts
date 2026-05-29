'use server'

import { createClient } from '@/lib/supabase/server'
import {
  MAX_PRESENTATION_MATERIALS,
  normalizePresentationUrl,
  type PresentationMaterial,
} from '@/lib/domain/presentationMaterials'

export type PresentationMaterialResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function mapDbError(error: { code?: string; message?: string }): string {
  const msg = error.message ?? ''
  if (
    error.code === '42P01' ||
    msg.includes('nmm_presentation_materials') ||
    msg.includes('schema cache')
  ) {
    return 'Sunum materyalleri henüz veritabanında kurulmadı. Lütfen migration 028 uygulayın.'
  }
  if (error.code === '23505') {
    return 'Bu materyal zaten kayıtlı. Sayfayı yenileyip tekrar deneyin.'
  }
  return msg || 'Kayıt sırasında bir hata oluştu.'
}

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
): Promise<PresentationMaterialResult<PresentationMaterial[]>> {
  try {
    const { supabase } = await requireWorkspaceAccess(workspaceId)
    const { data, error } = await supabase
      .from('nmm_presentation_materials')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return { ok: false, error: mapDbError(error) }
    return { ok: true, data: (data ?? []) as PresentationMaterial[] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Liste alınamadı.' }
  }
}

export async function savePresentationMaterialAction(input: {
  workspaceId: string
  id?: string
  title: string
  url: string
  whatsappTemplate: string
  isDefault?: boolean
}): Promise<PresentationMaterialResult<PresentationMaterial>> {
  try {
    const { supabase } = await requireWorkspaceAccess(input.workspaceId)

    const title = input.title.trim()
    const whatsapp_template = input.whatsappTemplate.trim()
    if (!title) return { ok: false, error: 'Başlık gerekli.' }
    if (!whatsapp_template) return { ok: false, error: 'WhatsApp mesajı gerekli.' }

    let url: string
    try {
      url = normalizePresentationUrl(input.url)
    } catch {
      return { ok: false, error: 'Link http:// veya https:// ile başlamalı.' }
    }

    if (input.id) {
      const { data: existing, error: fetchErr } = await supabase
        .from('nmm_presentation_materials')
        .select('id, workspace_id')
        .eq('id', input.id)
        .maybeSingle()

      if (fetchErr) return { ok: false, error: mapDbError(fetchErr) }
      if (!existing || existing.workspace_id !== input.workspaceId) {
        return { ok: false, error: 'Materyal bulunamadı.' }
      }

      if (input.isDefault) {
        await supabase
          .from('nmm_presentation_materials')
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq('workspace_id', input.workspaceId)
          .neq('id', input.id)
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

      if (error) return { ok: false, error: mapDbError(error) }
      return { ok: true, data: data as PresentationMaterial }
    }

    const { count } = await supabase
      .from('nmm_presentation_materials')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', input.workspaceId)

    if ((count ?? 0) >= MAX_PRESENTATION_MATERIALS) {
      return { ok: false, error: `En fazla ${MAX_PRESENTATION_MATERIALS} materyal ekleyebilirsiniz.` }
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

    if (error) return { ok: false, error: mapDbError(error) }
    return { ok: true, data: data as PresentationMaterial }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Kayıt başarısız.' }
  }
}

export async function deletePresentationMaterialAction(
  workspaceId: string,
  materialId: string
): Promise<PresentationMaterialResult<null>> {
  try {
    const { supabase } = await requireWorkspaceAccess(workspaceId)

    const { data: row } = await supabase
      .from('nmm_presentation_materials')
      .select('id, is_default')
      .eq('id', materialId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!row) return { ok: false, error: 'Materyal bulunamadı.' }

    const { error } = await supabase
      .from('nmm_presentation_materials')
      .delete()
      .eq('id', materialId)

    if (error) return { ok: false, error: mapDbError(error) }

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

    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Silinemedi.' }
  }
}

export async function setDefaultPresentationMaterialAction(
  workspaceId: string,
  materialId: string
): Promise<PresentationMaterialResult<null>> {
  try {
    const { supabase } = await requireWorkspaceAccess(workspaceId)

    const { data: row } = await supabase
      .from('nmm_presentation_materials')
      .select('id')
      .eq('id', materialId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!row) return { ok: false, error: 'Materyal bulunamadı.' }

    await supabase
      .from('nmm_presentation_materials')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)

    const { error } = await supabase
      .from('nmm_presentation_materials')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', materialId)

    if (error) return { ok: false, error: mapDbError(error) }
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Güncellenemedi.' }
  }
}
