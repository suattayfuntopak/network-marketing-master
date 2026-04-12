import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Bell, Target, GraduationCap, CalendarRange, Flame, ShieldAlert, Zap, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useContactCount, useContactInsights, useContactStageCounts } from '@/hooks/useContacts'
import { useTodayFollowUpsCount, useOverdueFollowUpsCount, useFollowUpBuckets } from '@/hooks/useCalendar'
import { getTodayAcademyReadCount } from '@/lib/academy/progress'
import { buildAnalyticsInsights } from '@/lib/analytics/insights'
import i18n from '@/i18n'

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
  const [referenceNow] = useState(() => Date.now())

  const { data: contactCount = 0 } = useContactCount(userId)
  const { data: stageCounts = [] } = useContactStageCounts(userId)
  const { data: contacts = [] } = useContactInsights({
    userId,
    limit: 250,
  })
  const { data: todayFollowUpsCount = 0 } = useTodayFollowUpsCount(userId)
  const { data: overdueCount = 0 } = useOverdueFollowUpsCount(userId)
  const { data: followUpBuckets } = useFollowUpBuckets(userId)

  const academyTodayCount = getTodayAcademyReadCount()
  const chartData = stageCounts.map(({ stage, count }) => ({
    name: t(`pipelineStages.${stage}`),
    count,
    fill: STAGE_COLORS[stage] ?? '#9ca3af',
  }))

  const activeSummary = useMemo(() => {
    const now = referenceNow
    const pending = followUpBuckets?.all.filter((item) => item.status !== 'completed') ?? []
    const nextSevenDays = pending.filter((item) => {
      const dueTime = new Date(item.due_at).getTime()
      const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000
      return dueTime >= now && dueTime <= sevenDaysFromNow
    }).length

    const dayCounts = pending.reduce<Record<string, number>>((acc, item) => {
      const key = new Date(item.due_at).toLocaleDateString('sv-SE')
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    const [busiestDayKey, busiestDayCount] = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]

    return {
      nextSevenDays,
      busiestDayKey,
      busiestDayCount,
    }
  }, [followUpBuckets, referenceNow])

  const joinedCount = stageCounts.find((stage) => stage.stage === 'joined')?.count ?? 0
  const insights = useMemo(() => buildAnalyticsInsights(contacts, followUpBuckets), [contacts, followUpBuckets])

  const SIGNAL_TONE_CLASSES = {
    good: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    watch: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
    risk: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
  } as const

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('nav.analytics')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('analytics.subtitle')}</p>
      </div>

      <Card className="overflow-hidden rounded-3xl border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                {t('analytics.signalBoard.title')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t('analytics.signalBoard.subtitle')}</p>
            </div>
            <span className="rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {t('contacts.total', { count: contactCount })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                key: 'risk',
                Icon: ShieldAlert,
                value: insights.riskCount,
                tone: insights.tones.risk,
              },
              {
                key: 'growth',
                Icon: Zap,
                value: insights.growthCount,
                tone: insights.tones.growth,
              },
              {
                key: 'rhythm',
                Icon: Activity,
                value: `${insights.rhythmScore}%`,
                tone: insights.tones.rhythm,
              },
            ].map(({ key, Icon, value, tone }) => (
              <div key={key} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${SIGNAL_TONE_CLASSES[tone]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                </div>
                <p className="mt-3 text-sm font-medium">{t(`analytics.signalBoard.cards.${key}.title`)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('analytics.signalBoard.nextMoveLabel')}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(`analytics.signalBoard.nextMove.${insights.nextMove}`)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('dashboard.totalContacts')}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactCount}</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('analytics.joinedCount')}</CardTitle>
            <Target className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{joinedCount}</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/70">
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

        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('analytics.academyToday')}</CardTitle>
            <GraduationCap className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academyTodayCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('analytics.academyHint')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.stageDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {contactCount === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                {t('dashboard.noContacts')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={false}
                    wrapperStyle={{ outline: 'none' }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(9, 14, 25, 0.88)',
                      backdropFilter: 'blur(16px)',
                    }}
                    formatter={(value) => [value, t('analytics.contacts')]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} activeBar={false} animationDuration={550}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.quickSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarRange className="w-4 h-4 text-primary" />
                {t('analytics.nextSevenDays')}
              </div>
              <p className="mt-2 text-2xl font-bold">{activeSummary.nextSevenDays}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.nextSevenDaysHint')}</p>
            </div>

            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Flame className="w-4 h-4 text-amber-500" />
                {t('analytics.busiestDay')}
              </div>
              <p className="mt-2 text-base font-semibold">
                {activeSummary.busiestDayKey
                  ? new Date(`${activeSummary.busiestDayKey}T00:00:00`).toLocaleDateString(
                      i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR',
                      { weekday: 'long', day: 'numeric', month: 'short' }
                    )
                  : t('analytics.noDataYet')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeSummary.busiestDayCount > 0
                  ? t('analytics.busiestDayHint', { count: activeSummary.busiestDayCount })
                  : t('analytics.noActivityHint')}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="w-4 h-4 text-sky-500" />
                {t('analytics.followUpReadiness')}
              </div>
              <p className="mt-2 text-base font-semibold">{t('analytics.followUpReadinessValue', { count: overdueCount })}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.followUpReadinessHint', { count: todayFollowUpsCount })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/70 bg-card/70">
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
