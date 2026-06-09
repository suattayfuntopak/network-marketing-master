import { Suspense } from 'react'
import { PipelinePageContent } from './_components/PipelinePageContent'

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </main>
      }
    >
      <PipelinePageContent />
    </Suspense>
  )
}
