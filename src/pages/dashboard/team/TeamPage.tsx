import { ArrowLeft, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export function TeamPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="p-6 pb-20 lg:pb-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed bg-card/60 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <div className="mb-3 inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          {t('team.badge')}
        </div>
        <h1 className="text-2xl font-bold">{t('team.title')}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t('team.description')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('team.hint')}</p>
        <Button className="mt-6 gap-2" onClick={() => navigate(ROUTES.DASHBOARD)}>
          <ArrowLeft className="h-4 w-4" />
          {t('team.backToDashboard')}
        </Button>
      </div>
    </div>
  )
}

