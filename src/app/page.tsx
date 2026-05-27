'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Zap, TrendingUp, CalendarDays, Users, BookOpen, Bot, Shield, BarChart2,
  ArrowRight, Play, CheckCircle2, Globe, Sparkles, UserCheck, Flame, Layers
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export default function RootPage() {
  const router = useRouter()
  const { lang, setLang } = useTranslation()
  const [checkingSession, setCheckingSession] = useState(true)
  const [teamSize, setTeamSize] = useState(25)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    const supabase = createClient()

    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
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
      if (session) {
        router.push('/pano')
      } else {
        setCheckingSession(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Dynamic ROI Calculations
  const calculatedCandidatesNMM = teamSize * 15
  const calculatedCandidatesTrad = teamSize * 3
  const calculatedSavedHours = teamSize * 4
  const calculatedActiveRate = "88%"

  if (checkingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0B10] text-[var(--text-1)]">
        <div className="relative flex items-center justify-center">
          {/* Glowing pulse ring */}
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-[#534AB7]/20" />
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[#534AB7]/40" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#534AB7]">
            <Zap className="h-4 w-4 text-white animate-bounce" />
          </div>
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--text-3)] animate-pulse">
          {lang === 'en' ? 'Verifying Session...' : 'Oturum Doğrulanıyor...'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0A0B10] text-[#E2E8F0] selection:bg-[#534AB7] selection:text-white overflow-x-hidden font-sans">
      
      {/* ── BACKGROUND NEON ORBS ── */}
      <div className="absolute top-[10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[#534AB7]/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] h-[450px] w-[450px] rounded-full bg-pink-600/5 blur-[130px] pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0A0B10]/70 border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#534AB7] to-[#7c3aed] shadow-[0_0_20px_0_rgba(83,74,183,0.3)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
              Network Marketing Master
            </span>
          </div>

          {/* Navigation & Auth */}
          <div className="flex items-center gap-3">
            {/* Lang Switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.03] text-xs font-bold text-[#E2E8F0] transition cursor-pointer"
            >
              <Globe className="h-3 w-3 text-indigo-400" />
              <span>{lang === 'en' ? 'TR' : 'EN'}</span>
            </button>

            {/* Login */}
            <Link
              href="/giris"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#A0AEC0] hover:text-white transition cursor-pointer"
            >
              {lang === 'en' ? 'Log In' : 'Giriş Yap'}
            </Link>

            {/* Register */}
            <Link
              href="/kayit"
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white px-3.5 py-1.5 text-xs font-bold shadow-md hover:shadow-indigo-500/10 hover:opacity-90 transition active:scale-95 cursor-pointer shrink-0"
            >
              <span>{lang === 'en' ? 'Get Started' : 'Hemen Başla'}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 text-[11px] font-bold text-indigo-300 animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>{lang === 'en' ? 'AI-POWERED MLM ACCELERATOR' : 'YAPAY ZEKA DESTEKLİ MLM HIZLANDIRICI'}</span>
        </div>

        {/* Title */}
        <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
          {lang === 'en' ? (
            <>
              Build a <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">High-Performance</span> & Active Network Marketing Team!
            </>
          ) : (
            <>
              Aktif ve <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Yüksek Performanslı</span> Bir Network Marketing Ekibi İnşa Edin!
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-zinc-400 font-medium leading-relaxed">
          {lang === 'en' 
            ? 'Stop chasing cold leads. Standardize candidate pipelines, simulate interactive AI roleplay, and track your entire downline’s progress on autopilot.'
            : 'Adayların peşinden koşmayı bırakın. Aday huninizi standartlaştırın, yapay zekayla interaktif rol provası yapın ve tüm alt ekibinizin gelişimini otomatik pilotta izleyin.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/kayit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white px-6 py-3.5 text-sm font-bold shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition active:scale-95 cursor-pointer"
          >
            <span>{lang === 'en' ? 'Start Free Trial' : 'Hemen Ücretsiz Dene'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#roi-calculator"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.03] text-zinc-300 px-6 py-3.5 text-sm font-bold transition cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-indigo-400" />
            <span>{lang === 'en' ? 'How it Works' : 'Nasıl Çalışır?'}</span>
          </a>
        </div>
      </section>

      {/* ── MAIN PRODUCT FEATURES GRID ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'en' ? 'The Ultimate Command Center' : 'Eksiksiz Yönetim Merkezi'}
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-zinc-400 font-medium">
            {lang === 'en'
              ? 'Every feature meticulously designed for professional network marketers and leaders.'
              : 'Profesyonel ağ pazarlamacıları ve liderler için cerrah titizliğiyle tasarlanmış araçlar.'}
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1: Pipeline */}
          <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 hover:border-indigo-500/30 hover:bg-white/[0.02] transition duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition duration-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {lang === 'en' ? 'Candidate Pipeline' : 'Aday Boru Hattı'}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {lang === 'en'
                ? 'Visualize and track candidates from cold list to presentation, follow-ups, and registration.'
                : 'Adaylarınızı ilk listeden davete, sunumdan takibe ve ekibe kayıt aşamasına kadar görsel olarak yönetin.'}
            </p>
          </div>

          {/* Card 2: AI Coach */}
          <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 hover:border-purple-500/30 hover:bg-white/[0.02] transition duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition duration-300">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {lang === 'en' ? 'AI Copywriter & Coach' : 'Yapay Zeka Koçu & Mesaj Yazarı'}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {lang === 'en'
                ? 'Generate tailored WhatsApp follow-up messages based on client history. Ask the coach MLM strategic questions.'
                : 'Adayın durumuna özel kişiselleştirilmiş takip mesajları hazırlayın. Liderlik ve MLM strateji sorularınızı sorun.'}
            </p>
          </div>

          {/* Card 3: Quick Start */}
          <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 hover:border-pink-500/30 hover:bg-white/[0.02] transition duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition duration-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {lang === 'en' ? 'Quick Start Onboarding' : 'Doğru Başlangıç Rehberi'}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {lang === 'en'
                ? 'Ensure new distributors follow the perfect 4-week checklist. Database-persistent and sponsor sync.'
                : 'Yeni distribütörlerin ilk 4 haftalık kritik başlangıç listesini adım adım tiklemesini sağlayın. Sponsor ekranıyla senkronize.'}
            </p>
          </div>

          {/* Card 4: Field Rehearsal */}
          <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 hover:border-amber-500/30 hover:bg-white/[0.02] transition duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition duration-300">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {lang === 'en' ? 'Interactive Roleplay Rehearsal' : 'Yapay Zeka Saha Provası'}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {lang === 'en'
                ? 'Choose candidate warmth and simulate real chats. Practice presentation closing before going to the field.'
                : 'Aday sıcaklığını seçip YZ simülasyonunda canlı sohbet edin. Sahaya inmeden önce kapanış provanızı tamamlayın.'}
            </p>
          </div>

          {/* Card 5: Compliance */}
          <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 hover:border-teal-500/30 hover:bg-white/[0.02] transition duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition duration-300">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {lang === 'en' ? 'Advertising & Compliance' : 'Uyum Denetleme Merkezi'}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {lang === 'en'
                ? 'Instantly scan advertising and social posts for consumer-protection compliance and prohibited words.'
                : 'Sosyal medya paylaşımlarınızı ve reklam metinlerinizi tüketici koruma kanunlarına ve MLM yasaklı kelimelerine göre denetleyin.'}
            </p>
          </div>

          {/* Card 6: Team Analaytics */}
          <div className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 hover:border-blue-500/30 hover:bg-white/[0.02] transition duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition duration-300">
              <BarChart2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {lang === 'en' ? 'Direct Downline RLS Dashboard' : 'Ekibim Aday Dağılım Paneli'}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {lang === 'en'
                ? 'Track downlines’ active pipeline metrics and last activity without invading their candidate privacy.'
                : 'Alt ekibinizin toplam aday sayılarını, huni dağılımlarını ve aktifliğini gizliliklerini bozmadan izleyin.'}
            </p>
          </div>

        </div>
      </section>

      {/* ── INTERACTIVE ROI CALCULATOR ── */}
      <section id="roi-calculator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'en' ? 'See the Network Master Effect' : 'Network Master Etkisini Hesaplayın'}
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-zinc-400 font-medium">
            {lang === 'en'
              ? 'Slide your downline size to estimate team momentum and sponsor hours saved.'
              : 'Ekip büyüklüğünüzü kaydırarak organizasyon momentumunuzu ve kazanacağınız zamanı görün.'}
          </p>
        </div>

        {/* Calculator layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
          
          {/* Slider input control - left */}
          <div className="lg:col-span-5 rounded-3xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {lang === 'en' ? 'Active Distributors' : 'Aktif Distribütör Sayısı'}
              </label>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-white">{teamSize}</span>
                <span className="text-xs font-bold text-[#534AB7] bg-[#EEEDFE]/10 px-2.5 py-1 rounded-lg">
                  {lang === 'en' ? 'PARTNERS' : 'ORTAK'}
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
            <div className="border-t border-white/[0.05] pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{lang === 'en' ? 'Assuming 15 candidates/month per active user' : 'Aktif kişi başına ayda 15 aday ekleme varsayımı'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{lang === 'en' ? '4 hours saved/week per onboarding downline' : 'Rehberi tamamlayan üye başına sponsor için haftalık 4 saat tasarruf'}</span>
              </div>
            </div>
          </div>

          {/* Results display - right */}
          <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            
            {/* Stat 1: Candidate count */}
            <div className="rounded-3xl border border-white/[0.05] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-6 space-y-2 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-indigo-500/10 text-8xl font-black select-none pointer-events-none">
                #
              </div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                {lang === 'en' ? 'Team Candidates / Month' : 'Ekibin Aylık Toplam Adayı'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{calculatedCandidatesNMM}</span>
                <span className="text-xs text-emerald-400 font-bold">
                  {lang === 'en' ? `vs ${calculatedCandidatesTrad} (Manual)` : `${calculatedCandidatesTrad} Adaya Karşı`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {lang === 'en' ? 'Standardized digital pipelines maximize prospecting actions.' : 'Dijital huniler aday ekleme ve takip aksiyonlarını maksimize eder.'}
              </p>
            </div>

            {/* Stat 2: Hours Saved */}
            <div className="rounded-3xl border border-white/[0.05] bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-6 space-y-2 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-purple-500/10 text-8xl font-black select-none pointer-events-none">
                H
              </div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                {lang === 'en' ? 'Sponsor Hours Saved / Month' : 'Kazanılan Sponsor Zamanı / Ay'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#534AB7]">{calculatedSavedHours} saat</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {lang === 'en' ? 'Checklists and dynamic guidance handle direct training.' : 'Doğru başlangıç rehberleri ekibin eğitim ve takip takibini üstlenir.'}
              </p>
            </div>

            {/* Stat 3: Active downline rate */}
            <div className="rounded-3xl border border-white/[0.05] bg-gradient-to-br from-teal-500/5 to-blue-500/5 p-6 space-y-2 col-span-1 sm:col-span-2 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-teal-500/10 text-8xl font-black select-none pointer-events-none">
                %
              </div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                {lang === 'en' ? 'Team Onboarding Active Rate' : 'Doğru Başlangıç Aktif Distribütör Oranı'}
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-teal-400">{calculatedActiveRate}</span>
                <span className="text-xs text-zinc-500 font-semibold line-through">
                  {lang === 'en' ? 'vs 15% (Traditional lists)' : 'Geleneksel Kağıt/Excel listelerinde %15'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {lang === 'en'
                  ? 'Gamified, step-by-step checklists keep partners engaged and accountable.'
                  : 'Oyunlaştırılmış, 4 haftalık takip listesi ekip ortaklarını sürekli aksiyonda tutar.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'en' ? 'Sponsor-Aligned Pricing' : 'Ekibiniz Büyürken Kazanın'}
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-zinc-400 font-medium">
            {lang === 'en'
              ? 'Choose the plan that fits your MLM organization goals.'
              : 'MLM organizasyonel hedeflerinize ve ekibinize uygun lisansı seçin.'}
          </p>

          {/* Monthly / Yearly Toggler */}
          <div className="flex flex-col items-center pt-4">
            <div className="inline-flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] p-1 rounded-2xl relative shadow-inner backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                  billingPeriod === 'monthly'
                    ? 'bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang === 'en' ? 'Monthly Billing' : 'Aylık Ödeme'}
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                  billingPeriod === 'yearly'
                    ? 'bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{lang === 'en' ? 'Yearly Billing' : 'Yıllık Ödeme'}</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                  {lang === 'en' ? '-3 Months!' : '-3 Ay Fırsatı!'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Three Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 max-w-6xl mx-auto lg:grid-cols-3 items-stretch">
          
          {/* Plan A: Basic Plan */}
          <div className="rounded-3xl border border-white/[0.04] bg-white/[0.01] p-8 flex flex-col justify-between hover:border-zinc-700 transition duration-300 relative">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {lang === 'en' ? 'SOLO BUILDER' : 'BİREYSEL ORTAK'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">
                  {lang === 'en' ? 'Basic Plan' : 'Basic Plan'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {lang === 'en' ? 'Manage your personal candidate pipeline.' : 'Kişisel aday hunisini yönetmek ve provasını yapmak isteyenler için.'}
                </p>
              </div>

              {/* Price */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingPeriod === 'monthly' ? '₺399' : '₺3,499'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    / {billingPeriod === 'monthly'
                      ? (lang === 'en' ? 'month' : 'ay')
                      : (lang === 'en' ? 'year' : 'yıl')}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                    {lang === 'en' ? "₺291 / month equivalent (3 Months Free!)" : "₺291 / ay'a denk gelir (3 Ay Bedava!)"}
                  </span>
                )}
              </div>

              {/* Bullet Features */}
              <ul className="space-y-3 border-t border-white/[0.05] pt-5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{lang === 'en' ? 'Full Candidate Pipeline Management' : 'Tam Aday Boru Hattı Yönetimi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 15 AI Message Credits' : 'Günlük 15 YZ Mesaj Yazarı Kredisi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 10 Interactive Rehearsal Credits' : 'Günlük 10 Saha Provası Simülatörü'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 2 Compliance Control Credits' : 'Günlük 2 Uyum Denetim Hakkı'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{lang === 'en' ? 'Solo Statistics & Reports' : 'Bireysel İstatistik Raporu & Grafikler'}</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/kayit"
                className="block text-center rounded-xl border border-white/[0.08] hover:bg-white/[0.03] text-white py-3 text-xs font-bold transition cursor-pointer"
              >
                {lang === 'en' ? 'Start 7-Day Free Trial' : '7 Günlük Denemeyi Başlat'}
              </Link>
            </div>
          </div>

          {/* Plan B: Plus Plan */}
          <div className="rounded-3xl border border-[#534AB7]/40 bg-[#12111E]/40 p-8 flex flex-col justify-between relative ring-2 ring-[#534AB7]/30 shadow-[0_20px_50px_rgba(83,74,183,0.15)] hover:border-[#534AB7]/60 transition duration-300">
            <div className="absolute right-6 top-6 animate-pulse">
              <span className="text-[9px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {lang === 'en' ? 'Popular' : 'En Çok Satan'}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {lang === 'en' ? 'GROWING TEAMS' : 'TAKIM LİDERLERİ'}
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-white">
                  {lang === 'en' ? 'Plus Plan' : 'Plus Plan'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {lang === 'en' ? 'Track downlines and sync onboarding.' : 'Alt ekibini izlemek, onboarding sürecini takip etmek ve gerçek zamanlı analiz etmek isteyen liderler.'}
                </p>
              </div>

              {/* Price */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingPeriod === 'monthly' ? '₺1,199' : '₺9,999'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    / {billingPeriod === 'monthly'
                      ? (lang === 'en' ? 'month' : 'ay')
                      : (lang === 'en' ? 'year' : 'yıl')}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit animate-pulse">
                    {lang === 'en' ? "₺833 / month equivalent (3 Months Free!)" : "₺833 / ay'a denk gelir (3 Ay Bedava!)"}
                  </span>
                )}
              </div>

              {/* Bullet Features */}
              <ul className="space-y-3 border-t border-white/[0.05] pt-5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-white">{lang === 'en' ? 'All Basic Plan Features' : 'Basic Planındaki TÜM Özellikler'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{lang === 'en' ? 'Direct Downline Tracking (Max 20 Members)' : 'Alt Ekip Takibi (Maksimum 20 Üye)'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{lang === 'en' ? '4-Week Onboarding Sync' : '4 Haftalık Doğru Başlangıç Rehberi Takibi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 40 AI Message Credits' : 'Günlük 40 YZ Mesaj Yazarı Kredisi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 25 Interactive Rehearsal Credits' : 'Günlük 25 Saha Provası Kredisi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 5 Compliance Control Credits' : 'Günlük 5 Uyum Denetim Hakkı'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{lang === 'en' ? 'Real-Time Downline Push Notifications' : 'Gerçek Zamanlı Takım Bildirim Motoru'}</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/kayit"
                className="block text-center rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition active:scale-95 cursor-pointer"
              >
                {lang === 'en' ? 'Get Started Now' : 'Ekibi Güçlendir'}
              </Link>
            </div>
          </div>

          {/* Plan C: Pro Plan */}
          <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-b from-[#1c0f1e] to-[#0A0B10] p-8 flex flex-col justify-between hover:border-pink-500/60 transition duration-300 relative shadow-[0_20px_50px_rgba(219,39,119,0.1)]">
            <div className="absolute right-6 top-6 flex items-center gap-2">
              <span className="text-[9px] font-black text-pink-400 bg-pink-500/20 border border-pink-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                👑 {lang === 'en' ? 'Diamond Pro' : 'Diamond Pro'}
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {lang === 'en' ? 'TOP ORGANIZATIONS' : 'BÜYÜK LİDERLER'}
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-white">
                  {lang === 'en' ? 'Pro Plan' : 'Pro Plan'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {lang === 'en' ? 'Unlimited downlines, coaching & Excel analytics.' : 'Sınırsız organizasyon takibi, yapay zeka ekip koçluğu ve Excel tarzı performans masası.'}
                </p>
              </div>

              {/* Price */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingPeriod === 'monthly' ? '₺2,499' : '₺19,999'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    / {billingPeriod === 'monthly'
                      ? (lang === 'en' ? 'month' : 'ay')
                      : (lang === 'en' ? 'year' : 'yıl')}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg mt-2 inline-block w-fit">
                    {lang === 'en' ? "₺1,666 / month equivalent (3 Months Free!)" : "₺1,666 / ay'a denk gelir (3 Ay Bedava!)"}
                  </span>
                )}
              </div>

              {/* Bullet Features */}
              <ul className="space-y-3 border-t border-white/[0.05] pt-5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span className="font-bold text-white">{lang === 'en' ? 'All Plus Plan Features' : 'Plus Planındaki TÜM Özellikler'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span className="font-bold text-pink-300">{lang === 'en' ? 'Sınırsız Alt Ekip Takibi' : 'Sınırsız Alt Ekip Takibi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span>{lang === 'en' ? 'AI Downline Performance Coaching' : 'Yapay Zeka Alt Ekip Koçu'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span>{lang === 'en' ? 'Super Admin AI Control Desk' : 'Süper Admin AI Kontrol Masası'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 100 AI Message Credits' : 'Günlük 100 YZ Mesaj Yazarı Kredisi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 60 Interactive Rehearsal Credits' : 'Günlük 60 Saha Provası Kredisi'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                  <span>{lang === 'en' ? 'Daily 15 Compliance Control Credits' : 'Günlük 15 Uyum Denetim Hakkı'}</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/kayit"
                className="block text-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-pink-500/10 transition active:scale-95 cursor-pointer"
              >
                {lang === 'en' ? 'Get Started Now' : 'Zirveye Ulaş'}
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'en' ? 'Trusted by Independent Leaders' : 'Liderlerin Başarı Hikayeleri'}
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-zinc-400 font-medium">
            {lang === 'en'
              ? 'See how top sponsors automated candidate lists and onboarding.'
              : 'Sponsorların aday listelerini ve doğru başlangıç adımlarını nasıl otomatikleştirdiğini görün.'}
          </p>
        </div>

        {/* 2 Big Testimonial grids */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          
          <div className="rounded-3xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-8 space-y-4">
            <p className="text-xs sm:text-sm italic text-zinc-300 leading-relaxed">
              &ldquo;{lang === 'en' 
                ? 'Network Marketing Master changed everything for my downlines. When a new partner joins, they follow the 4-week onboarding plan, which triggers live push notifications on my panel when completed. Total game changer.'
                : 'Network Marketing Master alt ekibim için her şeyi değiştirdi. Yeni bir distribütör katıldığında, 4 haftalık Doğru Başlangıç adımlarını takip ediyor ve tamamladığında panelime anlık bildirim fırlatıyor. Muhteşem bir otomasyon.'}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400">
                ST
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Suat Tayfun T.</h4>
                <p className="text-[10px] text-zinc-500">{lang === 'en' ? 'Independent Master Sponsor' : 'Bağımsız Master Sponsor'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-8 space-y-4">
            <p className="text-xs sm:text-sm italic text-zinc-300 leading-relaxed">
              &ldquo;{lang === 'en'
                ? 'The AI Rehearsal Simulator is a lifesaver. My new field partners practice presentation closures on the AI candidates before having real conversations on the field. Sepet abandonment rates dropped massively!'
                : 'YZ Saha Provası simülatörü can kurtarıcı. Yeni distribütörlerim, sahada gerçek görüşmelere başlamadan önce YZ adayları üzerinde interaktif rol provası yapıyorlar. Aday kaybetme oranlarımız ciddi miktarda azaldı!'}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center font-bold text-pink-400">
                ES
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Elif Sinem T.</h4>
                <p className="text-[10px] text-zinc-500">{lang === 'en' ? 'Executive Team Leader' : 'Ekip Lideri'}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-8 mt-12 bg-[#06070B]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] sm:text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Network Marketing Master. {lang === 'en' ? 'All rights reserved.' : 'Tüm hakları saklıdır.'}
          </p>
          <div className="flex gap-4 text-[10px] sm:text-xs text-zinc-500">
            <Link href="/giris" className="hover:text-white transition">{lang === 'en' ? 'Log In' : 'Giriş Yap'}</Link>
            <Link href="/kayit" className="hover:text-white transition">{lang === 'en' ? 'Sign Up' : 'Kayıt Ol'}</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
