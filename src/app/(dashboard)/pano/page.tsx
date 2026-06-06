import { PanoContent } from './_components/PanoContent'

export default function PanoPage() {
  return (
    <main className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-[var(--bg)] px-4 pb-28 pt-4 md:h-auto md:min-h-[calc(100dvh-4rem)] md:overflow-visible md:pb-8 md:pt-6">
      <PanoContent />
    </main>
  )
}
