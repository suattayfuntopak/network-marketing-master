import { Skeleton } from '@/components/ui/Skeleton'

export default function SahaOzetimLoading() {
  return (
    <div className="w-full space-y-6 px-4 pb-28 pt-6 md:pb-8" role="status" aria-label="Loading">
      {/* Title & Icon */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      {/* Tab switcher */}
      <Skeleton className="h-12 w-full rounded-2xl" />
      {/* Period selector */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>
      {/* Grid metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      {/* Detailed activity lists */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    </div>
  )
}
