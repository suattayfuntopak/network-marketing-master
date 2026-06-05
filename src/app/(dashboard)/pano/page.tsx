import { PanoContent } from './_components/PanoContent'

export default function PanoPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg)] px-4 pb-28 pt-6 md:min-h-[calc(100dvh-4rem)] md:pb-8">
      <PanoContent />
    </main>
  )
}
