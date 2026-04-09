import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '@/i18n'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { STAGE_COLOR_CLASSES, DEAL_TYPE_COLORS } from '@/lib/pipeline/constants'
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

  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]))

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.title')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.stage')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.type')}</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.probability')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('pipeline.deal.expectedClose')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.columns.lastContact')}</th>
          </tr>
        </thead>
        <tbody>
          {deals.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12 text-muted-foreground">
                {t('pipeline.emptyColumn')}
              </td>
            </tr>
          ) : (
            deals.map((deal) => {
              const stage = stageMap[deal.stage_id]
              const colors = stage ? STAGE_COLOR_CLASSES[stage.color] : STAGE_COLOR_CLASSES.gray
              return (
                <tr
                  key={deal.id}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`${ROUTES.CONTACTS}/${deal.contact.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                        {deal.contact.full_name.split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{deal.contact.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{deal.title}</p>
                      </div>
                    </div>
                  </td>
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
                  <td className="px-4 py-3 text-right text-muted-foreground">{deal.probability}%</td>
                  <td className="px-4 py-3">
                    {deal.expected_close_date
                      ? format(parseISO(deal.expected_close_date), 'd MMM yyyy', { locale })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(parseISO(deal.updated_at), 'd MMM yyyy', { locale })}
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
