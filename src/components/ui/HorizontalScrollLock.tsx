'use client'

import { clsx } from 'clsx'
import type { ComponentPropsWithoutRef, TouchEvent } from 'react'

type Props = ComponentPropsWithoutRef<'div'>

/** Yatay kaydırma — mobil sayfa swipe'ını tetiklemez. `no-swipe` + `data-no-swipe` ile eşleşir. */
export function HorizontalScrollLock({
  className,
  children,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  ...props
}: Props) {
  const stopSwipe = (e: TouchEvent<HTMLDivElement>) => e.stopPropagation()

  return (
    <div
      {...props}
      className={clsx(
        'horizontal-scroll-lock no-swipe overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-none',
        className,
      )}
      data-no-swipe="true"
      onTouchStart={e => {
        stopSwipe(e)
        onTouchStart?.(e)
      }}
      onTouchMove={e => {
        stopSwipe(e)
        onTouchMove?.(e)
      }}
      onTouchEnd={e => {
        stopSwipe(e)
        onTouchEnd?.(e)
      }}
    >
      {children}
    </div>
  )
}
