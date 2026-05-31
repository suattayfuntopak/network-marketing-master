'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/providers/LanguageProvider'
import { LandingHeader } from './LandingHeader'
import { LandingHero } from './LandingHero'
import { LandingFeatures } from './LandingFeatures'
import { LandingRoiCalculator } from './LandingRoiCalculator'
import { LandingPricing } from './LandingPricing'
import { LandingTestimonials } from './LandingTestimonials'
import { LandingFaq } from './LandingFaq'
import { LandingFooter } from './LandingFooter'

export function LandingPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const onLandingPreview = window.location.pathname.startsWith('/acilis')
      if (session && !onLandingPreview) {
        router.push('/pano')
      } else {
        // Look for recovery or tokens in hash
        const hasHash = window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery')
        if (!hasHash) {
          setCheckingSession(false)
        }
      }
    })

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/sifre-guncelle')
        return
      }
      if (session && !window.location.pathname.startsWith('/acilis')) {
        router.push('/pano')
      } else {
        setCheckingSession(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (checkingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-[#0A0B10] text-[var(--text-1)]">
        <div className="relative flex items-center justify-center">
          {/* Glowing pulse ring */}
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-[#534AB7]/20" />
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[#534AB7]/40" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 p-0.5 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <img src="/logo.png" alt="NMM Logo" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--text-3)] animate-pulse">
          {t('landingPage.verifyingSession')}
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-white text-slate-900 dark:bg-[#0A0B10] dark:text-[#E2E8F0] selection:bg-[#534AB7] selection:text-white overflow-x-hidden font-sans">
      
      {/* ── BACKGROUND NEON ORBS ── */}
      <div className="absolute top-[10%] left-[-10%] h-[400px] w-[400px] rounded-full dark:bg-[#534AB7]/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] rounded-full dark:bg-blue-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] h-[450px] w-[450px] rounded-full dark:bg-pink-600/5 blur-[130px] pointer-events-none" />

      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingRoiCalculator />
      <LandingTestimonials />
      <LandingFaq />
      <LandingPricing />
      <LandingFooter />

    </div>
  )
}
