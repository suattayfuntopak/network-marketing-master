import { Suspense } from 'react'
import { EgitimContent } from './_components/EgitimContent'

export default function EgitimPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-3)] flex items-center justify-center min-h-[300px]">Loading training...</div>}>
      <EgitimContent />
    </Suspense>
  )
}
