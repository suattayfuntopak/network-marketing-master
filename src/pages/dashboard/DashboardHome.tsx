import { useMemo, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Users, TrendingUp, UserPlus, ArrowRight, Bell, CalendarDays, Phone, MessageCircle, Mail, MoreHorizontal, GraduationCap, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { BirthdayMessageDialog } from '@/components/dashboard/BirthdayMessageDialog'
import { useAuth } from '@/hooks/useAuth'
import { useAcademyContents } from '@/hooks/useAcademy'
import { useObjections } from '@/hooks/useObjections'
import { useContactCount, useContactsCreatedThisWeekCount, useContactsWithBirthdayToday, useRecentContacts, useContactStageCounts } from '@/hooks/useContacts'
import { useTodayFollowUpsCount, useFollowUpBuckets, useTodayAppointments } from '@/hooks/useCalendar'
import { APPOINTMENT_TYPE_COLORS } from '@/lib/calendar/constants'
import { fmtTime } from '@/lib/calendar/dateHelpers'
import { ROUTES } from '@/lib/constants'
import type { FollowUpActionType } from '@/lib/calendar/types'
import type { AcademyContent, Objection } from '@/lib/academy/types'
import type { BirthdayContact } from '@/lib/contacts/queries'

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

export function DashboardHome() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const userId = user?.id ?? ''
  const { t } = useTranslation()
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const dateLocale = currentLang === 'en' ? enUS : tr

  const { data: contactCount = 0 } = useContactCount(userId)
  const { data: contactsCreatedThisWeekCount = 0 } = useContactsCreatedThisWeekCount(userId)
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
              <CardTitle className="text-base">{t('dashboard.academyNotes')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.academyNotesHint')}</p>
            </div>
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex min-h-[220px] flex-col justify-between gap-5">
            {academySpotlight || objectionSpotlight ? (
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

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate(ROUTES.ACADEMY)}
                  >
                    {t('dashboard.openAcademy')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate(`${ROUTES.ACADEMY}/itirazlar`)}
                  >
                    {t('dashboard.openObjections')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
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
      {contactCount === 0 && (
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
