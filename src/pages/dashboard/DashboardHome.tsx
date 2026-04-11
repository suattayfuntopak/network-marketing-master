import { useMemo, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Users, TrendingUp, UserPlus, ArrowRight, Bell, CalendarDays, Phone, MessageCircle, Mail, MoreHorizontal, GraduationCap, Sparkles, Flame, Clock3, Compass, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { BirthdayMessageDialog } from '@/components/dashboard/BirthdayMessageDialog'
import { useAuth } from '@/hooks/useAuth'
import { useAcademyContents } from '@/hooks/useAcademy'
import { useObjections } from '@/hooks/useObjections'
import { useContactCount, useContacts, useContactsCreatedThisWeekCount, useContactsWithBirthdayToday, useRecentContacts, useContactStageCounts } from '@/hooks/useContacts'
import { useTodayFollowUpsCount, useFollowUpBuckets, useTodayAppointments } from '@/hooks/useCalendar'
import { APPOINTMENT_TYPE_COLORS } from '@/lib/calendar/constants'
import { fmtTime } from '@/lib/calendar/dateHelpers'
import { ROUTES } from '@/lib/constants'
import { buildDailyFocusSummary, type DailyFocusPriority } from '@/lib/dashboard/dailyFocus'
import { buildFieldSupportTargets } from '@/lib/dashboard/fieldSupport'
import { buildDashboardOnboarding } from '@/lib/dashboard/onboarding'
import { DEFAULT_FILTERS, DEFAULT_SORT } from '@/lib/contacts/types'
import type { FollowUpActionType } from '@/lib/calendar/types'
import type { AcademyContent, Objection } from '@/lib/academy/types'
import type { BirthdayContact } from '@/lib/contacts/queries'
import { getTodayAcademyReadCount } from '@/lib/academy/progress'

const STAGE_DOT_COLORS: Record<string, string> = {
  new: 'bg-gray-400',
  contacted: 'bg-blue-500',
  interested: 'bg-purple-500',
  presenting: 'bg-amber-500',
  thinking: 'bg-orange-500',
  joined: 'bg-emerald-500',
  lost: 'bg-red-500',
}

const ACTION_ICONS: Record<FollowUpActionType, React.ElementType> = {
  call: Phone, message: MessageCircle, email: Mail,
  visit: MoreHorizontal, send_info: MoreHorizontal, check_in: MoreHorizontal, other: MoreHorizontal,
}

const truncateText = (value: string | null | undefined, maxLength: number) => {
  if (!value) return ''
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

const getBirthdayAge = (birthday: string) => {
  const birthDate = new Date(birthday)
  if (Number.isNaN(birthDate.getTime())) return null
  return new Date().getFullYear() - birthDate.getFullYear()
}

interface AcademySpotlightItem {
  title: string
  summary: string
}

const FOCUS_MODE_META = {
  follow_ups: {
    icon: Clock3,
    tone: 'text-rose-300',
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
  },
  opportunities: {
    icon: Flame,
    tone: 'text-amber-300',
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  },
  new_reachouts: {
    icon: Compass,
    tone: 'text-sky-300',
    badge: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
  },
} as const

function getPriorityReason(priority: DailyFocusPriority, t: (key: string, options?: Record<string, unknown>) => string) {
  if (priority.reason === 'overdue_follow_up') {
    return t('dashboard.focus.reasons.overdue')
  }

  if (priority.reason === 'due_today') {
    return t('dashboard.focus.reasons.today')
  }

  if (priority.reason === 'presentation_window') {
    return t('dashboard.focus.reasons.presentation')
  }

  if (priority.reason === 'warm_opportunity') {
    return t('dashboard.focus.reasons.opportunity')
  }

  if (priority.reason === 'fresh_touch') {
    return t('dashboard.focus.reasons.freshTouch')
  }

  return t('dashboard.focus.reasons.newContact')
}

export function DashboardHome() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const userId = user?.id ?? ''
  const { t } = useTranslation()
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
  const { data: birthdaysToday = [] } = useContactsWithBirthdayToday(userId)
  const { data: recentContacts = [] } = useRecentContacts(userId)
  const { data: stageCounts = [] } = useContactStageCounts(userId)
  const { data: todayFollowUpsCount = 0 } = useTodayFollowUpsCount(userId)
  const { data: followUpBuckets } = useFollowUpBuckets(userId)
  const { data: todayAppointments = [] } = useTodayAppointments(userId)
  const { data: academyContents = [] } = useAcademyContents()
  const { data: objections = [] } = useObjections()
  const visitSeed = useMemo(() => Date.now(), [])
  const [birthdayDialogContact, setBirthdayDialogContact] = useState<BirthdayContact | null>(null)
  const allContacts = contactsResult?.data ?? []
  const academyTodayCount = getTodayAcademyReadCount()

  const dailyFocus = useMemo(
    () => buildDailyFocusSummary(allContacts, followUpBuckets),
    [allContacts, followUpBuckets]
  )

  const academySpotlight = useMemo<AcademySpotlightItem | null>(() => {
    const localizedAcademy = academyContents.filter((item) => item.language === currentLang)
    const academyPool = (localizedAcademy.length > 0 ? localizedAcademy : academyContents).map<AcademySpotlightItem>((item: AcademyContent) => ({
      title: item.title,
      summary: truncateText(item.summary || item.content, 170),
    }))

    if (academyPool.length === 0) return null
    return academyPool[visitSeed % academyPool.length]
  }, [academyContents, currentLang, visitSeed])

  const objectionSpotlight = useMemo<AcademySpotlightItem | null>(() => {
    const localizedObjections = objections.filter((item) => item.language === currentLang)
    const objectionPool = (localizedObjections.length > 0 ? localizedObjections : objections).map<AcademySpotlightItem>((item: Objection) => ({
      title: item.short_label || truncateText(item.objection_text, 70),
      summary: `${t('dashboard.suggestedResponse')}: ${truncateText(item.response_short || item.response_text, 150)}`,
    }))

    if (objectionPool.length === 0) return null
    return objectionPool[visitSeed % objectionPool.length]
  }, [currentLang, objections, t, visitSeed])

  const fieldSupportTargets = useMemo(
    () =>
      buildFieldSupportTargets({
        mode: dailyFocus.recommendedMode,
        academyContents,
        objections,
        language: currentLang,
      }),
    [academyContents, currentLang, dailyFocus.recommendedMode, objections]
  )

  const primaryPriority = dailyFocus.priorities[0] ?? null

  const primaryActionHref = primaryPriority
    ? `${ROUTES.CONTACTS}/${primaryPriority.contactId}`
    : dailyFocus.recommendedMode === 'follow_ups'
      ? `${ROUTES.CALENDAR}/takipler`
      : dailyFocus.recommendedMode === 'opportunities'
        ? ROUTES.PIPELINE
        : `${ROUTES.CONTACTS}/yeni`

  const gamePlanSteps = useMemo(() => {
    const nextCount =
      dailyFocus.recommendedMode === 'follow_ups'
        ? dailyFocus.warmOpportunities
        : dailyFocus.recommendedMode === 'opportunities'
          ? dailyFocus.newReachOuts
          : dailyFocus.urgentFollowUps

    return [
      {
        key: 'primary',
        value: t(`dashboard.focus.modes.${dailyFocus.recommendedMode}`),
        description: t(`dashboard.gamePlan.primary.${dailyFocus.recommendedMode}`),
      },
      {
        key: 'next',
        value: t('dashboard.gamePlan.next.value', { count: nextCount }),
        description: t(`dashboard.gamePlan.next.${dailyFocus.recommendedMode}`, { count: nextCount }),
      },
      {
        key: 'stability',
        value: t('dashboard.gamePlan.stability.value'),
        description: t(`dashboard.gamePlan.stability.${dailyFocus.recommendedMode}`),
      },
    ] as const
  }, [
    dailyFocus.newReachOuts,
    dailyFocus.recommendedMode,
    dailyFocus.urgentFollowUps,
    dailyFocus.warmOpportunities,
    t,
  ])

  const supportCards = useMemo(() => {
    const cards = []

    if (fieldSupportTargets.academy) {
      cards.push({
        key: `academy-${fieldSupportTargets.academy.id}`,
        label: t('dashboard.support.labels.academy'),
        title: fieldSupportTargets.academy.title,
        summary: truncateText(fieldSupportTargets.academy.summary || fieldSupportTargets.academy.content, 165),
        reason: t(`dashboard.support.academyReasons.${dailyFocus.recommendedMode}`),
        actionLabel: t('dashboard.support.openAcademyItem'),
        action: () => navigate(`${ROUTES.ACADEMY}/${fieldSupportTargets.academy?.id}`),
        tone: 'border-emerald-500/15 bg-emerald-500/8 text-emerald-100',
      })
    }

    if (fieldSupportTargets.objection) {
      cards.push({
        key: `objection-${fieldSupportTargets.objection.id}`,
        label: t('dashboard.support.labels.objection'),
        title: fieldSupportTargets.objection.short_label || truncateText(fieldSupportTargets.objection.objection_text, 70),
        summary: truncateText(fieldSupportTargets.objection.response_short || fieldSupportTargets.objection.response_text, 165),
        reason: t(`dashboard.support.objectionReasons.${dailyFocus.recommendedMode}`),
        actionLabel: t('dashboard.support.openObjectionItem'),
        action: () => navigate(`${ROUTES.ACADEMY}/itirazlar`),
        tone: 'border-sky-500/15 bg-sky-500/8 text-sky-100',
      })
    }

    cards.push({
      key: 'coach-note',
      label: t('dashboard.support.labels.coach'),
      title: t(`dashboard.support.coachTitles.${dailyFocus.recommendedMode}`),
      summary: t(`dashboard.support.coachSummaries.${dailyFocus.recommendedMode}`),
      reason: t('dashboard.support.coachReason'),
      actionLabel: t('dashboard.support.openAcademy'),
      action: () => navigate(ROUTES.ACADEMY),
      tone: 'border-amber-500/15 bg-amber-500/8 text-amber-100',
    })

    return cards.slice(0, 3)
  }, [dailyFocus.recommendedMode, fieldSupportTargets.academy, fieldSupportTargets.objection, navigate, t])

  const onboarding = useMemo(
    () =>
      buildDashboardOnboarding({
        profileName: profile?.full_name,
        contactCount,
        followUpCount: followUpBuckets?.all.length ?? 0,
        academyTodayCount,
      }),
    [academyTodayCount, contactCount, followUpBuckets?.all.length, profile?.full_name]
  )

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: profile?.full_name?.split(' ')[0] ?? t('profile.user') })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.welcomeSubtitle')}
        </p>
      </div>

      <OnboardingChecklist
        summary={onboarding}
        firstName={profile?.full_name?.split(' ')[0] ?? null}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%)]">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                  {t('dashboard.gamePlan.label')}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{t('dashboard.gamePlan.title')}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('dashboard.gamePlan.subtitle')}
                </p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {t(`dashboard.focus.modes.${dailyFocus.recommendedMode}`)}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {gamePlanSteps.map((step) => (
                <div key={step.key} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t(`dashboard.gamePlan.steps.${step.key}`)}
                  </p>
                  <p className="mt-3 text-sm font-semibold">{step.value}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="gap-1.5" onClick={() => navigate(primaryActionHref)}>
                {t('dashboard.gamePlan.primaryAction')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}>
                {t('dashboard.gamePlan.openCalendar')}
              </Button>
              <Button variant="ghost" className="gap-1.5" onClick={() => navigate(ROUTES.ACADEMY)}>
                {t('dashboard.gamePlan.openAcademy')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('dashboard.support.title')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.support.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {supportCards.slice(0, 2).map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={card.action}
                className="w-full rounded-2xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:border-primary/25 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${card.tone}`}>
                      {card.label}
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-6">{card.title}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.summary}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                </div>
              </button>
            ))}

            <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('dashboard.support.coachLabel')}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`dashboard.support.coachSummaries.${dailyFocus.recommendedMode}`)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate(ROUTES.CONTACTS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalContacts')}
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {contactCount === 0 ? t('dashboard.noContacts') : t('dashboard.activeContacts')}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate(ROUTES.CONTACTS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.addedThisWeek')}
            </CardTitle>
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsCreatedThisWeekCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {contactsCreatedThisWeekCount > 0
                ? t('dashboard.candidatesAddedThisWeek', { count: contactsCreatedThisWeekCount })
                : t('dashboard.noCandidatesAddedThisWeek')}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate(ROUTES.PIPELINE)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.activePipeline')}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            {stageCounts.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">{t('dashboard.noPipeline')}</p>
            ) : (
              <div className="space-y-1 mt-1">
                {stageCounts.filter(s => s.count > 0).slice(0, 5).map(({ stage, count }) => (
                  <div key={stage} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT_COLORS[stage] ?? 'bg-gray-400'}`} />
                      <span className="text-xs text-muted-foreground truncate">{t(`pipelineStages.${stage}`)}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.todayFollowUpsCount')}
            </CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayFollowUpsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(followUpBuckets?.overdue?.length ?? 0) > 0
                ? t('dashboard.overdueFollowUps', { count: followUpBuckets?.overdue?.length })
                : t('dashboard.noOverdueFollowUps')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base">{t('dashboard.focus.title')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.focus.subtitle')}</p>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {t(`dashboard.focus.modes.${dailyFocus.recommendedMode}`)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/6 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                    {t('dashboard.focus.commandLabel')}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug">
                    {t(`dashboard.focus.headlines.${dailyFocus.recommendedMode}`, {
                      count:
                        dailyFocus.recommendedMode === 'follow_ups'
                          ? dailyFocus.urgentFollowUps
                          : dailyFocus.recommendedMode === 'opportunities'
                            ? dailyFocus.warmOpportunities
                            : dailyFocus.newReachOuts,
                    })}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`dashboard.focus.summaries.${dailyFocus.recommendedMode}`, {
                      urgent: dailyFocus.urgentFollowUps,
                      opportunities: dailyFocus.warmOpportunities,
                      newReachOuts: dailyFocus.newReachOuts,
                    })}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-card/70 text-primary">
                  {(() => {
                    const FocusIcon = FOCUS_MODE_META[dailyFocus.recommendedMode].icon
                    return <FocusIcon className="h-5 w-5" />
                  })()}
                </div>
              </div>
            </div>

            {dailyFocus.priorities.length > 0 ? (
              <div className="space-y-3">
                {dailyFocus.priorities.map((item) => (
                  <button
                    key={item.contactId}
                    type="button"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${item.contactId}`)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left transition-all hover:border-primary/25 hover:bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{item.contactName}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${FOCUS_MODE_META[item.mode].badge}`}>
                          {t(`dashboard.focus.modes.${item.mode}`)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{getPriorityReason(item, t)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StageBadge stage={item.stage as BirthdayContact['stage']} />
                        {item.warmthScore > 0 ? <WarmthScoreBadge score={item.warmthScore} /> : null}
                        {(item.city || item.occupation) ? (
                          <span className="text-xs text-muted-foreground">
                            {item.occupation || item.city}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5 text-xs font-medium text-primary">
                      <span>{t('dashboard.focus.openContact')}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
                {t('dashboard.focus.empty')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('dashboard.focus.rhythmTitle')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.focus.rhythmSubtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              {
                key: 'urgentFollowUps',
                icon: Clock3,
                value: dailyFocus.urgentFollowUps,
                tone: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
              },
              {
                key: 'warmOpportunities',
                icon: Flame,
                value: dailyFocus.warmOpportunities,
                tone: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
              },
              {
                key: 'newReachOuts',
                icon: Compass,
                value: dailyFocus.newReachOuts,
                tone: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
              },
            ] as const).map(({ key, icon: Icon, value, tone }) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t(`dashboard.focus.metrics.${key}.title`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`dashboard.focus.metrics.${key}.hint`)}</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold tabular-nums">{value}</span>
              </div>
            ))}

            <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('dashboard.focus.playbookLabel')}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`dashboard.focus.playbooks.${dailyFocus.recommendedMode}`)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.recentContacts')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CONTACTS)} className="h-7 text-xs gap-1">
              {t('common.all')} <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentContacts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">{t('dashboard.noContacts')}</p>
                <Button size="sm" onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)} className="gap-1.5">
                  {t('dashboard.addFirstContact')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                    className="flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                        {contact.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{contact.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true, locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StageBadge stage={contact.stage} />
                      <WarmthScoreBadge score={contact.warmth_score} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.todayAppointments')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CALENDAR)} className="h-7 text-xs gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">{t('dashboard.noTodayAppointments')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayAppointments.map((apt) => {
                  const colors = APPOINTMENT_TYPE_COLORS[apt.type] ?? APPOINTMENT_TYPE_COLORS.other
                  return (
                    <div
                      key={apt.id}
                      onClick={() => navigate(ROUTES.CALENDAR)}
                      className="flex items-start gap-2.5 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${colors}`}>
                        {apt.type[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.all_day ? t('calendar.appointment.allDay') : `${fmtTime(apt.starts_at)} – ${fmtTime(apt.ends_at)}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Follow-ups (real nmm_follow_ups data) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.todayFollowUps')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)} className="h-7 text-xs gap-1">
              <Bell className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {(followUpBuckets?.today?.length ?? 0) === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">{t('dashboard.noPendingFollowups')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(followUpBuckets?.today ?? []).slice(0, 5).map((fu) => {
                  const Icon = ACTION_ICONS[fu.action_type] ?? MoreHorizontal
                  const initials = fu.contact.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div
                      key={fu.id}
                      onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}
                      className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{fu.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {t(`followUps.actionTypes.${fu.action_type}`)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base">{t('dashboard.support.title')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.support.subtitle')}</p>
            </div>
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex min-h-[220px] flex-col justify-between gap-5">
            {supportCards.length > 0 ? (
              <div className="space-y-3">
                {supportCards.map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    onClick={card.action}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-4 text-left transition-all hover:border-primary/25 hover:bg-muted/20"
                  >
                    <div className="min-w-0">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${card.tone}`}>
                        {card.label}
                      </span>
                      <h3 className="mt-3 text-sm font-semibold leading-6">{card.title}</h3>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.reason}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.summary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5 text-xs font-medium text-primary">
                      <span>{card.actionLabel}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            ) : academySpotlight || objectionSpotlight ? (
              <div className="flex h-full flex-col justify-between gap-5">
                <div className="space-y-4">
                  {academySpotlight && (
                    <div>
                      <h3 className="text-lg font-semibold leading-snug">{academySpotlight.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{academySpotlight.summary}</p>
                    </div>
                  )}

                  {academySpotlight && objectionSpotlight && <div className="border-t border-border" />}

                  {objectionSpotlight && (
                    <div>
                      <h3 className="text-lg font-semibold leading-snug">{objectionSpotlight.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{objectionSpotlight.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[180px] items-center justify-center text-center text-sm text-muted-foreground">
                {t('dashboard.noAcademyNotes')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base">{t('dashboard.todayBirthdays')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.todayBirthdaysHint')}</p>
            </div>
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="min-h-[220px]">
            {birthdaysToday.length === 0 ? (
              <div className="flex min-h-[180px] items-center justify-center text-center text-sm text-muted-foreground">
                {t('dashboard.noBirthdaysToday')}
              </div>
            ) : (
              <div className="space-y-3">
                {birthdaysToday.slice(0, 4).map((contact: BirthdayContact) => {
                  const age = getBirthdayAge(contact.birthday)
                  return (
                    <div
                      key={contact.id}
                      onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:bg-muted/30 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {contact.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{contact.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(contact.birthday), 'd MMMM', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {age !== null && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {t('dashboard.turnsAge', { age })}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-full px-3 text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            setBirthdayDialogContact(contact)
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {t('dashboard.generateBirthdayMessage')}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA (only when no contacts) */}
      {contactCount === 0 && !onboarding.show && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('dashboard.ctaTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('dashboard.ctaText')}
                </p>
                <Button
                  className="mt-3 gap-1.5"
                  onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)}
                >
                  {t('dashboard.addFirstContact')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <BirthdayMessageDialog
        open={birthdayDialogContact !== null}
        contact={birthdayDialogContact}
        onClose={() => setBirthdayDialogContact(null)}
      />
    </div>
  )
}
