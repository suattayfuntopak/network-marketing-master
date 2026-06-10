'use client'

import { useEffect, type ReactNode } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

/** 20+ üyede pencere sanallaştırması — değiştirmek için tek kaynak. */
export const MEMBER_LIST_VIRTUALIZE_THRESHOLD = 20
const VIRTUALIZE_THRESHOLD = MEMBER_LIST_VIRTUALIZE_THRESHOLD
const ROW_GAP_PX = 20

type VirtualizedMemberListProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  /** Kart yüksekliği değişince (sekme aç/kapa) yeniden ölçüm tetikler */
  measureKey?: string
  estimateSize?: number
}

export function VirtualizedMemberList<T>({
  items,
  getKey,
  renderItem,
  measureKey = '',
  estimateSize = 260,
}: VirtualizedMemberListProps<T>) {
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize + ROW_GAP_PX,
    overscan: 3,
    measureElement:
      typeof window !== 'undefined'
        ? el => (el?.getBoundingClientRect().height ?? estimateSize) + ROW_GAP_PX
        : undefined,
  })

  useEffect(() => {
    if (items.length <= VIRTUALIZE_THRESHOLD) return
    virtualizer.measure()
  }, [measureKey, items.length, virtualizer])

  if (items.length <= VIRTUALIZE_THRESHOLD) {
    return <div className="space-y-5">{items.map(item => renderItem(item))}</div>
  }

  return (
    <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map(virtualRow => {
        const item = items[virtualRow.index]
        return (
          <div
            key={getKey(item)}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
              paddingBottom: ROW_GAP_PX,
            }}
          >
            {renderItem(item)}
          </div>
        )
      })}
    </div>
  )
}
