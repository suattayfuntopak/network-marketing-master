import { Link } from 'react-router-dom'
import { Zap, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">NMM</span>
        </Link>

        <div>
          <h1 className="text-8xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-bold mt-2">{t('common.pageNotFound')}</h2>
          <p className="text-muted-foreground mt-2">
            {t('common.pageNotFoundDescription')}
          </p>
        </div>

        <Link to={ROUTES.HOME}>
          <Button>
            <Home className="w-4 h-4 mr-2" />
            {t('common.returnHome')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
