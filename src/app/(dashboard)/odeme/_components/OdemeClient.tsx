'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Sparkles, Loader2, Coins, Calendar, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { toast } from 'sonner'
import { initiateShopierPayment, ShopierFormData } from '../actions'

export function OdemeClient() {
  const { lang } = useTranslation()
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace()
  
  const [selectedPlan, setSelectedPlan] = useState<'leader' | 'master' | 'pro' | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ShopierFormData | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-submit the hidden form once parameters are compiled by the server action
  useEffect(() => {
    if (formData && formRef.current) {
      formRef.current.submit()
    }
  }, [formData])

  const handlePayment = async (plan: 'leader' | 'master' | 'pro') => {
    try {
      setLoading(true)
      setSelectedPlan(plan)
      toast.info(
        lang === 'en'
          ? 'Preparing secure checkout session...'
          : 'Güvenli ödeme oturumu hazırlanıyor...'
      )

      // Fetch the verified parameters & HMAC-SHA256 signature from our server action
      const data = await initiateShopierPayment(plan)
      setFormData(data)
    } catch (err: any) {
      console.error('[OdemeClient] error initiating payment:', err)
      toast.error(
        lang === 'en'
          ? `Could not start checkout: ${err?.message || 'Unknown error'}`
          : `Ödeme başlatılamadı: ${err?.message || 'Bilinmeyen hata'}`
      )
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-[var(--text-3)]">
          {lang === 'en' ? 'Loading plans...' : 'Paketler yükleniyor...'}
        </p>
      </div>
    )
  }

  // Determine active plan indicators
  const isProActive = workspace?.licenseType === 'pro'
  const isMasterActive = workspace?.licenseType === 'master' // Plus
  const isLeaderActive = workspace?.licenseType === 'leader' // Basic

  return (
    <div className="mx-auto max-w-7xl space-y-12 py-4">
      {/* ── Dynamic Loader Page / Redirecting Overlay ── */}
      {loading && formData && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0B10]/95 backdrop-blur-md">
          <div className="relative flex flex-col items-center max-w-md p-8 text-center space-y-6">
            <div className="absolute -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl animate-pulse"></div>
            
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                {lang === 'en' ? 'Redirecting to Shopier...' : 'Shopier\'e Yönlendiriliyorsunuz...'}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'en'
                  ? 'Establishing a secure payment gateway session. Please do not close this window.'
                  : 'Güvenli ödeme geçidi bağlantısı kuruluyor. Lütfen pencereyi kapatmayın.'}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-[10px] text-zinc-500 font-mono text-left w-full space-y-1.5">
              <div>OrderID: {formData.platform_order_id}</div>
              <div>Plan: {selectedPlan === 'pro' ? 'Pro Lider' : selectedPlan === 'master' ? 'Plus Lider' : 'Basic Partner'}</div>
              <div>Amount: {formData.total_order_value} TRY</div>
            </div>
          </div>

          {/* Hidden HTML POST Form to auto-redirect */}
          <form
            ref={formRef}
            method="post"
            action="https://www.shopier.com/ShowProduct/api_pay4.php"
            className="hidden"
          >
            {Object.entries(formData).map(([key, val]) => (
              <input key={key} type="hidden" name={key} value={val} />
            ))}
          </form>
        </div>
      )}

      {/* ── Active License Info Widget ── */}
      {workspace && (isProActive || isMasterActive || isLeaderActive) && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'Active Premium License Found' : 'Aktif Premium Lisansınız Mevcut'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {lang === 'en' ? 'You are currently on the ' : 'Şu anda '}
                <span className="font-extrabold text-indigo-300">
                  {workspace.licenseType === 'pro'
                    ? (lang === 'en' ? 'Pro Lider' : 'Pro Lider')
                    : workspace.licenseType === 'master'
                      ? (lang === 'en' ? 'Plus Lider' : 'Plus Lider')
                      : (lang === 'en' ? 'Basic Partner' : 'Basic Partner')}
                </span>
                {lang === 'en' ? ' plan.' : ' planındasınız.'}
              </p>
            </div>
          </div>

          {workspace.licenseExpiresAt && (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-800/40 border border-zinc-700/50 px-4 py-2 text-xs font-semibold text-zinc-300">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>
                {lang === 'en' ? 'Expires on: ' : 'Geçerlilik tarihi: '}
                <span className="text-white font-bold">{formatDate(workspace.licenseExpiresAt)}</span>
              </span>
            </div>
          )}

          {!workspace.licenseExpiresAt && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-400 animate-pulse">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{lang === 'en' ? 'Unlimited Admin License' : 'Süresiz Yönetici Lisansı'}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Three Pricing Cards ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
        
        {/* Plan A: Basic Plan */}
        <div className="rounded-3xl border border-white/[0.04] bg-white/[0.01] p-8 flex flex-col justify-between hover:border-zinc-700/50 transition duration-300 relative">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {lang === 'en' ? 'SOLO BUILDER' : 'BİREYSEL ORTAK'}
              </span>
              {isLeaderActive && (
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'en' ? 'Active' : 'Aktif'}
                </span>
              )}
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
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">₺499</span>
              <span className="text-xs text-zinc-500">/ {lang === 'en' ? 'month' : 'ay'}</span>
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
            <button
              onClick={() => handlePayment('leader')}
              disabled={loading || isLeaderActive}
              className={`w-full text-center rounded-xl border border-white/[0.08] hover:bg-white/[0.03] text-white py-3 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                isLeaderActive ? 'opacity-50 cursor-not-allowed border-emerald-500/20 text-emerald-400 hover:bg-transparent' : 'cursor-pointer'
              }`}
            >
              {isLeaderActive ? (
                lang === 'en' ? 'Your Current Active Plan' : 'Mevcut Aktif Planınız'
              ) : (
                <>
                  <span>{lang === 'en' ? 'Buy 30 Days Access' : '30 Günlük Erişim Satın Al'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plan B: Plus Plan */}
        <div className="rounded-3xl border border-[#534AB7]/40 bg-[#12111E]/40 p-8 flex flex-col justify-between relative ring-2 ring-[#534AB7]/30 shadow-[0_20px_50px_rgba(83,74,183,0.15)] hover:border-[#534AB7]/60 transition duration-300">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {isMasterActive && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {lang === 'en' ? 'Active' : 'Aktif'}
              </span>
            )}
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
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">₺1,499</span>
              <span className="text-xs text-zinc-500">/ {lang === 'en' ? 'month' : 'ay'}</span>
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
            <button
              onClick={() => handlePayment('master')}
              disabled={loading || isMasterActive}
              className={`w-full text-center rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                isMasterActive ? 'opacity-50 cursor-not-allowed bg-none bg-zinc-800 text-zinc-500 hover:shadow-none' : 'cursor-pointer'
              }`}
            >
              {isMasterActive ? (
                lang === 'en' ? 'Your Current Active Plan' : 'Mevcut Aktif Planınız'
              ) : (
                <>
                  <span>{lang === 'en' ? 'Buy 30 Days Plus Access' : '30 Günlük Plus Erişimini Başlat'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plan C: Pro Plan */}
        <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-b from-[#1c0f1e] to-[#0A0B10] p-8 flex flex-col justify-between hover:border-pink-500/60 transition duration-300 relative shadow-[0_20px_50px_rgba(219,39,119,0.1)]">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            {isProActive && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {lang === 'en' ? 'Active' : 'Aktif'}
              </span>
            )}
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
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">₺2,499</span>
              <span className="text-xs text-zinc-500">/ {lang === 'en' ? 'month' : 'ay'}</span>
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
            <button
              onClick={() => handlePayment('pro')}
              disabled={loading || isProActive}
              className={`w-full text-center rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white py-3 text-xs font-bold hover:shadow-lg hover:shadow-pink-500/10 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                isProActive ? 'opacity-50 cursor-not-allowed bg-none bg-zinc-800 text-zinc-500 hover:shadow-none' : 'cursor-pointer'
              }`}
            >
              {isProActive ? (
                lang === 'en' ? 'Your Current Active Plan' : 'Mevcut Aktif Planınız'
              ) : (
                <>
                  <span>{lang === 'en' ? 'Buy 30 Days Pro Access' : '30 Günlük Pro Erişimini Başlat'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ── Extra Disclaimers ── */}
      <div className="max-w-2xl mx-auto text-center rounded-2xl border border-white/[0.03] bg-white/[0.01] p-6 space-y-2">
        <h4 className="text-xs font-bold text-zinc-300">
          {lang === 'en' ? 'About Shopier & Subscription Sim' : 'Güvenli Altyapı ve Abonelik Simülasyonu Hakkında'}
        </h4>
        <p className="text-[10px] leading-relaxed text-zinc-500">
          {lang === 'en'
            ? 'Payments are securely processed via Shopier. We do not store your credit card details. Since native recurring billing is limited in Turkey for non-incorporated businesses, we employ an "Abonelik Simülasyonu" where each transaction manually extends your expiration date by 30 days.'
            : 'Ödemeleriniz Türkiye\'nin en güvenli bireysel ödeme altyapısı olan Shopier aracılığıyla 256-bit SSL şifrelemeyle gerçekleşir. Kart bilgileriniz kesinlikle kaydedilmez. Her satın alımınız mevcut lisans sürenizin üzerine otomatik olarak +30 gün ekleme yapar.'}
        </p>
      </div>
    </div>
  )
}

