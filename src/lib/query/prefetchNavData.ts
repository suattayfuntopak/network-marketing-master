import type { QueryClient } from '@tanstack/react-query'
import { fetchCandidatesAction } from '@/app/(dashboard)/actions/candidates'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { queryKeys } from './keys'

const DATA_ROUTES = new Set([
  '/pano',
  '/pipeline',
  '/istatistikler',
  '/bugun/ilgilen',
  '/ekip',
  '/takvim',
])

const TEAM_ROUTES = new Set(['/istatistikler', '/ekip'])

/** Sidebar / alt nav hover: aday listesini önceden yükle. */
export function prefetchRouteData(queryClient: QueryClient, href: string, workspaceId: string | undefined) {
  if (!workspaceId || !DATA_ROUTES.has(href)) return
  void queryClient.prefetchQuery({
    queryKey: queryKeys.candidates(workspaceId),
    queryFn: () => fetchCandidatesAction(workspaceId),
    staleTime: 2 * 60 * 1000,
  })
  if (TEAM_ROUTES.has(href)) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.team(workspaceId),
      queryFn: () => fetchTeamBundleAction(workspaceId),
      staleTime: 2 * 60 * 1000,
    })
  }
}
