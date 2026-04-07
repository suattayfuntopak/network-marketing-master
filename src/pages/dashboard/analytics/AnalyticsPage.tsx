import { useTranslation } from 'react-i18next'
import { Users, TrendingUp, Bell, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useContactCount, useContactStageCounts } from '@/hooks/useContacts'
import { useTodayFollowUpsCount, useFollowUpBuckets } from '@/hooks/useCalendar'
import { usePipelineStats } from '@/hooks/usePipeline'
import i18n from '@/i18n'
import { formatCurrency } from '@/lib/pipeline/constants'

const STAGE_COLORS: Record<string, string> = {
  new: '#9ca3af',
  contacted: '#3b82f6',
  interested: '#a855f7',
  presenting: '#f59e0b',
  thinking: '#f97316',
  joined: '#10b981',
  lost: '#ef4444',
}

export function AnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const { data: contactCount = 0 } = useContactCount(userId)
  const { data: stageCounts = [] } = useContactStageCounts(userId)
  const { data: todayFollowUpsCount = 0 } = useTodayFollowUpsCount(userId)
  const { data: followUpBuckets } = useFollowUpBuckets(userId)
  const { data: pipelineStats } = usePipelineStats(userId)

  const chartData = stageCounts.map(({ stage, count }) => ({
    name: t(`pipelineStages.${stage}`),
    count,
    fill: STAGE_COLORS[stage] ?? '#9ca3af',
  }))

  const overdueCount = followUpBuckets?.overdue?.length ?? 0

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('nav.analytics')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('dashboard.totalContacts')}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('analytics.joinedCount')}</CardTitle>
            <Target className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stageCounts.find(s => s.stage === 'joined')?.count ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('dashboard.todayFollowUps')}</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayFollowUpsCount}</div>
            {overdueCount > 0 && (
              <p className="text-xs text-red-500 mt-1">{overdueCount} {t('analytics.overdue')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('analytics.pipelineValue')}</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineStats
                ? formatCurrency(pipelineStats.weightedValue, 'TRY', currentLang === 'en' ? 'en-US' : 'tr-TR')
                : '₺0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analytics.stageDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {contactCount === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              {t('dashboard.noContacts')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value) => [value, t('analytics.contacts')]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Stage breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analytics.stageBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stageCounts.map(({ stage, count }) => {
              const pct = contactCount > 0 ? Math.round((count / contactCount) * 100) : 0
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STAGE_COLORS[stage] ?? '#9ca3af' }}
                  />
                  <span className="text-sm flex-1">{t(`pipelineStages.${stage}`)}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage] ?? '#9ca3af' }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-6 text-right">{count}</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
