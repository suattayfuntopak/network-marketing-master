import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type LauncherGridProps = {
  children: ReactNode
  /** Masaüstünde kalan viewport yüksekliğini doldur (pano launcher). */
  fillViewport?: boolean
}

/** Pano + Bugün İlgilen launcher kutuları — tek kaynak, aynı genişlik ve kare oran. */
export function LauncherGrid({ children, fillViewport = false }: LauncherGridProps) {
  return (
    <div
      className={clsx(
        'w-full',
        fillViewport && 'flex min-h-0 flex-1 flex-col',
      )}
    >
      <div
        className={clsx(
          'grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-[1.125rem]',
          fillViewport && 'min-h-0 md:h-full md:flex-1 md:grid-rows-2',
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
        fillViewport ? 'aspect-square md:aspect-auto md:h-full md:min-h-0' : 'aspect-square',
        className,
      )}
    >
      {children}
    </div>
  )
}
