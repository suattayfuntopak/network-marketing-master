import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type LauncherGridProps = {
  children: ReactNode
  /** 2 sütun (mobil) / md+ sütun sayısı grid satır hesabı için. */
  itemCount?: number
  /** md+ sütun sayısı — pano masaüstü 5×2. */
  columns?: 3 | 4 | 5
  /** Pano masaüstü: 5×2, viewport yüksekliğine sığan kompakt kareler (stretch yok). */
  panoDesktop?: boolean
}

const DESKTOP_ROW_CLASS: Record<number, string> = {
  2: 'md:grid-rows-2',
  3: 'md:grid-rows-3',
  4: 'md:grid-rows-4',
}

function gridClass(
  itemCount: number | undefined,
  panoDesktop: boolean,
  columns: 3 | 4 | 5,
): string {
  if (!panoDesktop) return 'gap-3 md:gap-[1.125rem]'
  const n = itemCount ?? 10
  const desktopRows = Math.ceil(n / columns)
  const desktop = DESKTOP_ROW_CLASS[desktopRows] ?? 'md:grid-rows-2'
  return clsx(
    'gap-2.5 md:gap-2.5',
    desktop,
    'md:h-[min(calc(100dvh-11.5rem),22rem)] md:max-h-[min(calc(100dvh-11.5rem),22rem)]',
  )
}

/** Pano + launcher kutuları — tek kaynak, aynı genişlik ve kare oran. */
export function LauncherGrid({
  children,
  itemCount,
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
          gridClass(itemCount, panoDesktop, columns),
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
        panoDesktop
          ? 'aspect-square w-full md:aspect-auto md:h-full md:min-h-0'
          : 'aspect-square',
        className,
      )}
    >
      {children}
    </div>
  )
}
