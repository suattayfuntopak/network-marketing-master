import { clsx } from 'clsx'

type CalendarPeriodIconProps = {
  days: 1 | 7 | 30
  className?: string
}

/** Ajanda çerçevesi — üst şerit + halkalar, gövdede belirgin dönem numarası (7 / 30). */
export function CalendarPeriodIcon({ days, className }: CalendarPeriodIconProps) {
  const fontSize = days === 30 ? 6.5 : days === 7 ? 8.5 : 9.5

  return (
    <svg
      viewBox="0 0 24 24"
      className={clsx('shrink-0', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Üst halkalar */}
      <rect x="7" y="2.5" width="2.2" height="3.2" rx="1.1" fill="currentColor" />
      <rect x="14.8" y="2.5" width="2.2" height="3.2" rx="1.1" fill="currentColor" />
      {/* Gövde */}
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="16"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {/* Üst şerit */}
      <path
        d="M5.5 8.5h13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="17.2"
        textAnchor="middle"
        fill="currentColor"
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {days}
      </text>
    </svg>
  )
}
