import { Skeleton } from '@/components/ui/Skeleton'

/** Platform Yönetimi — tablo/kart iskeleti (genel dashboard iskeletinden daha hedefli). */
export default function PlatformYonetimLoading() {
  return (
    <div className="w-full space-y-6 px-4 pb-28 pt-6 md:pb-8" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-11 w-full max-w-md rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
