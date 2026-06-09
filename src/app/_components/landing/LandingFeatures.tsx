'use client'

import {
  TrendingUp, Users, Bot, Shield, BarChart2, Sparkles,
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { PANO_ACCENT } from '@/lib/ui/panoAccentColors'

const FEATURE_ACCENTS = [PANO_ACCENT.teal, PANO_ACCENT.indigo, PANO_ACCENT.amber, PANO_ACCENT.teal] as const

const FEATURE_ICONS = [TrendingUp, Bot, Sparkles, Users, Shield, BarChart2] as const

export function LandingFeatures() {
  const { t } = useTranslation()

  const features = [
    { title: t('landingPage.feature1Title'), desc: t('landingPage.feature1Desc') },
    { title: t('landingPage.feature2Title'), desc: t('landingPage.feature2Desc') },
    { title: t('landingPage.feature3Title'), desc: t('landingPage.feature3Desc') },
    { title: t('landingPage.feature4Title'), desc: t('landingPage.feature4Desc') },
    { title: t('landingPage.feature5Title'), desc: t('landingPage.feature5Desc') },
    { title: t('landingPage.feature6Title'), desc: t('landingPage.feature6Desc') },
  ]

  return (
    <section id="ozellikler" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('landingPage.featuresTitle')}
        </h2>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('landingPage.featuresSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, idx) => {
          const accent = FEATURE_ACCENTS[idx % FEATURE_ACCENTS.length]
          const Icon = FEATURE_ICONS[idx]
          return (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] p-6 transition duration-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              style={{
                borderColor: `color-mix(in srgb, ${accent.to} 30%, transparent)`,
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${accent.from} 22%, transparent), color-mix(in srgb, ${accent.to} 18%, transparent))`,
                  color: accent.text,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
