'use client'

import { useEffect } from 'react'
import { LandingHeader } from './LandingHeader'
import { LandingHero } from './LandingHero'
import { LandingFeatures } from './LandingFeatures'
import { LandingRoiCalculator } from './LandingRoiCalculator'
import { LandingPricing } from './LandingPricing'
import { LandingTestimonials } from './LandingTestimonials'
import { LandingFaq } from './LandingFaq'
import { LandingFooter } from './LandingFooter'

export function LandingPage() {
  useEffect(() => {
    // Şifre sıfırlama linki ana sayfaya düşerse hash/query korunarak yönlendir
    const hash = window.location.hash
    const search = window.location.search
    if (
      hash.includes('access_token') ||
      hash.includes('type=recovery') ||
      search.includes('code=') ||
      search.includes('token_hash=') ||
      search.includes('token=')
    ) {
      window.location.replace(`/sifre-guncelle${search}${hash}`)
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-white text-slate-900 dark:bg-[#0A0B10] dark:text-[#E2E8F0] selection:bg-brand selection:text-white overflow-x-clip font-sans">
      {/* ── BACKGROUND NEON ORBS ── */}
      <div className="absolute top-[10%] left-[-10%] h-[400px] w-[400px] rounded-full dark:bg-brand/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] rounded-full dark:bg-blue-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] h-[450px] w-[450px] rounded-full dark:bg-pink-600/5 blur-[130px] pointer-events-none" />

      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingRoiCalculator />
      <LandingFaq />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFooter />
    </div>
  )
}
