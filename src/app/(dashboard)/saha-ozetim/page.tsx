import { Suspense } from 'react'
import { FieldSummaryPage } from './_components/FieldSummaryPage'

export default function SahaOzetimPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-sm text-[var(--text-3)]">…</div>
      }
    >
      <FieldSummaryPage />
    </Suspense>
  )
}
