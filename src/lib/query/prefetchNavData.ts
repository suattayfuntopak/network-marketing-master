import type { QueryClient } from '@tanstack/react-query'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import { prefetchRouteMetrics, type RoutePrefetchWs } from './prefetchRouteMetrics'

/** Sidebar / alt nav / pano kutusu: route metriklerini önceden yükle. */
export function prefetchRouteData(
  queryClient: QueryClient,
  href: string,
  workspaceId: string | undefined,
  ws?: Pick<WorkspaceContext, 'licenseType' | 'isSuperAdmin'> | RoutePrefetchWs | null,
) {
  prefetchRouteMetrics(queryClient, href, workspaceId, ws)
}
