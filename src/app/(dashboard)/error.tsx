'use client'

import { RouteError } from '@/components/ui/RouteError'

export default function DashboardError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-10 md:pb-8">
      <RouteError {...props} />
    </div>
  )
}
