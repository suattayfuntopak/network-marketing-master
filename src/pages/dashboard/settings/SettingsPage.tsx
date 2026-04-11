import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Globe, Shield, LogOut, Bell, HelpCircle, MessageSquare, Sparkles, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import i18n from '@/i18n'

type SettingsSection = 'profile' | 'settings' | 'notifications' | 'support' | 'feedback' | 'account'

const SECTION_ORDER: SettingsSection[] = ['profile', 'settings', 'notifications', 'support', 'feedback', 'account']

export function SettingsPage() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const setProfile = useAuthStore((s) => s.setProfile)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { requestPermission, showNotification, permission } = useNotifications()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [feedbackDraft, setFeedbackDraft] = useState(() => localStorage.getItem('nmm-feedback-draft') ?? '')
  const sectionRefs = useRef<Record<SettingsSection, HTMLDivElement | null>>({
    profile: null,
    settings: null,
    notifications: null,
    support: null,
    feedback: null,
    account: null,
  })

  const currentSection = useMemo<SettingsSection>(() => {
    const section = searchParams.get('section')
    return SECTION_ORDER.includes(section as SettingsSection) ? (section as SettingsSection) : 'profile'
  }, [searchParams])

  useEffect(() => {
    localStorage.setItem('nmm-feedback-draft', feedbackDraft)
  }, [feedbackDraft])

  useEffect(() => {
    const node = sectionRefs.current[currentSection]
    if (!node) return
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [currentSection])

  const setSectionRef = (section: SettingsSection) => (node: HTMLDivElement | null) => {
    sectionRefs.current[section] = node
  }

  const openSection = (section: SettingsSection) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('section', section)
      return next
    })
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !user?.id || saving) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('nmm_profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      if (data) setProfile(data)
      toast.success(t('settings.saved'))
    } catch (err) {
      console.error('[SettingsPage] profile update error:', err)
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    i18n.changeLanguage(lang)
    if (user?.id) {
      supabase.from('nmm_profiles').update({ language: lang }).eq('id', user.id)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    if (granted) {
      toast.success(t('settings.notifications.enabled'))
      showNotification(t('settings.notifications.testTitle'), {
        body: t('settings.notifications.testBody'),
      })
      return
    }
    toast.error(
      permission === 'denied'
        ? t('settings.notifications.denied')
        : t('settings.notifications.unavailable')
    )
  }

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      toast.error(t('settings.notifications.enableFirst'))
      return
    }

    showNotification(t('settings.notifications.testTitle'), {
      body: t('settings.notifications.testBody'),
    })
    toast.success(t('settings.notifications.sent'))
  }

  const handleCopyFeedback = async () => {
    const summary = [
      `${t('settings.feedback.templateTitle')}:`,
      feedbackDraft.trim() || t('settings.feedback.placeholder'),
      '',
      `${t('settings.language')}: ${currentLang === 'tr' ? 'Türkçe' : 'English'}`,
      `${t('settings.role')}: ${localizedRole}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(summary)
      toast.success(t('settings.feedback.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleUseFeedbackTemplate = () => {
    setFeedbackDraft(t('settings.feedback.template'))
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const roleKey = `settings.roles.${profile?.role ?? 'distributor'}`
  const localizedRole = t(roleKey, { defaultValue: t('settings.roles.distributor') })
  const membershipPlan = (user?.user_metadata?.selected_plan as 'starter' | 'pro' | 'team' | undefined) ?? 'starter'
  const workspaceMode = (user?.user_metadata?.workspace_mode as 'clean' | 'demo' | undefined) ?? 'clean'
  const permissionTone =
    permission === 'granted'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
      : permission === 'denied'
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
        : 'border-amber-500/20 bg-amber-500/10 text-amber-100'

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_30%)]">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.controlCenter.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('settings.controlCenter.subtitle')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'profile' as const, icon: User },
              { key: 'settings' as const, icon: Globe },
              { key: 'notifications' as const, icon: Bell },
              { key: 'support' as const, icon: HelpCircle },
              { key: 'feedback' as const, icon: MessageSquare },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => openSection(key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                  currentSection === key
                    ? 'border-primary bg-primary/12 text-primary'
                    : 'border-border/70 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`settings.sections.${key}`)}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('settings.controlCenter.nextLabel')}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(`settings.controlCenter.nextMove.${currentSection}`)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card ref={setSectionRef('profile')} className={currentSection === 'profile' ? 'border-primary/35' : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('settings.email')}</Label>
            <Input id="email" value={user?.email ?? ''} disabled className="text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t('settings.fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('settings.fullNamePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.role')}</Label>
            <p className="text-sm text-muted-foreground">{localizedRole}</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || !fullName.trim()}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </CardContent>
      </Card>

      <Card ref={setSectionRef('settings')} className={currentSection === 'settings' ? 'border-primary/35' : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                currentLang === 'tr'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              🇹🇷 Türkçe
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                currentLang === 'en'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </CardContent>
      </Card>

      <Card ref={setSectionRef('notifications')} className={currentSection === 'notifications' ? 'border-primary/35' : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('profile.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={permissionTone}>{t(`settings.notifications.status.${permission}`)}</Badge>
            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {t('settings.notifications.ready')}
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{t('settings.notifications.description')}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleEnableNotifications()} className="gap-2">
              <Bell className="w-4 h-4" />
              {t('settings.notifications.enableAction')}
            </Button>
            <Button variant="outline" onClick={handleTestNotification} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {t('settings.notifications.testAction')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card ref={setSectionRef('support')} className={currentSection === 'support' ? 'border-primary/35' : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {t('profile.help')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">{t('settings.support.description')}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                key: 'academy',
                action: () => navigate(ROUTES.ACADEMY),
              },
              {
                key: 'objections',
                action: () => navigate(`${ROUTES.ACADEMY}/itirazlar`),
              },
              {
                key: 'followUps',
                action: () => navigate(`${ROUTES.CALENDAR}/takipler`),
              },
            ].map(({ key, action }) => (
              <button
                key={key}
                onClick={action}
                className="rounded-2xl border border-border/70 bg-card/60 p-4 text-left transition-colors hover:border-primary/35 hover:bg-card"
              >
                <p className="text-sm font-semibold">{t(`settings.support.cards.${key}.title`)}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t(`settings.support.cards.${key}.body`)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card ref={setSectionRef('feedback')} className={currentSection === 'feedback' ? 'border-primary/35' : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t('profile.feedback')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">{t('settings.feedback.description')}</p>
          <Textarea
            value={feedbackDraft}
            onChange={(event) => setFeedbackDraft(event.target.value)}
            placeholder={t('settings.feedback.placeholder')}
            className="min-h-32"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleUseFeedbackTemplate} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {t('settings.feedback.templateAction')}
            </Button>
            <Button onClick={() => void handleCopyFeedback()} className="gap-2">
              <Copy className="w-4 h-4" />
              {t('settings.feedback.copyAction')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card ref={setSectionRef('account')} className={currentSection === 'account' ? 'border-primary/35' : undefined}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('settings.account')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                {t(`settings.membership.plans.${membershipPlan}.name`)}
              </Badge>
              <Badge variant="outline">
                {t(`settings.membership.modes.${workspaceMode}`)}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t(`settings.membership.plans.${membershipPlan}.body`)}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate(`${ROUTES.HOME}#pricing`)}
            >
              {t('settings.membership.action')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t('settings.accountInfo')}</p>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive border-destructive/30"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
