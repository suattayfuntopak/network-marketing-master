import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/constants'
import { PageState } from '@/components/shared/PageState'
import { reportAppError } from '@/lib/observability/errorTracking'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class AppErrorBoundaryInner extends Component<
  ErrorBoundaryProps & {
    title: string
    description: string
    actionLabel: string
    onAction: () => void
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportAppError(error, 'boundary', { componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-6">
          <PageState
            variant="error"
            title={this.props.title}
            description={this.props.description}
            actionLabel={this.props.actionLabel}
            onAction={this.props.onAction}
            className="min-h-[calc(100vh-3rem)]"
          />
        </div>
      )
    }

    return this.props.children
  }
}

export function AppErrorBoundary({ children }: ErrorBoundaryProps) {
  const { t } = useTranslation()

  return (
    <AppErrorBoundaryInner
      title={t('common.appCrashed')}
      description={t('common.appCrashedDescription')}
      actionLabel={t('common.returnDashboard')}
      onAction={() => window.location.assign(ROUTES.DASHBOARD)}
    >
      {children}
    </AppErrorBoundaryInner>
  )
}
