import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { DashboardShell } from './_components/DashboardShell'
import { getQueryClient } from '@/lib/query/getQueryClient'
import { prefetchDashboardQueries } from '@/lib/query/prefetchDashboard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  await prefetchDashboardQueries(queryClient)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardShell>{children}</DashboardShell>
    </HydrationBoundary>
  )
}
