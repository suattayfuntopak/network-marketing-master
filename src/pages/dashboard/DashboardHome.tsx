import { Users, TrendingUp, MessageSquare, Target, ArrowRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { useAuth } from '@/hooks/useAuth'
import { useContactCount, useRecentContacts, usePendingFollowUps } from '@/hooks/useContacts'
import { ROUTES } from '@/lib/constants'

export function DashboardHome() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const userId = user?.id ?? ''
  const { t } = useTranslation()
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const dateLocale = currentLang === 'en' ? enUS : tr

  const { data: contactCount = 0 } = useContactCount(userId)
  const { data: recentContacts = [] } = useRecentContacts(userId)
  const { data: pendingFollowUps = [] } = usePendingFollowUps(userId)

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.activePipeline')}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.noPipeline')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.weeklyMessages')}
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.noMessages')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.monthlyGoal')}
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('dashboard.noGoalPercent')}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.noGoal')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.recentContacts')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.CONTACTS)}
              className="h-7 text-xs gap-1"
            >
              {t('common.all')}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentContacts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">{t('dashboard.noContacts')}</p>
                <Button
                  size="sm"
                  onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)}
                  className="gap-1.5"
                >
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

        {/* Pending follow ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.pendingFollowups')}</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pendingFollowUps.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">{t('dashboard.noPendingFollowups')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFollowUps.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                    className="flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium flex items-center justify-center shrink-0">
                        {contact.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{contact.full_name}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {contact.next_follow_up_at &&
                            formatDistanceToNow(new Date(contact.next_follow_up_at), { addSuffix: true, locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <StageBadge stage={contact.stage} />
                  </div>
                ))}
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
                <Target className="w-6 h-6 text-primary" />
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
    </div>
  )
}
