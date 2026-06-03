import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getTeamFieldActivityAction } from './teamActivityActions'
import { queryKeys } from '@/lib/query/keys'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { IstatistiklerContent } from './_components/IstatistiklerContent'

/**
 * Sayfa-seviyesi SSR prefetch: "Ekip Aktivite Özeti" (team-field-activity) verisini
 * önceden çekip hidrasyonla gönderir → kutu "pat diye" gelir (istemcide mount sonrası
 * dolma yok). Anahtar IstatistiklerContent ile birebir aynı:
 *   ['team-field-activity', workspaceId, '30d', perfMemberIds.join(',')]
 * perfMemberIds = downline (role==='member') user_id'leri — useTeamMembers/sortedMembers
 * ile aynı sıra. Period varsayılanı '30d'. Lisans kilidi (hasTeamPageAccess) ile gate.
 */
export default async function IstatistiklerPage() {
  const queryClient = getQueryClient()

  const ws = await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  if (ws?.workspaceId && hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) {
    const team = await queryClient.ensureQueryData({
      queryKey: queryKeys.team(ws.workspaceId),
      queryFn: () => fetchTeamBundleAction(ws.workspaceId),
    })

    const perfMemberIds = team.members
      .filter((m) => m.role === 'member')
      .map((m) => m.user_id)

    if (perfMemberIds.length > 0) {
      const period = '30d'
      await queryClient.prefetchQuery({
        queryKey: ['team-field-activity', ws.workspaceId, period, perfMemberIds.join(',')],
        queryFn: () => getTeamFieldActivityAction(ws.workspaceId, period, perfMemberIds),
        staleTime: 30_000,
      })
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IstatistiklerContent />
    </HydrationBoundary>
  )
}
