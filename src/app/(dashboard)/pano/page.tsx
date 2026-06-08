import { PanoContent } from './_components/PanoContent'

export default function PanoPage() {
  return (
    <main
      data-main-scroll
      className="flex flex-1 flex-col bg-[var(--bg)] px-4 pb-28 pt-4 md:h-[calc(100dvh-4rem)] md:overflow-hidden md:pb-6 md:pt-5"
    >
      <PanoContent />
    </main>
  )
}
