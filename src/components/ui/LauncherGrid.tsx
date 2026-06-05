import type { ReactNode } from 'react'
import { clsx } from 'clsx'

/** Pano + Bugün İlgilen launcher kutuları — tek kaynak, aynı genişlik ve kare oran. */
export function LauncherGrid({ children }: { children: ReactNode }) {
  return (
    <div className="w-full md:mx-auto md:max-w-5xl">
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-[1.125rem]">
        {children}
      </div>
    </div>
  )
}

export function LauncherGridItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('relative aspect-square min-w-0', className)}>
      {children}
    </div>
  )
}
