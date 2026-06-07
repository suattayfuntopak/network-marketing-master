import { CalendarDays } from 'lucide-react'
import { clsx } from 'clsx'

type CalendarPeriodIconProps = {
  days: 7 | 30
  className?: string
}

/** Takvim ikonu içinde dönem numarası (7 / 30). */
export function CalendarPeriodIcon({ days, className }: CalendarPeriodIconProps) {
  return (
    <span className={clsx('relative inline-flex shrink-0 items-center justify-center', className)}>
      <CalendarDays className="h-full w-full" strokeWidth={1.75} aria-hidden />
      <span
        className="absolute inset-0 flex items-center justify-center pt-[0.35em] text-[0.42em] font-black tabular-nums leading-none"
        aria-hidden
      >
        {days}
      </span>
    </span>
  )
}
