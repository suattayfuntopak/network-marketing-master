'use client'

import React from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'

interface ActionToastProps {
  message: React.ReactNode
  actionLabel: React.ReactNode
  onUndo: () => void
}

function ActionToast({ message, actionLabel, onUndo }: ActionToastProps) {
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
          {actionLabel}
        </span>
      </div>

      <div className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--text-1)]">
        {message}
      </div>

      <button
        onClick={onUndo}
        className="shrink-0 rounded-xl bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-1)] transition hover:bg-[var(--border)]"
      >
        {t('common.undo')}
      </button>
    </div>
  )
}

export function toastWithAction({
  message,
  actionLabel,
  actionFn,
  duration = 5000,
}: {
  message: React.ReactNode
  actionLabel: React.ReactNode
  actionFn: () => void
  duration?: number
}) {
  let cancelled = false

  const timer = setTimeout(() => {
    if (!cancelled) actionFn()
  }, duration)

  const toastId: string | number = toast.custom(
    () => (
      <ActionToast
        message={message}
        actionLabel={actionLabel}
        onUndo={() => {
          cancelled = true
          clearTimeout(timer)
          toast.dismiss(toastId)
        }}
      />
    ),
    { duration: duration + 200 }
  )
}

function DeleteToastMessage({ name }: { name: string }) {
  const { t } = useTranslation()
  return (
    <>
      <span className="font-semibold">{name}</span>{' '}
      {t('common.deleting')}
    </>
  )
}

function DeleteToastLabel() {
  const { t } = useTranslation()
  return <>{t('common.deleteLabel')}</>
}

export function deleteWithUndo(
  name: string,
  deleteFn: () => void,
) {
  toastWithAction({
    message: <DeleteToastMessage name={name} />,
    actionLabel: <DeleteToastLabel />,
    actionFn: deleteFn,
    duration: 5000,
  })
}
