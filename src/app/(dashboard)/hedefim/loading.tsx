import { Skeleton } from '@/components/ui/Skeleton'

export default function HedefimLoading() {
  return (
    <div className="w-full space-y-6 px-4 pb-28 pt-6 md:pb-8" role="status" aria-label="Loading">
      {/* Title area */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-32" />
      </div>
      {/* Goal statement box */}
      <Skeleton className="h-14 w-full rounded-2xl" />
      {/* Targets section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
