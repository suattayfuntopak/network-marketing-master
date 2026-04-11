import { useMemo } from 'react'
import { Activity, ArrowUpRight, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { useAuth } from '@/hooks/useAuth'
import { useContacts } from '@/hooks/useContacts'
import { DEFAULT_FILTERS } from '@/lib/contacts/types'
import { buildTeamRadarInsight, type TeamRadarStatus } from '@/lib/team/teamRadar'
import { cn } from '@/lib/utils'

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getDaysSince(dateValue: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(dateValue).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getStatusClasses(status: TeamRadarStatus) {
  if (status === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
  }

  if (status === 'gaining_momentum') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-400'
  }

  if (status === 'slowing_down') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400'
  }

  return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400'
}

export function TeamPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: contactsResult } = useContacts({
    userId,
    filters: {
      ...DEFAULT_FILTERS,
      contactTypes: ['distributor'],
    },
    sort: { field: 'warmth_score', order: 'desc' },
    page: 1,
    pageSize: 500,
  })

  const members = contactsResult?.data ?? []
  const radarMembers = useMemo(() => members.map((member) => buildTeamRadarInsight(member)), [members])

  const metrics = useMemo(() => {
    const totalMembers = members.length
    const activeMembers = radarMembers.filter((member) => member.status === 'active').length
    const newThisMonth = members.filter((member) => Date.now() - new Date(member.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length
    const joinedMembers = members.filter((member) => member.stage === 'joined').length
    const overdueMembers = members.filter((member) => Boolean(member.next_follow_up_at) && new Date(member.next_follow_up_at!).getTime() < Date.now()).length
    const gainingMomentum = radarMembers.filter((member) => member.status === 'gaining_momentum').length
    const needsSupport = radarMembers.filter((member) => member.status === 'needs_support').length

    return {
      totalMembers,
      activeMembers,
      activeRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      newThisMonth,
      joinedMembers,
      overdueMembers,
      gainingMomentum,
      needsSupport,
    }
  }, [members, radarMembers])

  const leaderboard = useMemo(
    () =>
      [...radarMembers]
        .sort((a, b) => {
          if (a.status !== b.status) {
            const weight = { gaining_momentum: 4, active: 3, slowing_down: 2, needs_support: 1 }
            return weight[b.status] - weight[a.status]
          }
          if (b.contact.warmth_score !== a.contact.warmth_score) return b.contact.warmth_score - a.contact.warmth_score
          return getDaysSince(a.contact.last_contact_at) - getDaysSince(b.contact.last_contact_at)
        })
        .slice(0, 5),
    [radarMembers]
  )

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('team.title')}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('team.subtitle')}</p>
        </div>

        <div className="rounded-xl border bg-card px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t('team.summary.label')}
          </div>
          <p className="mt-1 text-sm font-medium">
            {t('team.summary.value', {
              members: metrics.totalMembers,
              overdue: metrics.overdueMembers,
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.members')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t('team.stats.membersHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.activeRate')}</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeRate}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('team.stats.activeRateHint', { count: metrics.activeMembers })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.newThisMonth')}</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newThisMonth}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t('team.stats.newThisMonthHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.joined')}</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.joinedMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('team.stats.joinedHint', { count: metrics.overdueMembers })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {([
          { key: 'gaining_momentum', value: metrics.gainingMomentum },
          { key: 'active', value: metrics.activeMembers },
          { key: 'slowing_down', value: Math.max(metrics.totalMembers - metrics.activeMembers - metrics.gainingMomentum - metrics.needsSupport, 0) },
          { key: 'needs_support', value: metrics.needsSupport },
        ] as const).map(({ key, value }) => (
          <div key={key} className="rounded-2xl border border-border/70 bg-card/60 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', getStatusClasses(key))}>
                {t(`team.radar.status.${key}`)}
              </span>
              <span className="text-2xl font-semibold tabular-nums">{value}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t(`team.radar.statusDescriptions.${key}`)}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('team.sections.leaderboard')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.length > 0 ? (
            leaderboard.map((member, index) => (
              <div key={member.contact.id} className="rounded-xl border bg-card/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(member.contact.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{member.contact.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.contact.city || t('team.labels.locationFallback')}
                    </p>
                  </div>
                  <WarmthScoreBadge score={member.contact.warmth_score} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', getStatusClasses(member.status))}>
                    {t(`team.radar.status.${member.status}`)}
                  </span>
                  <p className="text-xs text-muted-foreground">{t(`team.radar.momentum.${member.momentumKey}`)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              {t('team.empty.leaderboard')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
