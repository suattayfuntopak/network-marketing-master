import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

/** Shared loading placeholder — use instead of inline `animate-pulse` divs. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded bg-[var(--bg-subtle)]', className)}
      aria-hidden
    />
  )
}
