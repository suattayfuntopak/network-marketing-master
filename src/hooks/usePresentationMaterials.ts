'use client'

import { useQuery } from '@tanstack/react-query'
import { listPresentationMaterialsAction } from '@/app/(dashboard)/pipeline/sunum-materyalleri/actions'
import {
  buildGreenleafFallbackMaterial,
  type PresentationMaterial,
} from '@/lib/domain/presentationMaterials'

export function usePresentationMaterials(
  workspaceId: string | undefined,
  options?: { isSuperAdmin?: boolean; lang?: 'tr' | 'en'; includeFallback?: boolean }
) {
  const lang = options?.lang ?? 'tr'
  const isSuperAdmin = options?.isSuperAdmin ?? false
  const includeFallback = options?.includeFallback ?? false

  return useQuery({
    queryKey: ['presentation-materials', workspaceId, includeFallback, isSuperAdmin, lang],
    queryFn: async (): Promise<PresentationMaterial[]> => {
      const result = await listPresentationMaterialsAction(workspaceId!)
      if (!result.ok) {
        if (includeFallback && isSuperAdmin && workspaceId) {
          return [buildGreenleafFallbackMaterial(lang, workspaceId)]
        }
        throw new Error(result.error)
      }
      const rows = result.data
      if (rows.length === 0 && includeFallback && isSuperAdmin && workspaceId) {
        return [buildGreenleafFallbackMaterial(lang, workspaceId)]
      }
      return rows
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  })
}

export function pickDefaultMaterial(materials: PresentationMaterial[]): PresentationMaterial | null {
  if (materials.length === 0) return null
  return materials.find(m => m.is_default) ?? materials[0]
}
