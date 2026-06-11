import { Skeleton } from '@/components/ui/Skeleton'

/**
 * Pano segment Suspense fallback — genel `DashboardLoading` yerine launcher
 * ızgarası ve başlık düzeniyle eşleşir; giriş→pano ve sekme dönüşünde
 * layout shift azalır.
 */
export default function PanoLoading() {
  return (
    <main
      data-main-scroll
      className="flex flex-1 flex-col bg-[var(--bg)] px-4 pb-28 pt-4 md:h-[calc(100dvh-4rem)] md:overflow-hidden md:pb-6 md:pt-5"
      role="status"
      aria-label="Loading"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-1 md:gap-2 md:overflow-hidden">
        <header className="shrink-0 md:mt-5">
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between md:gap-4">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-5 w-44 md:shrink-0" />
          </div>
        </header>

        <div className="min-h-0 flex-1 md:flex md:flex-col md:justify-center">
          <div className="grid w-full grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-2.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-square w-full rounded-[14px] md:aspect-[4/5] md:rounded-[12px]"
              />
            ))}
          </div>
        </div>

        <Skeleton className="h-24 rounded-2xl md:hidden" />
      </div>
    </main>
  )
}
