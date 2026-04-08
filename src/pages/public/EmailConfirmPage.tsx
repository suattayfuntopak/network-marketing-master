import { Link } from 'react-router-dom'
import { Zap, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export function EmailConfirmPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">NMM</span>
        </Link>

        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Mail className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.emailConfirmTitle')}</h1>
          <p className="text-muted-foreground">
            {t('auth.emailConfirmDescription')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('auth.emailConfirmHint')}
          </p>
        </div>

        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" className="w-full">
            {t('auth.backToLogin')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
