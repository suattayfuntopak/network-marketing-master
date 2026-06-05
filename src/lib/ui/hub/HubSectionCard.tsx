import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type HubSectionCardProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function HubSectionCard({ title, children, className }: HubSectionCardProps) {
  return (
    <section className={clsx('rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5', className)}>
      {title ? (
        <h2 className="mb-4 text-base font-bold text-[var(--text-1)]">{title}</h2>
      ) : null}
      {children}
    </section>
  )
}
