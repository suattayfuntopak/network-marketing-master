import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { fetchWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { queryKeys } from '@/lib/query/keys'
import { IstatistiklerContent } from './_components/IstatistiklerContent'

/**
 * Workspace'i önceden çekip hidrasyonla gönderir. "Ekip Aktivite Özeti" artık
 * Ekibim sayfasında; onun SSR prefetch'i dashboard layout'unda (prefetchDashboard)
 * yapılır, bu yüzden burada team-field-activity prefetch'ine gerek yok.
 */
export default async function IstatistiklerPage() {
  const queryClient = getQueryClient()

  await queryClient.ensureQueryData({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IstatistiklerContent />
    </HydrationBoundary>
  )
}
