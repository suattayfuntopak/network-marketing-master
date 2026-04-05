import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '@/i18n'
import {
  ArrowLeft, CheckCircle, XCircle, RotateCcw, Calendar, TrendingUp,
  User, ExternalLink, Clock, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useDeal, useStageHistory, usePipelineStages, useCloseDeal, useReopenDeal, useUpdateDeal } from '@/hooks/usePipeline'
import { STAGE_COLOR_CLASSES, DEAL_TYPE_COLORS, DEAL_STATUS_COLORS, formatCurrency } from '@/lib/pipeline/constants'
import type { DealStatus } from '@/lib/pipeline/types'

export function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const locale = i18n.language?.startsWith('en') ? enUS : tr
  const currLocale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR'

  const [showLostReason, setShowLostReason] = useState(false)
  const [lostReason, setLostReason] = useState('')

  const { data: deal, isLoading } = useDeal(dealId ?? '')
  const { data: history = [] } = useStageHistory(dealId ?? '')
  const { data: stages = [] } = usePipelineStages(userId)
  const closeDeal = useCloseDeal(userId)
  const reopenDeal = useReopenDeal(userId)
  const updateDeal = useUpdateDeal(userId)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t('contacts.notFound')}</p>
        <Button variant="ghost" className="mt-4 gap-1.5" onClick={() => navigate(ROUTES.PIPELINE)}>
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Button>
      </div>
    )
  }

  const currentStage = stages.find((s) => s.id === deal.stage_id)
  const stageColors = currentStage ? STAGE_COLOR_CLASSES[currentStage.color] : STAGE_COLOR_CLASSES.gray

  const handleWon = async () => {
    await closeDeal.mutateAsync({ id: deal.id, status: 'won' })
    navigate(ROUTES.PIPELINE)
  }

  const handleLost = async () => {
    if (!showLostReason) { setShowLostReason(true); return }
    await closeDeal.mutateAsync({ id: deal.id, status: 'lost', lostReason })
    navigate(ROUTES.PIPELINE)
  }

  const handleReopen = async () => {
    await reopenDeal.mutateAsync(deal.id)
  }

  const handleStageChange = async (stageId: string) => {
    await updateDeal.mutateAsync({ id: deal.id, data: { stage_id: stageId } })
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 max-w-5xl mx-auto space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', DEAL_TYPE_COLORS[deal.deal_type])}>
              {t(`pipeline.dealTypes.${deal.deal_type}`)}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', DEAL_STATUS_COLORS[deal.status])}>
              {t(`pipeline.status.${deal.status}`)}
            </span>
            {currentStage && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', stageColors.badge)}>
                {currentStage.name}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 shrink-0">
          {deal.status === 'open' && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={handleWon}>
                <CheckCircle className="w-4 h-4" />
                {t('pipeline.deal.wonBtn')}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleLost}>
                <XCircle className="w-4 h-4" />
                {t('pipeline.deal.lostBtn')}
              </Button>
            </>
          )}
          {deal.status !== 'open' && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReopen}>
              <RotateCcw className="w-4 h-4" />
              {t('pipeline.deal.reopen')}
            </Button>
          )}
        </div>
      </div>

      {/* Lost reason input */}
      {showLostReason && (
        <div className="flex gap-2">
          <input
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder={t('pipeline.deal.lostReasonPlaceholder')}
            className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === 'Enter' && handleLost()}
          />
          <Button size="sm" variant="destructive" onClick={handleLost}>{t('common.confirm')}</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowLostReason(false)}>{t('common.cancel')}</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Deal info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key metrics */}
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('pipeline.deal.value')}</p>
                  <p className="text-xl font-bold mt-0.5">{formatCurrency(deal.value, deal.currency, currLocale)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('pipeline.deal.probability')}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <p className="text-xl font-bold">{deal.probability}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('pipeline.weightedValue')}</p>
                  <p className="text-xl font-bold mt-0.5 text-primary">
                    {formatCurrency((deal.value * deal.probability) / 100, deal.currency, currLocale)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                {deal.expected_close_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('pipeline.deal.expectedClose')}</p>
                      <p className="text-sm font-medium">{format(parseISO(deal.expected_close_date), 'd MMMM yyyy', { locale })}</p>
                    </div>
                  </div>
                )}
                {deal.actual_close_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('pipeline.deal.actualClose')}</p>
                      <p className="text-sm font-medium">{format(parseISO(deal.actual_close_date), 'd MMMM yyyy', { locale })}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stage selector */}
          {deal.status === 'open' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('pipeline.deal.stage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stages.filter((s) => !s.is_lost_stage).map((stage) => {
                    const colors = STAGE_COLOR_CLASSES[stage.color]
                    const isActive = stage.id === deal.stage_id
                    return (
                      <button
                        key={stage.id}
                        onClick={() => handleStageChange(stage.id)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full font-medium border transition-all',
                          isActive
                            ? `${colors.badge} border-current`
                            : 'text-muted-foreground border-border hover:border-muted-foreground'
                        )}
                      >
                        {stage.name}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {deal.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('pipeline.deal.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Stage history timeline */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('pipeline.stageHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((h) => {
                    const fromColors = h.from_stage ? STAGE_COLOR_CLASSES[h.from_stage.color as keyof typeof STAGE_COLOR_CLASSES] : null
                    const toColors = STAGE_COLOR_CLASSES[h.to_stage.color as keyof typeof STAGE_COLOR_CLASSES]
                    return (
                      <div key={h.id} className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                          {h.from_stage ? (
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', fromColors?.badge)}>{h.from_stage.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', toColors.badge)}>{h.to_stage.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(h.moved_at), { addSuffix: true, locale })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Contact info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('contacts.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to={`${ROUTES.CONTACTS}/${deal.contact.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                  {deal.contact.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{deal.contact.full_name}</p>
                  {deal.contact.phone && <p className="text-xs text-muted-foreground">{deal.contact.phone}</p>}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('common.add')} {t('common.filter').toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{t(`pipeline.dealTypes.${deal.deal_type}`)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {t('contacts.columns.lastContact')}:{' '}
                    {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
