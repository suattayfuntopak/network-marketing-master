'use client'

import React from 'react'
import { PageHelp } from '@/components/ui/PageHelp'

interface DashboardPageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  iconContainerClassName?: string
  actions?: React.ReactNode
  showHelp?: boolean
  className?: string
  dateLine?: string
}

export function DashboardPageHeader({
  title,
  subtitle,
  icon,
  iconContainerClassName = 'bg-[var(--bg-subtle)]',
  actions,
  showHelp = true,
  className = 'mb-6',
  dateLine,
}: DashboardPageHeaderProps) {
  return (
    <header className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconContainerClassName}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-1)] tracking-tight sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-2)] leading-relaxed sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-row items-center gap-2">
        {dateLine && (
          <p className="shrink-0 text-right text-xs font-medium tracking-wide text-[var(--text-3)] sm:text-sm">
            {dateLine}
          </p>
        )}
        {actions}
        {showHelp && <PageHelp />}
      </div>
    </header>
  )
}
