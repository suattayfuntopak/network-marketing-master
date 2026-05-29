'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function LandingRoiCalculator() {
  const { t } = useTranslation()
  const [teamSize, setTeamSize] = useState(25)

  const calculatedCandidatesNMM = teamSize * 15
  const calculatedCandidatesTrad = teamSize * 3
  const calculatedSavedHours = teamSize * 4
  const calculatedActiveRate = "88%"

  return (
    <section id="roi-calculator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('landingPage.roiTitle')}
        </h2>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('landingPage.roiSubtitle')}
        </p>
      </div>

      {/* Calculator layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
        
        {/* Slider input control - left */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t('landingPage.roiActiveDistributors')}
            </label>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{teamSize}</span>
              <span className="text-xs font-bold text-[#534AB7] bg-[#EEEDFE]/10 px-2.5 py-1 rounded-lg">
                {t('landingPage.roiPartners')}
              </span>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={teamSize}
            onChange={e => setTeamSize(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-[#534AB7] focus:outline-none"
          />

          {/* Info lists */}
          <div className="border-t border-slate-200 dark:border-white/[0.05] pt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{t('landingPage.roiAssumption1')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{t('landingPage.roiAssumption2')}</span>
            </div>
          </div>
        </div>

        {/* Results display - right */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          
          {/* Stat 1: Candidate count */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.05] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-6 space-y-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-indigo-500/10 text-8xl font-black select-none pointer-events-none">
              #
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
              {t('landingPage.roiCandidatesLabel')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{calculatedCandidatesNMM}</span>
              <span className="text-xs text-emerald-400 font-bold">
                {t('landingPage.roiVsManual', { count: calculatedCandidatesTrad })}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              {t('landingPage.roiCandidatesDesc')}
            </p>
          </div>

          {/* Stat 2: Hours Saved */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.05] bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-6 space-y-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-purple-500/10 text-8xl font-black select-none pointer-events-none">
              H
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
              {t('landingPage.roiHoursLabel')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#534AB7]">{calculatedSavedHours} {t('landingPage.roiHoursUnit')}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              {t('landingPage.roiHoursDesc')}
            </p>
          </div>

          {/* Stat 3: Active downline rate */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.05] bg-gradient-to-br from-teal-500/5 to-blue-500/5 p-6 space-y-2 col-span-1 sm:col-span-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-teal-500/10 text-8xl font-black select-none pointer-events-none">
              %
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
              {t('landingPage.roiActiveRateLabel')}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-teal-400">{calculatedActiveRate}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-500 font-semibold line-through">
                {t('landingPage.roiVsTraditional')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('landingPage.roiActiveRateDesc')}
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
