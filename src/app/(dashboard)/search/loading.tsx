import { Skeleton } from '@/components/ui/Skeleton'

export default function SearchLoading() {
  return (
    <main className="min-h-screen w-full space-y-6 bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-11 rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </main>
  )
}
