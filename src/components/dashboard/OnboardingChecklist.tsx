import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DashboardOnboardingSummary } from '@/lib/dashboard/onboarding'

interface OnboardingChecklistProps {
  summary: DashboardOnboardingSummary
  firstName?: string | null
}

export function OnboardingChecklist({ summary, firstName }: OnboardingChecklistProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!summary.show) return null

  const nextStep = summary.steps.find((step) => !step.completed) ?? null

  return (
    <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%)]">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              {t('dashboard.onboarding.label')}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {t('dashboard.onboarding.title', { name: firstName || t('profile.user') })}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('dashboard.onboarding.subtitle')}
            </p>
          </div>

          <div className="min-w-[180px] rounded-2xl border border-border/70 bg-card/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('dashboard.onboarding.progressLabel')}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {summary.completedCount}/{summary.totalSteps}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${summary.completionPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.steps.map((step) => (
            <button
              key={step.key}
              type="button"
              onClick={() => navigate(step.href)}
              className="rounded-2xl border border-border/70 bg-card/65 p-4 text-left transition-all hover:border-primary/25 hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  step.completed
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    : 'border-primary/15 bg-primary/10 text-primary'
                }`}>
                  {step.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  step.completed
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                    : 'border-border bg-background/70 text-muted-foreground'
                }`}>
                  {step.completed ? t('dashboard.onboarding.done') : t('dashboard.onboarding.pending')}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold">{t(`dashboard.onboarding.steps.${step.key}.title`)}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(`dashboard.onboarding.steps.${step.key}.body`)}
              </p>
            </button>
          ))}
        </div>

        {nextStep ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button className="gap-1.5" onClick={() => navigate(nextStep.href)}>
              {t(`dashboard.onboarding.steps.${nextStep.key}.action`)}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              {t(`dashboard.onboarding.steps.${nextStep.key}.hint`)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
