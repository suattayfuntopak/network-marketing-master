import { Link } from 'react-router-dom'
import {
  Zap, Target, Thermometer, MessageSquare, BarChart2, Users2, BookOpen,
  ArrowRight, CheckCircle, Star, ChevronDown, ChevronUp, Sun, Moon, Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import i18n from '@/i18n'

const featureIcons = [Target, Thermometer, MessageSquare, BarChart2, Users2, BookOpen]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex items-center justify-between w-full py-4 text-left text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground">{a}</p>}
    </div>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const planHighlighted = [false, true, false]
  const heroTasks = t('landing.hero.panel.tasks', { returnObjects: true }) as { state: string; title: string; meta: string }[]
  const heroSystemPills = t('landing.hero.panel.systemPills', { returnObjects: true }) as string[]
  const proofKeys = ['operations', 'priorities', 'guidance'] as const

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold">Network Marketing Master</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">{t('landing.nav.features')}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{t('landing.nav.pricing')}</a>
            <a href="#faq" className="hover:text-foreground transition-colors">{t('landing.nav.faq')}</a>
          </nav>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
              <button
                onClick={() => i18n.changeLanguage('tr')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  currentLang === 'tr'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Türkçe"
              >
                🇹🇷 TR
              </button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  currentLang === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="English"
              >
                🇺🇸 EN
              </button>
            </div>
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[size:32px_32px] opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)' }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-6">
              {t('landing.hero.badge')}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl lg:text-6xl">
              {t('landing.hero.title1')}{' '}
              <span className="text-primary">{t('landing.hero.title2')}</span>{' '}
              {t('landing.hero.title3')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0 mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:justify-start justify-center">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.hero.trust2')}
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                {t('landing.hero.trust3')}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-[0_24px_70px_rgba(3,7,18,0.18)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                  {t('landing.hero.panel.label')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {t('landing.hero.panel.title')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('landing.hero.panel.subtitle')}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {heroTasks.map((task, index) => (
                <div key={`${task.state}-${task.title}`} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{task.meta}</p>
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

            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/6 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                {t('landing.hero.panel.assistantLabel')}
              </p>
              <p className="mt-2 text-sm font-medium">
                {t('landing.hero.panel.assistantAction')}
              </p>
              <p className="mt-3 rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                {t('landing.hero.panel.assistantMessage')}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {heroSystemPills.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/30 py-5">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 sm:px-6 md:grid-cols-3">
          {proofKeys.map((key) => (
            <div key={key} className="rounded-2xl border border-border/70 bg-background/55 px-4 py-4">
              <p className="text-sm font-semibold">{t(`landing.proof.items.${key}.title`)}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(`landing.proof.items.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t('landing.problems.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('landing.problems.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-background">
                <div className="text-3xl mb-3">{t(`landing.problems.items.${i}.emoji`)}</div>
                <h3 className="font-semibold mb-2">{t(`landing.problems.items.${i}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`landing.problems.items.${i}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t('landing.features.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('landing.features.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureIcons.map((Icon, i) => (
              <div key={i} className="p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t(`landing.features.items.${i}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`landing.features.items.${i}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t('landing.howItWorks.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('landing.howItWorks.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {t(`landing.howItWorks.steps.${i}.step`)}
                </div>
                <h3 className="font-semibold mb-2">{t(`landing.howItWorks.steps.${i}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`landing.howItWorks.steps.${i}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t('landing.pricing.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('landing.pricing.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'p-6 rounded-xl border',
                  planHighlighted[i]
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border'
                )}
              >
                {planHighlighted[i] && (
                  <Badge className="mb-3 bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    {t('landing.pricing.mostPopular')}
                  </Badge>
                )}
                <h3 className="font-bold text-lg">{t(`landing.pricing.plans.${i}.name`)}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t(`landing.pricing.plans.${i}.desc`)}</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold">{t(`landing.pricing.plans.${i}.price`)}</span>
                  <span className="text-muted-foreground">{t(`landing.pricing.plans.${i}.period`)}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {(t(`landing.pricing.plans.${i}.features`, { returnObjects: true }) as string[]).map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={ROUTES.REGISTER}>
                  <Button
                    className="w-full"
                    variant={planHighlighted[i] ? 'default' : 'outline'}
                  >
                    {t(`landing.pricing.plans.${i}.cta`)}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t('landing.faq.title')}</h2>
          </div>
          <div className="bg-background rounded-xl border border-border px-6">
            {(t('landing.faq.items', { returnObjects: true }) as { q: string; a: string }[]).map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold">{t('landing.cta.title')}</h2>
          <p className="text-muted-foreground mt-3 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" className="gap-2">
              {t('landing.cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm hidden sm:inline">Network Marketing Master</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">{t('landing.footer.features')}</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">{t('landing.footer.pricing')}</a>
              <a href="#faq" className="hover:text-foreground transition-colors">{t('landing.footer.faq')}</a>
              <Link to={ROUTES.LOGIN} className="hover:text-foreground transition-colors">{t('landing.footer.login')}</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              {t('landing.footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
