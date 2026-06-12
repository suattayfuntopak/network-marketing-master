import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PipelinePageContent } from './_components/PipelinePageContent'

/** Yapılandırılmış iskelet (çıplak spinner yerine) → geçiş "pat" hissi verir. */
function PipelinePageSkeleton() {
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
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </main>
  )
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<PipelinePageSkeleton />}>
      <PipelinePageContent />
    </Suspense>
  )
}
