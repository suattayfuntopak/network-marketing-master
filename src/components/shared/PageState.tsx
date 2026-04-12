import type { ReactNode } from 'react'
import { AlertTriangle, Loader2, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PageStateVariant = 'loading' | 'error' | 'empty'

interface PageStateProps {
  variant: PageStateVariant
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

const VARIANT_ICON = {
  loading: Loader2,
  error: AlertTriangle,
  empty: SearchX,
} as const

export function PageState({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: PageStateProps) {
  const { t } = useTranslation()
  const Icon = VARIANT_ICON[variant]
  const defaultTitle =
    variant === 'loading'
      ? t('common.loading')
      : variant === 'error'
        ? t('common.somethingWentWrong')
        : t('common.noResultsFound')

  return (
    <div
      className={cn(
        'flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-card/70 text-primary">
        <Icon className={cn('h-5 w-5', variant === 'loading' && 'animate-spin')} />
      </div>
      <p className="mt-4 text-base font-semibold">{title ?? defaultTitle}</p>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {children}
      {actionLabel && onAction ? (
        <Button className="mt-5" variant={variant === 'error' ? 'default' : 'outline'} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
