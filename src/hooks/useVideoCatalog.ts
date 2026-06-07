'use client'

import { useQuery } from '@tanstack/react-query'
import { getVideoCatalogAction } from '@/app/(dashboard)/egitim/videoActions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { queryKeys } from '@/lib/query/keys'

/** Canlı eğitim kataloğu + kullanıcı ilerlemesi — pano rozeti ve video şeridi. */
export function useVideoCatalog() {
  const { data: ws } = useWorkspace()
  const workspaceId = ws?.workspaceId

  return useQuery({
    queryKey: queryKeys.videoCatalog(workspaceId ?? ''),
    queryFn: () => getVideoCatalogAction(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })
}
