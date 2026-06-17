'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  loadCustomContent,
  type CustomContentTable,
} from '@/lib/domain/customContent'
import type { CustomContentItem } from '@/app/(dashboard)/actions/customContent'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

export function useCustomContent(
  table: CustomContentTable,
  localKey: string,
  workspaceId: string | null | undefined,
) {
  return useQuery({
    queryKey: queryKeys.customContent(table, workspaceId ?? ''),
    queryFn: () => loadCustomContent(table, localKey, workspaceId ?? null),
    enabled: !!workspaceId,
    staleTime: QUERY_STALE.data,
  })
}

export function useInvalidateCustomContent() {
  const qc = useQueryClient()
  return (table: CustomContentTable, workspaceId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.customContent(table, workspaceId) })
  }
}

export type { CustomContentItem }
