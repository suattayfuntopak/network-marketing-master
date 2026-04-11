import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart2,
  Bell,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  GitMerge,
  LayoutDashboard,
  MessageSquare,
  Moon,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  Thermometer,
  Users2,
  Zap,
  CalendarRange,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import i18n from '@/i18n'

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border/70 last:border-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium transition-colors hover:text-primary"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {open ? <p className="pb-5 text-sm leading-7 text-muted-foreground">{a}</p> : null}
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string
  title: string
  subtitle: string
  center?: boolean
}) {
  return (
    <div className={cn('space-y-3', center && 'text-center')}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className={cn('max-w-3xl text-base leading-7 text-muted-foreground', center && 'mx-auto')}>
        {subtitle}
      </p>
    </div>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const heroTrust = t('landing.hero.trust', { returnObjects: true }) as string[]
  const heroTasks = t('landing.hero.panel.tasks', { returnObjects: true }) as Array<{ state: string; title: string; meta: string }>
  const heroPills = t('landing.hero.panel.systemPills', { returnObjects: true }) as string[]
  const proofItems = t('landing.proof.items', { returnObjects: true }) as Array<{ title: string; desc: string }>
  const problemItems = t('landing.problems.items', { returnObjects: true }) as Array<{ title: string; desc: string }>
  const newcomerItems = t('landing.newcomers.items', { returnObjects: true }) as Array<{ title: string; desc: string }>
  const systemItems = t('landing.system.items', { returnObjects: true }) as Array<{ label: string; title: string; desc: string }>
  const workflowSteps = t('landing.workflow.steps', { returnObjects: true }) as Array<{ title: string; desc: string }>
  const comparisonBefore = t('landing.comparison.before.items', { returnObjects: true }) as string[]
  const comparisonAfter = t('landing.comparison.after.items', { returnObjects: true }) as string[]
  const pricingPlans = t('landing.pricing.plans', { returnObjects: true }) as Array<{
    name: string
    price: string
    period: string
    desc: string
    features: string[]
    cta: string
  }>
  const faqItems = t('landing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>

  const proofIcons = [Target, Sparkles, ShieldAlert]
  const newcomerIcons = [Compass, Thermometer, CheckCircle]
  const systemIcons = [
    LayoutDashboard,
    Target,
    GitMerge,
    MessageSquare,
    BookOpen,
    Users2,
    BarChart2,
    CalendarRange,
    Bell,
  ]
  const workflowIcons = [Users2, Target, MessageSquare, Activity]
  const highlightedPlanIndex = 1

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_24px_rgba(45,212,191,0.18)]">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">Network Marketing Master</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">{t('landing.nav.features')}</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">{t('landing.nav.pricing')}</a>
            <a href="#faq" className="transition-colors hover:text-foreground">{t('landing.nav.faq')}</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-card/70 p-0.5 shadow-[0_12px_30px_rgba(3,7,18,0.12)]">
              <button
                onClick={() => i18n.changeLanguage('tr')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  currentLang === 'tr'
                    ? 'bg-primary text-primary-foreground shadow-[0_0_16px_rgba(45,212,191,0.22)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Türkçe"
              >
                🇹🇷 TR
              </button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  currentLang === 'en'
                    ? 'bg-primary text-primary-foreground shadow-[0_0_16px_rgba(45,212,191,0.22)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="English"
              >
                🇺🇸 EN
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full border border-transparent hover:border-border/70 hover:bg-card/70"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">{t('landing.nav.login')}</Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button size="sm">{t('landing.nav.start')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/8 via-transparent to-transparent" />

        <div className="relative mx-auto grid w-full max-w-[1440px] gap-12 px-4 py-18 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              {t('landing.hero.badge')}
            </Badge>

            <h1 className="mt-6 max-w-4xl font-heading text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              {t('landing.hero.title')}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-muted-foreground sm:text-2xl">
              {t('landing.hero.subtitle')}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {t('landing.hero.body')}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  {t('landing.hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-muted-foreground">
              {heroTrust.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-8 top-10 hidden h-48 w-48 rounded-full bg-primary/12 blur-3xl lg:block" />
            <div className="absolute -left-12 bottom-6 hidden h-40 w-40 rounded-full bg-sky-500/10 blur-3xl lg:block" />

            <div className="relative rounded-[32px] border border-border/70 bg-card/75 p-6 shadow-[0_30px_90px_rgba(3,7,18,0.26)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                    {t('landing.hero.panel.label')}
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
                    {t('landing.hero.panel.title')}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                    {t('landing.hero.panel.subtitle')}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {heroTasks.map((task, index) => (
                  <div key={`${task.title}-${task.state}`} className={cn(
                    'rounded-2xl border border-border/70 bg-background/60 p-4',
                    index === 0 && 'md:col-span-2'
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{task.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.meta}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                          index === 0 && 'border-rose-500/25 bg-rose-500/10 text-rose-200',
                          index === 1 && 'border-amber-500/25 bg-amber-500/10 text-amber-100',
                          index === 2 && 'border-sky-500/25 bg-sky-500/10 text-sky-100'
                        )}
                      >
                        {task.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[26px] border border-primary/15 bg-primary/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                  {t('landing.hero.panel.commandLabel')}
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {t('landing.hero.panel.commandTitle')}
                </p>
                <p className="mt-3 rounded-2xl border border-border/70 bg-background/55 p-4 text-sm leading-7 text-muted-foreground">
                  {t('landing.hero.panel.commandBody')}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {heroPills.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-background/55 px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-card/25 py-6">
        <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-10">
          {proofItems.map((item, index) => {
            const Icon = proofIcons[index]
            return (
              <div key={item.title} className="rounded-2xl border border-border/70 bg-background/55 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-base font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow={t('landing.problems.label')}
            title={t('landing.problems.title')}
            subtitle={t('landing.problems.subtitle')}
            center
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {problemItems.map((item, index) => (
              <div key={item.title} className="rounded-[28px] border border-border/70 bg-card/55 p-6 shadow-[0_18px_44px_rgba(3,7,18,0.12)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  {index === 0 ? <Compass className="h-5 w-5" /> : index === 1 ? <Clock3 className="h-5 w-5" /> : index === 2 ? <Users2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                <p className="mt-5 text-xl font-semibold tracking-tight">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <SectionHeader
              eyebrow={t('landing.newcomers.label')}
              title={t('landing.newcomers.title')}
              subtitle={t('landing.newcomers.subtitle')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {newcomerItems.map((item, index) => {
              const Icon = newcomerIcons[index]
              return (
                <div key={item.title} className="rounded-[28px] border border-border/70 bg-card/60 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-base font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow={t('landing.system.label')}
            title={t('landing.system.title')}
            subtitle={t('landing.system.subtitle')}
            center
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {systemItems.map((item, index) => {
              const Icon = systemIcons[index]
              return (
                <div key={item.title} className="group rounded-[30px] border border-border/70 bg-card/55 p-6 transition-all hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(3,7,18,0.18)]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                      {item.label}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background/60 text-primary transition-transform group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 font-heading text-2xl font-semibold tracking-tight">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/20 py-24">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow={t('landing.workflow.label')}
            title={t('landing.workflow.title')}
            subtitle={t('landing.workflow.subtitle')}
            center
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = workflowIcons[index]
              return (
                <div key={step.title} className="rounded-[28px] border border-border/70 bg-background/55 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <p className="mt-5 text-xl font-semibold tracking-tight">{step.title}</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-10">
          <div>
            <SectionHeader
              eyebrow={t('landing.comparison.label')}
              title={t('landing.comparison.title')}
              subtitle={t('landing.comparison.subtitle')}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[30px] border border-rose-500/15 bg-rose-500/8 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-200/80">
                {t('landing.comparison.before.title')}
              </p>
              <ul className="mt-5 space-y-4">
                {comparisonBefore.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[30px] border border-primary/15 bg-primary/8 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                {t('landing.comparison.after.title')}
              </p>
              <ul className="mt-5 space-y-4">
                {comparisonAfter.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                    <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border/60 bg-muted/20 py-24">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow={t('landing.pricing.label')}
            title={t('landing.pricing.title')}
            subtitle={t('landing.pricing.subtitle')}
            center
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={cn(
                  'rounded-[32px] border p-7 shadow-[0_20px_50px_rgba(3,7,18,0.14)]',
                  index === highlightedPlanIndex
                    ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                    : 'border-border/70 bg-background/55'
                )}
              >
                {index === highlightedPlanIndex ? (
                  <Badge className="rounded-full bg-primary text-primary-foreground">
                    {t('landing.pricing.mostPopular')}
                  </Badge>
                ) : null}

                <p className="mt-4 text-2xl font-semibold tracking-tight">{plan.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.desc}</p>

                <div className="mt-6 flex items-end gap-1">
                  <span className="font-heading text-4xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="pb-1 text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                      <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={ROUTES.REGISTER} className="mt-7 block">
                  <Button className="w-full" variant={index === highlightedPlanIndex ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24">
        <div className="mx-auto w-full max-w-[980px] px-4 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow={t('landing.faq.label')}
            title={t('landing.faq.title')}
            subtitle={t('landing.faq.subtitle')}
            center
          />

          <div className="mt-10 rounded-[30px] border border-border/70 bg-card/55 px-6 sm:px-8">
            {faqItems.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-gradient-to-b from-primary/6 via-background to-background py-24">
        <div className="mx-auto w-full max-w-[980px] px-4 text-center sm:px-6 lg:px-10">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            {t('landing.cta.badge')}
          </Badge>
          <h2 className="mt-6 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {t('landing.cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            {t('landing.cta.subtitle')}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" className="gap-2">
                {t('landing.cta.button')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button size="lg" variant="outline">
                {t('landing.cta.secondary')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-12">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-5 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-heading text-sm font-semibold">Network Marketing Master</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">{t('landing.footer.features')}</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">{t('landing.footer.pricing')}</a>
            <a href="#faq" className="transition-colors hover:text-foreground">{t('landing.footer.faq')}</a>
            <Link to={ROUTES.LOGIN} className="transition-colors hover:text-foreground">{t('landing.footer.login')}</Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            {t('landing.footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  )
}
