'use client'

import type { NavItem } from '@/lib/domain/navigation'
import { CalendarPeriodIcon } from '@/components/ui/CalendarPeriodIcon'
import { clsx } from 'clsx'

type NavItemIconProps = {
  item: NavItem
  className?: string
  strokeWidth?: number
}

export function NavItemIcon({ item, className = 'h-5 w-5', strokeWidth = 1.75 }: NavItemIconProps) {
  if (item.calendarPeriod) {
    return <CalendarPeriodIcon days={item.calendarPeriod} className={clsx('shrink-0', className)} />
  }
  const Icon = item.icon
  return <Icon className={clsx('shrink-0', className)} strokeWidth={strokeWidth} />
}
