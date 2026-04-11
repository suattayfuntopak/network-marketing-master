import { useMemo } from 'react'
import type { ElementType } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { useAuth } from '@/hooks/useAuth'
import { useContactCount, useContacts, useContactsCreatedThisWeekCount, useRecentContacts, useContactStageCounts } from '@/hooks/useContacts'
import { useFollowUpBuckets, useTodayAppointments, useTodayFollowUpsCount } from '@/hooks/useCalendar'
import { APPOINTMENT_TYPE_COLORS } from '@/lib/calendar/constants'
import { fmtTime } from '@/lib/calendar/dateHelpers'
import { ROUTES } from '@/lib/constants'
import { buildDailyFocusSummary, type DailyFocusPriority } from '@/lib/dashboard/dailyFocus'
import { buildDashboardOnboarding } from '@/lib/dashboard/onboarding'
import { DEFAULT_FILTERS, DEFAULT_SORT } from '@/lib/contacts/types'
import type { FollowUpActionType } from '@/lib/calendar/types'
import type { Contact } from '@/types/database'

const STAGE_DOT_COLORS: Record<string, string> = {
  new: 'bg-gray-400',
  contacted: 'bg-blue-500',
  interested: 'bg-purple-500',
  presenting: 'bg-amber-500',
  thinking: 'bg-orange-500',
  joined: 'bg-emerald-500',
  lost: 'bg-red-500',
}

const ACTION_ICONS: Record<FollowUpActionType, ElementType> = {
  call: Phone,
  message: MessageCircle,
  email: Mail,
  visit: MoreHorizontal,
  send_info: MoreHorizontal,
  check_in: MoreHorizontal,
  other: MoreHorizontal,
}

function getPriorityReason(priority: DailyFocusPriority, t: (key: string) => string) {
  if (priority.reason === 'overdue_follow_up') return t('dashboard.focus.reasons.overdue')
  if (priority.reason === 'due_today') return t('dashboard.focus.reasons.today')
  if (priority.reason === 'presentation_window') return t('dashboard.focus.reasons.presentation')
  if (priority.reason === 'warm_opportunity') return t('dashboard.focus.reasons.opportunity')
  if (priority.reason === 'fresh_touch') return t('dashboard.focus.reasons.freshTouch')
  return t('dashboard.focus.reasons.newContact')
}

