import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { EkipPageContent } from './_components/EkipPageContent'

function EkipPageSkeleton() {
  return (
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="mb-4 h-12 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </main>
  )
}

export default function EkipPage() {
  return (
    <Suspense fallback={<EkipPageSkeleton />}>
      <EkipPageContent />
    </Suspense>
  )
}
