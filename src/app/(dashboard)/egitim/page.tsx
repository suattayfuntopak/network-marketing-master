import { Suspense } from 'react'
import { AkademiContent } from './_components/AkademiContent'

export default function EgitimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center p-8 text-center text-sm text-[var(--text-3)]">
          Loading…
        </div>
      }
    >
      <AkademiContent />
    </Suspense>
  )
}
