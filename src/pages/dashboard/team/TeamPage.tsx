import { useMemo, type ReactNode } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, tr } from 'date-fns/locale'
import { Activity, AlertTriangle, ArrowUpRight, ShieldAlert, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { useAuth } from '@/hooks/useAuth'
import { useContacts } from '@/hooks/useContacts'
import { ROUTES } from '@/lib/constants'
import { DEFAULT_FILTERS } from '@/lib/contacts/types'
import { cn } from '@/lib/utils'
import type { ContactWithTags } from '@/lib/contacts/types'

type ActivityStatus = 'active' | 'monitor' | 'inactive'

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

function getActivityStatus(contact: ContactWithTags): ActivityStatus {
  const hasOverdueFollowUp =
    typeof contact.next_follow_up_at === 'string' && new Date(contact.next_follow_up_at).getTime() < Date.now()
  const daysSinceLastTouch = getDaysSince(contact.last_contact_at)

  if (hasOverdueFollowUp || daysSinceLastTouch >= 14) return 'inactive'
  if (daysSinceLastTouch >= 7 || contact.stage === 'thinking') return 'monitor'
  return 'active'
}

function getStatusClasses(status: ActivityStatus) {
  if (status === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
  }

  if (status === 'monitor') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400'
  }

  return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400'
}

function TeamMemberCard({
  contact,
  subtitle,
  extra,
}: {
  contact: ContactWithTags
  subtitle: string
  extra?: ReactNode
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
      className="w-full rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Avatar size="default">
          <AvatarFallback>{getInitials(contact.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{contact.full_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StageBadge stage={contact.stage} />
            <WarmthScoreBadge score={contact.warmth_score} />
          </div>
          {extra ? <div className="mt-3">{extra}</div> : null}
        </div>
      </div>
    </button>
  )
}

export function TeamPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const locale = i18n.language?.startsWith('en') ? enUS : tr

  const { data: contactsResult, isLoading } = useContacts({
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

  const metrics = useMemo(() => {
    const totalMembers = members.length
    const activeMembers = members.filter((member) => getActivityStatus(member) === 'active').length
    const newThisMonth = members.filter((member) => Date.now() - new Date(member.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length
    const joinedMembers = members.filter((member) => member.stage === 'joined').length
    const overdueMembers = members.filter((member) => Boolean(member.next_follow_up_at) && new Date(member.next_follow_up_at!).getTime() < Date.now()).length

    return {
      totalMembers,
      activeMembers,
      activeRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      newThisMonth,
      joinedMembers,
      overdueMembers,
    }
  }, [members])

  const leaderboard = useMemo(
    () =>
      [...members]
        .sort((a, b) => {
          if (b.warmth_score !== a.warmth_score) return b.warmth_score - a.warmth_score
          return getDaysSince(a.last_contact_at) - getDaysSince(b.last_contact_at)
        })
        .slice(0, 5),
    [members]
  )

  const needsAttention = useMemo(
    () =>
      [...members]
        .filter((member) => getActivityStatus(member) !== 'active')
        .sort((a, b) => {
          const overdueA = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Number.POSITIVE_INFINITY
          const overdueB = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Number.POSITIVE_INFINITY
          return overdueA - overdueB || getDaysSince(b.last_contact_at) - getDaysSince(a.last_contact_at)
        })
        .slice(0, 4),
    [members]
  )

  const activationQueue = useMemo(
    () =>
      [...members]
        .filter((member) => member.stage !== 'joined' && member.stage !== 'lost')
        .sort((a, b) => {
          if (b.warmth_score !== a.warmth_score) return b.warmth_score - a.warmth_score
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .slice(0, 6),
    [members]
  )

  const summaryTone = metrics.overdueMembers > 0 ? 'warning' : 'default'

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

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('team.sections.overview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t('team.overview.title')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('team.overview.body', {
                      members: metrics.totalMembers,
                      activeRate: metrics.activeRate,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-card/70 p-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('border-current', summaryTone === 'warning' ? 'text-amber-600' : 'text-emerald-600')}
                  >
                    {summaryTone === 'warning' ? t('team.labels.warning') : t('team.labels.healthy')}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{t('team.overview.followUpTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('team.overview.followUpBody', { count: metrics.overdueMembers })}
                </p>
              </div>

              <div className="rounded-xl border bg-card/70 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sky-600">
                    {t('team.labels.momentum')}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-medium">{t('team.overview.momentumTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('team.overview.momentumBody', {
                    joined: metrics.joinedMembers,
                    newThisMonth: metrics.newThisMonth,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('team.sections.leaderboard')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((member, index) => (
                <div key={member.id} className="rounded-xl border bg-card/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.city || t('team.labels.locationFallback')}
                      </p>
                    </div>
                    <WarmthScoreBadge score={member.warmth_score} />
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

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('team.sections.needsAttention')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsAttention.length > 0 ? (
              needsAttention.map((member) => {
                const status = getActivityStatus(member)
                const hasOverdueFollowUp = Boolean(member.next_follow_up_at) && new Date(member.next_follow_up_at!).getTime() < Date.now()
                const reason = hasOverdueFollowUp
                  ? t('team.reasons.overdue')
                  : member.last_contact_at
                    ? t('team.reasons.noRecentTouch')
                    : t('team.reasons.noTouchYet')

                return (
                  <TeamMemberCard
                    key={member.id}
                    contact={member}
                    subtitle={reason}
                    extra={
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', getStatusClasses(status))}>
                            {t(`team.activity.${status}`)}
                          </span>
                          {hasOverdueFollowUp ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              {t('team.labels.overdue')}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('team.labels.lastContact')}:{' '}
                          {member.last_contact_at
                            ? formatDistanceToNow(new Date(member.last_contact_at), { addSuffix: true, locale })
                            : t('team.labels.noDate')}
                        </p>
                      </div>
                    }
                  />
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                {t('team.empty.attention')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{t('team.sections.activationQueue')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.CONTACTS)}>
              {t('team.actions.openContacts')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activationQueue.length > 0 ? (
              activationQueue.map((member) => {
                const progress = Math.max(8, member.warmth_score)

                return (
                  <TeamMemberCard
                    key={member.id}
                    contact={member}
                    subtitle={member.occupation || member.city || t('team.labels.progressFallback')}
                    extra={
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t('team.labels.readiness')}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),rgba(16,185,129,0.9))]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    }
                  />
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                {t('team.empty.activation')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold">{t('team.focus.title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('team.focus.body', { count: needsAttention.length })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
