'use client'

import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'

function DeleteToast({
  name,
  onUndo,
}: {
  name: string
  onUndo: () => void
}) {
  const { t } = useTranslation()
  const r = 14
  const circ = 2 * Math.PI * r

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-lg min-w-[260px]">
      {/* Circular countdown SVG */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="50%" cy="50%" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
          <circle
            cx="50%" cy="50%" r={r} fill="none"
            stroke="#ef4444" strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={0}
            style={{ animation: 'stroke-countdown 5s linear forwards' }}
          />
        </svg>
        <span className="text-[9px] font-bold text-red-500">
          {t('common.deleteLabel')}
        </span>
      </div>

      <p className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--text-1)]">
        <span className="font-semibold">{name}</span>{' '}
        {t('common.deleting')}
      </p>

      <button
        onClick={onUndo}
        className="shrink-0 rounded-xl bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-1)] transition hover:bg-[var(--border)]"
      >
        {t('common.undo')}
      </button>
    </div>
  )
}

export function deleteWithUndo(
  name: string,
  deleteFn: () => void,
) {
  let cancelled = false

  const timer = setTimeout(() => {
    if (!cancelled) deleteFn()
  }, 5000)

  const toastId: string | number = toast.custom(
    () => (
      <DeleteToast
        name={name}
        onUndo={() => {
          cancelled = true
          clearTimeout(timer)
          toast.dismiss(toastId)
        }}
      />
    ),
    { duration: 5200 }
  )
}

