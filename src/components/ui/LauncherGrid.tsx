import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type LauncherGridProps = {
  children: ReactNode
  /** 2 sütun (mobil) / md+ sütun sayısı grid satır hesabı için. */
  itemCount?: number
  /** md+ sütun sayısı — pano masaüstü 5×2. */
  columns?: 3 | 4 | 5
  /** Pano masaüstü: 5×2, genişlik sabit kare kutular (aspect-square). */
  panoDesktop?: boolean
}

function gridClass(panoDesktop: boolean): string {
  if (!panoDesktop) return 'gap-3 md:gap-[1.125rem]'
  return 'gap-2.5 md:gap-2.5'
}

/** Pano + launcher kutuları — tek kaynak, aynı genişlik ve kare oran. */
export function LauncherGrid({
  children,
  columns = 4,
  panoDesktop = false,
}: LauncherGridProps) {
  const mdCols =
    columns === 5 ? 'md:grid-cols-5' : columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'

  return (
    <div className={clsx('w-full', panoDesktop && 'md:flex md:min-h-0 md:flex-1 md:flex-col md:justify-center')}>
      <div
        className={clsx(
          'grid w-full grid-cols-2',
          mdCols,
          gridClass(panoDesktop),
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function LauncherGridItem({
  children,
  className,
  panoDesktop = false,
  ...rest
}: {
  children: ReactNode
  className?: string
  panoDesktop?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        'relative min-w-0',
        panoDesktop ? 'aspect-square w-full' : 'aspect-square',
        className,
      )}
    >
      {children}
    </div>
  )
}
