import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfMonth, addMonths, parseISO, isWithinInterval } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/pipeline/constants'
import type { DealWithContact } from '@/lib/pipeline/types'

interface Props {
  deals: DealWithContact[]
}

interface MonthBucket {
  label: string
  start: Date
  end: Date
  deals: DealWithContact[]
  totalValue: number
  weightedValue: number
}

export function PipelineForecastView({ deals }: Props) {
  const { t } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? enUS : tr
  const currLocale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR'

  const openDeals = deals.filter((d) => d.status === 'open' && d.expected_close_date)

  const buckets: MonthBucket[] = useMemo(() => {
    const today = new Date()
    return [0, 1, 2, 3].map((offset) => {
      const start = startOfMonth(addMonths(today, offset))
      const end = startOfMonth(addMonths(today, offset + 1))
      const monthDeals = openDeals.filter((d) => {
        if (!d.expected_close_date) return false
        const date = parseISO(d.expected_close_date)
        return isWithinInterval(date, { start, end: new Date(end.getTime() - 1) })
      })
      return {
        label: format(start, 'MMMM yyyy', { locale }),
        start,
        end,
        deals: monthDeals,
        totalValue: monthDeals.reduce((s, d) => s + d.value, 0),
        weightedValue: monthDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0),
      }
    })
  }, [openDeals, locale])

  const totals = {
    totalValue: buckets.reduce((s, b) => s + b.totalValue, 0),
    weightedValue: buckets.reduce((s, b) => s + b.weightedValue, 0),
    dealCount: buckets.reduce((s, b) => s + b.deals.length, 0),
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pipeline.forecast.openDeals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.dealCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pipeline.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.totalValue, 'TRY', currLocale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pipeline.weightedValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.weightedValue, 'TRY', currLocale)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {buckets.map((bucket, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="bg-muted/40 px-4 py-3 border-b">
              <p className="text-sm font-semibold capitalize">{bucket.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bucket.deals.length} {t('pipeline.forecast.deal', { count: bucket.deals.length })}
              </p>
            </div>
            <div className="px-4 py-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('pipeline.totalValue')}</span>
                <span className="font-medium">{formatCurrency(bucket.totalValue, 'TRY', currLocale)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('pipeline.weightedValue')}</span>
                <span className="font-semibold text-primary">{formatCurrency(bucket.weightedValue, 'TRY', currLocale)}</span>
              </div>
            </div>
            {bucket.deals.length > 0 && (
              <div className="border-t px-4 py-2 space-y-1 max-h-48 overflow-y-auto">
                {bucket.deals.map((d) => (
                  <div key={d.id} className="flex justify-between text-xs py-0.5">
                    <span className="text-muted-foreground truncate max-w-[120px]">{d.title}</span>
                    <span className="font-medium shrink-0 ml-2">
                      {formatCurrency((d.value * d.probability) / 100, 'TRY', currLocale)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
