import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function CrownCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5', className)}>
      {children}
    </div>
  )
}
