import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import i18n from '@/i18n'

type PlanKey = 'starter' | 'pro' | 'team'
type StartMode = 'clean' | 'demo'

export function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const registerBenefits = t('auth.registerBenefits', { returnObjects: true }) as string[]
  const pricingPlans = t('landing.pricing.plans', { returnObjects: true }) as Array<{
    key: PlanKey
    name: string
    desc: string
    bestFor: string
    features: string[]
  }>

  const selectedPlanKey = (searchParams.get('plan') as PlanKey) || 'starter'
  const selectedMode = (searchParams.get('mode') as StartMode) || 'clean'
  const selectedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.key === selectedPlanKey) ?? pricingPlans[0],
    [pricingPlans, selectedPlanKey]
  )

  const updateParams = (next: Partial<{ plan: PlanKey; mode: StartMode }>) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('plan', next.plan ?? selectedPlanKey)
      updated.set('mode', next.mode ?? selectedMode)
      return updated
    })
  }

  const validate = (data: {
    full_name: string
    email: string
    password: string
    password_confirm: string
  }) => {
    const errors: Record<string, string> = {}
    if (data.full_name.length < 2) errors.full_name = t('auth.fullNameMinLength')
    if (!data.email.includes('@')) errors.email = t('auth.invalidEmail')
    if (data.password.length < 8) errors.password = t('auth.passwordMinLength')
    else if (!/[A-Z]/.test(data.password)) errors.password = t('auth.passwordUppercase')
    else if (!/[0-9]/.test(data.password)) errors.password = t('auth.passwordNumber')
    if (data.password !== data.password_confirm) errors.password_confirm = t('auth.passwordMismatch')
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError(null)
    const formData = new FormData(e.target as HTMLFormElement)
    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const password_confirm = formData.get('password_confirm') as string

    const errors = validate({ full_name, email, password, password_confirm })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone: phone || null,
            selected_plan: selectedPlan.key,
            workspace_mode: selectedMode,
            workspace_role: selectedPlan.key === 'team' ? 'leader' : 'distributor',
          },
          emailRedirectTo: `${window.location.origin}${ROUTES.EMAIL_CONFIRM}`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.emailAlreadyRegistered'))
        } else {
          setError(t('auth.registerError'))
        }
        setLoading(false)
        return
      }

      if (authData.session) {
        toast.success(t('auth.loginSuccess'))
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.EMAIL_CONFIRM, { replace: true })
      }
    } catch (err: unknown) {
      console.error('[RegisterPage] Error:', err)
      setError(t('auth.registerError'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="fixed right-4 top-4 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card/70 p-0.5 backdrop-blur-xl">
        <button
          onClick={() => i18n.changeLanguage('tr')}
          className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${currentLang === 'tr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🇹🇷 TR
        </button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${currentLang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🇺🇸 EN
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%)] p-8 shadow-[0_30px_80px_rgba(3,7,18,0.18)]">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">Network Marketing Master</span>
          </Link>

          <Badge variant="secondary" className="mt-8 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            {t('auth.selectedPlan')}
          </Badge>
          <h1 className="mt-6 max-w-xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {selectedPlan.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
            {selectedPlan.desc}
          </p>

          <div className="mt-8 rounded-[28px] border border-border/70 bg-background/55 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('auth.bestFor')}
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">{selectedPlan.bestFor}</p>
            <div className="mt-4 space-y-3">
              {selectedPlan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            {registerBenefits.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/45 p-4 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-border/70 bg-card/70 p-6 shadow-[0_24px_70px_rgba(3,7,18,0.14)] backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">{t('auth.createAccount')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('auth.registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error ? (
              <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{t('auth.planLabel')}</Label>
                <span className="text-xs text-muted-foreground">{t('auth.planHelp')}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {pricingPlans.map((plan) => (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => updateParams({ plan: plan.key })}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left transition-colors',
                      selectedPlan.key === plan.key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/70 bg-background/45 text-muted-foreground hover:border-primary/35 hover:text-foreground'
                    )}
                  >
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <p className="mt-1 text-xs">{plan.key === 'team' ? t('settings.roles.leader') : t('settings.roles.distributor')}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t('auth.startModeLabel')}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['clean', 'demo'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateParams({ mode })}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left transition-colors',
                      selectedMode === mode
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/70 bg-background/45 text-muted-foreground hover:border-primary/35 hover:text-foreground'
                    )}
                  >
                    <p className="text-sm font-semibold">{t(`auth.startModes.${mode}.title`)}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(`auth.startModes.${mode}.body`)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">{t('auth.fullName')}</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder={t('auth.namePlaceholder')}
                autoComplete="name"
              />
              {fieldErrors.full_name ? <p className="text-xs text-destructive">{fieldErrors.full_name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
              />
              {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                {t('auth.phone')} <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={t('auth.phonePlaceholder')}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="text-xs text-destructive">{fieldErrors.password}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirm">{t('auth.passwordConfirm')}</Label>
              <Input
                id="password_confirm"
                name="password_confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordConfirmPlaceholder')}
                autoComplete="new-password"
              />
              {fieldErrors.password_confirm ? <p className="text-xs text-destructive">{fieldErrors.password_confirm}</p> : null}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.creatingAccount') : t('auth.continueWithPlan', { plan: selectedPlan.name })}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            <Link to={`${ROUTES.REGISTER}?plan=starter&mode=demo`} className="text-sm font-medium text-primary hover:underline">
              {t('auth.demoCta')}
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to={`${ROUTES.LOGIN}?plan=${selectedPlan.key}&mode=${selectedMode}`} className="font-medium text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
