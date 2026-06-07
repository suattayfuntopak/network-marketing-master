import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type LauncherGridProps = {
  children: ReactNode
  /** Masaüstünde kalan viewport yüksekliğini doldur (pano launcher). */
  fillViewport?: boolean
  /** 2 sütun (mobil) / 4 sütun (md+) grid satır sayısını hesaplar. */
  itemCount?: number
}

const MOBILE_ROW_CLASS: Record<number, string> = {
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
}

const DESKTOP_ROW_CLASS: Record<number, string> = {
  2: 'md:grid-rows-2',
  3: 'md:grid-rows-3',
  4: 'md:grid-rows-4',
}

function gridRowsClass(itemCount: number | undefined, fillViewport: boolean): string {
  if (!fillViewport) return 'gap-3 md:gap-[1.125rem]'
  const n = itemCount ?? 6
  const mobileRows = Math.ceil(n / 2)
  const desktopRows = Math.ceil(n / 4)
  const mobile = MOBILE_ROW_CLASS[mobileRows] ?? 'grid-rows-6'
  const desktop = DESKTOP_ROW_CLASS[desktopRows] ?? 'md:grid-rows-3'
  return clsx('min-h-0 h-full flex-1 gap-2 md:gap-[1.125rem]', mobile, desktop)
}

/** Pano + Bugün İlgilen launcher kutuları — tek kaynak, aynı genişlik ve kare oran. */
export function LauncherGrid({ children, fillViewport = false, itemCount }: LauncherGridProps) {
  return (
    <div
      className={clsx(
        'w-full',
        fillViewport && 'flex min-h-0 flex-1 flex-col',
      )}
    >
      <div
        className={clsx(
          'grid w-full grid-cols-2 md:grid-cols-4',
          fillViewport ? gridRowsClass(itemCount, true) : 'gap-3 md:gap-[1.125rem]',
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
}: {
  children: ReactNode
  className?: string
  fillViewport?: boolean
}) {
  return (
    <div
      className={clsx(
        'relative min-w-0',
        fillViewport ? 'h-full min-h-0' : 'aspect-square',
        className,
      )}
    >
      {children}
    </div>
  )
}
