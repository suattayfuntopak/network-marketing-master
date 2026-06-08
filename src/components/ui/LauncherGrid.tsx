import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type LauncherGridProps = {
  children: ReactNode
  /** Masaüstünde kalan viewport yüksekliğini doldur (pano launcher). */
  fillViewport?: boolean
  /** 2 sütun (mobil) / md+ sütun sayısı grid satır hesabı için. */
  itemCount?: number
  /** md+ sütun sayısı — pano 9 kutu için 3. */
  columns?: 3 | 4
}

const DESKTOP_ROW_CLASS: Record<number, string> = {
  2: 'md:grid-rows-2',
  3: 'md:grid-rows-3',
  4: 'md:grid-rows-4',
}

function gridRowsClass(
  itemCount: number | undefined,
  fillViewport: boolean,
  columns: 3 | 4,
): string {
  if (!fillViewport) return 'gap-3 md:gap-[1.125rem]'
  const n = itemCount ?? 6
  const desktopRows = Math.ceil(n / columns)
  const desktop = DESKTOP_ROW_CLASS[desktopRows] ?? 'md:grid-rows-3'
  return clsx('gap-2 md:min-h-0 md:h-full md:flex-1 md:gap-[1.125rem]', desktop)
}

/** Pano + Bugün İlgilen launcher kutuları — tek kaynak, aynı genişlik ve kare oran. */
export function LauncherGrid({
  children,
  fillViewport = false,
  itemCount,
  columns = 4,
}: LauncherGridProps) {
  const mdCols = columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'

  return (
    <div
      className={clsx(
        'w-full',
        fillViewport && 'flex min-h-0 flex-1 flex-col',
      )}
    >
      <div
        className={clsx(
          'grid w-full grid-cols-2',
          mdCols,
          fillViewport ? gridRowsClass(itemCount, true, columns) : 'gap-3 md:gap-[1.125rem]',
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
  fillViewport = false,
  ...rest
}: {
  children: ReactNode
  className?: string
  fillViewport?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        'relative min-w-0',
        fillViewport ? 'aspect-square w-full md:aspect-auto md:h-full md:min-h-0' : 'aspect-square',
        className,
      )}
    >
      {children}
    </div>
  )
}
