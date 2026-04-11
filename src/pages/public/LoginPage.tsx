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
import i18n from '@/i18n'

type PlanKey = 'starter' | 'pro' | 'team'
type StartMode = 'clean' | 'demo'

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const selectedPlanKey = (searchParams.get('plan') as PlanKey) || 'starter'
  const selectedMode = (searchParams.get('mode') as StartMode) || 'clean'
  const loginBenefits = t('auth.loginBenefits', { returnObjects: true }) as string[]
  const pricingPlans = t('landing.pricing.plans', { returnObjects: true }) as Array<{
    key: PlanKey
    name: string
    desc: string
  }>

  const selectedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.key === selectedPlanKey) ?? pricingPlans[0],
    [pricingPlans, selectedPlanKey]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError(t('auth.invalidCredentials'))
        } else if (error.message.includes('Email not confirmed')) {
          setError(t('auth.emailNotConfirmed'))
        } else {
          setError(t('auth.loginError'))
        }
        setLoading(false)
        return
      }

      toast.success(t('auth.loginSuccess'))
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err: unknown) {
      console.error('[LoginPage] Error:', err)
      setError(t('auth.loginError'))
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

      <div className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-[0.98fr_0.82fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)] p-8 shadow-[0_30px_80px_rgba(3,7,18,0.18)]">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">Network Marketing Master</span>
          </Link>

          <Badge variant="secondary" className="mt-8 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            {selectedMode === 'demo' ? t('auth.startModes.demo.title') : selectedPlan.name}
          </Badge>
          <h1 className="mt-6 max-w-xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {t('auth.loginPanelTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
            {t('auth.loginPanelBody')}
          </p>

          <div className="mt-8 rounded-[28px] border border-border/70 bg-background/55 p-5">
            <p className="text-sm font-semibold text-foreground">{t('auth.planApplied', { plan: selectedPlan.name })}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedPlan.desc}</p>
            {selectedMode === 'demo' ? (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-sm font-medium text-foreground">{t('auth.startModes.demo.title')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('auth.startModes.demo.body')}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 space-y-3">
            {loginBenefits.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/45 p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-border/70 bg-card/70 p-6 shadow-[0_24px_70px_rgba(3,7,18,0.14)] backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">{t('auth.login')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
                  {t('auth.forgotPasswordLink')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link to={`${ROUTES.REGISTER}?plan=${selectedPlan.key}&mode=demo`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Sparkles className="h-4 w-4" />
              {t('auth.demoCta')}
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link to={`${ROUTES.REGISTER}?plan=${selectedPlan.key}&mode=${selectedMode}`} className="font-medium text-primary hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
