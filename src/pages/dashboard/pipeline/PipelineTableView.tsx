import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO, isPast } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '@/i18n'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { STAGE_COLOR_CLASSES, DEAL_TYPE_COLORS, DEAL_STATUS_COLORS, formatCurrency } from '@/lib/pipeline/constants'
import { resolveStageLabel } from '@/lib/pipeline/stageLabels'
import type { DealWithContact, PipelineStage } from '@/lib/pipeline/types'

interface Props {
  deals: DealWithContact[]
  stages: PipelineStage[]
}

export function PipelineTableView({ deals, stages }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language?.startsWith('en') ? enUS : tr
  const currLocale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR'

  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]))

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.title')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.title')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.stage')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.type')}</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.value')}</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.probability')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.expectedClose')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.status')}</th>
          </tr>
        </thead>
        <tbody>
          {deals.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-muted-foreground">
                {t('pipeline.emptyColumn')}
              </td>
            </tr>
          ) : (
            deals.map((deal) => {
              const stage = stageMap[deal.stage_id]
              const colors = stage ? STAGE_COLOR_CLASSES[stage.color] : STAGE_COLOR_CLASSES.gray
              const isOverdue = deal.expected_close_date && isPast(parseISO(deal.expected_close_date)) && deal.status === 'open'
              return (
                <tr
                  key={deal.id}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`${ROUTES.PIPELINE}/${deal.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{deal.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{deal.contact.full_name}</td>
                  <td className="px-4 py-3">
                    {stage && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge)}>
                        {resolveStageLabel(stage, t)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', DEAL_TYPE_COLORS[deal.deal_type])}>
                      {t(`pipeline.dealTypes.${deal.deal_type}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(deal.value, deal.currency, currLocale)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{deal.probability}%</td>
                  <td className={cn('px-4 py-3', isOverdue && 'text-red-500 font-medium')}>
                    {deal.expected_close_date
                      ? format(parseISO(deal.expected_close_date), 'd MMM yyyy', { locale })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', DEAL_STATUS_COLORS[deal.status])}>
                      {t(`pipeline.status.${deal.status}`)}
                    </span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
