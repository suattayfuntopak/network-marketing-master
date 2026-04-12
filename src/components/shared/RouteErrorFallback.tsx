import { useEffect } from 'react'
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/constants'
import { PageState } from '@/components/shared/PageState'
import { reportAppError } from '@/lib/observability/errorTracking'

export function RouteErrorFallback() {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    reportAppError(error, 'route')
  }, [error])

  const description = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t('common.unknownError')

  return (
    <div className="p-6">
      <PageState
        variant="error"
        title={t('common.routeLoadError')}
        description={description}
        actionLabel={t('common.returnDashboard')}
        onAction={() => navigate(ROUTES.DASHBOARD)}
      />
    </div>
  )
}