export function DashboardHome() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const { t } = useTranslation()
  const userId = user?.id ?? ''
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const dateLocale = currentLang === 'en' ? enUS : tr

  const { data: contactCount = 0 } = useContactCount(userId)
  const { data: contactsCreatedThisWeekCount = 0 } = useContactsCreatedThisWeekCount(userId)
  const { data: contactsResult } = useContacts({
    userId,
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: 500,
  })
  const { data: recentContacts = [] } = useRecentContacts(userId)
  const { data: stageCounts = [] } = useContactStageCounts(userId)
  const { data: todayFollowUpsCount = 0 } = useTodayFollowUpsCount(userId)
  const { data: followUpBuckets } = useFollowUpBuckets(userId)
  const { data: todayAppointments = [] } = useTodayAppointments(userId)

  const allContacts = contactsResult?.data ?? []
  const dailyFocus = useMemo(
    () => buildDailyFocusSummary(allContacts, followUpBuckets),
    [allContacts, followUpBuckets]
  )

  const onboarding = useMemo(
    () =>
      buildDashboardOnboarding({
        profileName: profile?.full_name,
        contactCount,
        followUpCount: followUpBuckets?.all.length ?? 0,
        academyTodayCount: 0,
      }),
    [contactCount, followUpBuckets?.all.length, profile?.full_name]
  )

  const overdueCount = followUpBuckets?.overdue?.length ?? 0
  const pendingFollowUps = followUpBuckets?.all.length ?? 0
  const focusCount =
    dailyFocus.recommendedMode === 'follow_ups'
      ? dailyFocus.urgentFollowUps
      : dailyFocus.recommendedMode === 'opportunities'
        ? dailyFocus.warmOpportunities
        : dailyFocus.newReachOuts

  const primaryActionHref =
    dailyFocus.priorities[0]
      ? `${ROUTES.CONTACTS}/${dailyFocus.priorities[0].contactId}`
      : dailyFocus.recommendedMode === 'follow_ups'
        ? `${ROUTES.CALENDAR}/takipler`
        : dailyFocus.recommendedMode === 'opportunities'
          ? ROUTES.PIPELINE
          : `${ROUTES.CONTACTS}/yeni`

  const compactStageCounts = useMemo(
    () => stageCounts.filter((item) => item.count > 0).slice(0, 4),
    [stageCounts]
  )

  const stageTotal = useMemo(
    () => stageCounts.reduce((sum, item) => sum + item.count, 0),
    [stageCounts]
  )

  const topStage = useMemo(() => {
    return [...stageCounts].sort((a, b) => b.count - a.count)[0] ?? null
  }, [stageCounts])

  const quickActions = [
    { key: 'contacts', href: `${ROUTES.CONTACTS}/yeni` },
    { key: 'pipeline', href: ROUTES.PIPELINE },
    { key: 'calendar', href: `${ROUTES.CALENDAR}/takipler` },
    { key: 'messages', href: ROUTES.MESSAGES },
  ] as const

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: profile?.full_name?.split(' ')[0] ?? t('profile.user') })}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('dashboard.welcomeSubtitle')}</p>
      </div>

      <OnboardingChecklist
        summary={onboarding}
        firstName={profile?.full_name?.split(' ')[0] ?? null}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="cursor-pointer rounded-3xl border-border/70 bg-card/70 transition-colors hover:border-primary/30" onClick={() => navigate(ROUTES.CONTACTS)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totalContacts')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contactCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {contactsCreatedThisWeekCount > 0
                ? t('dashboard.candidatesAddedThisWeek', { count: contactsCreatedThisWeekCount })
                : t('dashboard.activeContacts')}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer rounded-3xl border-border/70 bg-card/70 transition-colors hover:border-primary/30" onClick={() => navigate(ROUTES.CALENDAR)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.todayAppointments')}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayAppointments.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {todayAppointments.length > 0 ? t('dashboard.stats.appointmentsHint') : t('dashboard.noTodayAppointments')}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer rounded-3xl border-border/70 bg-card/70 transition-colors hover:border-primary/30" onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.todayFollowUpsCount')}</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingFollowUps}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {overdueCount > 0
                ? t('dashboard.overdueFollowUps', { count: overdueCount })
                : t('dashboard.stats.followUpsHint', { count: todayFollowUpsCount })}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer rounded-3xl border-border/70 bg-card/70 transition-colors hover:border-primary/30" onClick={() => navigate(ROUTES.PIPELINE)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stageSummary.title')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stageTotal}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {topStage
                ? t('dashboard.stageSummary.hint', { stage: t(`pipelineStages.${topStage.stage}`), count: topStage.count })
                : t('dashboard.stageSummary.empty')}
            </p>
            {compactStageCounts.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {compactStageCounts.map(({ stage, count }) => (
                  <div key={stage} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${STAGE_DOT_COLORS[stage] ?? 'bg-gray-400'}`} />
                      <span className="truncate text-xs text-muted-foreground">{t(`pipelineStages.${stage}`)}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-3xl border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)]">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              {t('dashboard.priority.title')}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t('dashboard.priority.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                {t('dashboard.focus.commandLabel')}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {t(`dashboard.focus.headlines.${dailyFocus.recommendedMode}`, { count: focusCount })}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`dashboard.focus.summaries.${dailyFocus.recommendedMode}`, {
                  urgent: dailyFocus.urgentFollowUps,
                  opportunities: dailyFocus.warmOpportunities,
                  newReachOuts: dailyFocus.newReachOuts,
                })}
              </p>
            </div>

            {dailyFocus.priorities.length > 0 ? (
              <div className="space-y-3">
                {dailyFocus.priorities.slice(0, 3).map((item) => (
                  <button
                    key={item.contactId}
                    type="button"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${item.contactId}`)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.contactName}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{getPriorityReason(item, t)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StageBadge stage={item.stage as Contact['stage']} />
                        {item.warmthScore > 0 ? <WarmthScoreBadge score={item.warmthScore} /> : null}
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                {t('dashboard.focus.empty')}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button className="gap-1.5" onClick={() => navigate(primaryActionHref)}>
                {t('dashboard.priority.primaryAction')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate(ROUTES.PIPELINE)}>
                {t('dashboard.priority.openPipeline')}
              </Button>
              <Button variant="ghost" onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)}>
                {t('dashboard.addFirstContact')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              {t('dashboard.agenda.title')}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t('dashboard.agenda.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{t('dashboard.agenda.appointments')}</p>
                <span className="rounded-full border border-border/70 bg-card/60 px-2 py-0.5 text-xs font-medium">
                  {todayAppointments.length}
                </span>
              </div>

              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  {todayAppointments.slice(0, 3).map((appointment) => {
                    const colors = APPOINTMENT_TYPE_COLORS[appointment.type] ?? APPOINTMENT_TYPE_COLORS.other
                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => navigate(ROUTES.CALENDAR)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-3 py-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colors}`}>
                          {appointment.type[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{appointment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.all_day ? t('calendar.appointment.allDay') : `${fmtTime(appointment.starts_at)} – ${fmtTime(appointment.ends_at)}`}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-5 text-sm text-muted-foreground">
                  {t('dashboard.noTodayAppointments')}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{t('dashboard.agenda.followUps')}</p>
                <span className="rounded-full border border-border/70 bg-card/60 px-2 py-0.5 text-xs font-medium">
                  {pendingFollowUps}
                </span>
              </div>

              {(followUpBuckets?.today?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {(followUpBuckets?.today ?? []).slice(0, 3).map((followUp) => {
                    const Icon = ACTION_ICONS[followUp.action_type] ?? MoreHorizontal
                    return (
                      <button
                        key={followUp.id}
                        type="button"
                        onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-3 py-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{followUp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {followUp.contact.full_name}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-5 text-sm text-muted-foreground">
                  {t('dashboard.noPendingFollowups')}
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}>
              {t('dashboard.agenda.openFollowUps')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.recentContacts')}</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => navigate(ROUTES.CONTACTS)}>
              {t('common.all')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentContacts.length > 0 ? (
              <div className="space-y-3">
                {recentContacts.slice(0, 5).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/55 px-3 py-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{contact.full_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StageBadge stage={contact.stage} />
                      <WarmthScoreBadge score={contact.warmth_score} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-sm text-muted-foreground">
                {t('dashboard.noContacts')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('dashboard.quickActions.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('dashboard.quickActions.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.key}
                  variant="outline"
                  className="justify-between"
                  onClick={() => navigate(action.href)}
                >
                  {t(`dashboard.quickActions.items.${action.key}`)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('dashboard.focus.rhythmTitle')}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.focus.metrics.urgentFollowUps.title')}</p>
                  <p className="mt-2 text-2xl font-semibold">{dailyFocus.urgentFollowUps}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.focus.metrics.warmOpportunities.title')}</p>
                  <p className="mt-2 text-2xl font-semibold">{dailyFocus.warmOpportunities}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.focus.metrics.newReachOuts.title')}</p>
                  <p className="mt-2 text-2xl font-semibold">{dailyFocus.newReachOuts}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {contactCount === 0 && !onboarding.show ? (
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('dashboard.ctaTitle')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.ctaText')}</p>
                <Button className="mt-3 gap-1.5" onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)}>
                  {t('dashboard.addFirstContact')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
