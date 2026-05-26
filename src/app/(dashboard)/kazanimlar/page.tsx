'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Trophy, Calendar, Award, ExternalLink, Bot, Sparkles, X, Copy } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import { parseNote } from '@/lib/noteParser'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { isAILimitReached, incrementAIUsage } from '@/lib/aiUsage'
import { waHref } from '@/lib/waLink'
import { generateAchievementMessageAction } from './actions'

function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export default function KazanimlarPage() {
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { data: members, isLoading: mLoading } = useTeamMembers(ws?.workspaceId)
  const { lang, t } = useTranslation()

  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [activeMessage, setActiveMessage] = useState<{
    candidateId: string;
    candidateName: string;
    candidatePhone: string | null;
    message: string;
  } | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const isSuperAdmin = userEmail === 'suattayfuntopak@gmail.com'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const kazananlar = candidates.filter(c => c.stage === 'katildi')

  // Calculate this month's conversions
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const joinedThisMonth = kazananlar.filter(c => {
    if (!c.last_contact_at) return false
    const date = new Date(c.last_contact_at)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length

  // Ranks configuration based on conversions count
  const count = kazananlar.length
  let rankTitle = ''
  let rankBadge = ''
  let rankColorClass = ''
  let rankDesc = ''

  if (lang === 'en') {
    if (count === 0) {
      rankTitle = 'New Explorer'
      rankBadge = '🌱'
      rankColorClass = 'text-slate-500 bg-slate-500/10 border-slate-500/20'
      rankDesc = 'Your team building journey is starting!'
    } else if (count <= 2) {
      rankTitle = 'Team Builder'
      rankBadge = '🛡️'
      rankColorClass = 'text-sky-500 bg-sky-500/10 border-sky-500/20'
      rankDesc = 'Great start! You are laying down the foundation.'
    } else if (count <= 5) {
      rankTitle = 'Group Leader'
      rankBadge = '🔥'
      rankColorClass = 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]'
      rankDesc = 'Superb momentum! Your group is catching fire.'
    } else {
      rankTitle = 'Master Builder'
      rankBadge = '👑'
      rankColorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
      rankDesc = 'Incredible leadership! You are a master team builder.'
    }
  } else {
    if (count === 0) {
      rankTitle = 'Yeni Kaşif'
      rankBadge = '🌱'
      rankColorClass = 'text-slate-500 bg-slate-500/10 border-slate-500/20'
      rankDesc = 'Ekip kurma yolculuğunuz şimdi başlıyor!'
    } else if (count <= 2) {
      rankTitle = 'Ekip Kurucu'
      rankBadge = '🛡️'
      rankColorClass = 'text-sky-500 bg-sky-500/10 border-sky-500/20'
      rankDesc = 'Harika başlangıç! İlk temelleri attınız.'
    } else if (count <= 5) {
      rankTitle = 'Grup Lideri'
      rankBadge = '🔥'
      rankColorClass = 'text-indigo-500 bg-[#EEEDFE] dark:bg-indigo-500/10 border-indigo-500/20'
      rankDesc = 'Müthiş bir ivme! Grubunuz alev alıyor.'
    } else {
      rankTitle = 'Master İnşaatçı'
      rankBadge = '👑'
      rankColorClass = 'text-amber-600 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(217,119,6,0.15)]'
      rankDesc = 'İnanılmaz liderlik! Master düzeyde ekip kurdunuz.'
    }
  }

  async function handleAIMessage(c: any) {
    if (isAILimitReached(isSuperAdmin)) {
      toast.error(`Günlük limitinize ulaştınız. Yarın yenilenir.`)
      return
    }
    setGeneratingFor(c.id)
    try {
      const parsed = parseNote(c.note)
      const result = await generateAchievementMessageAction({
        name: c.full_name,
        note: parsed.tr ?? ''
      })
      if (result.error || !result.message) {
        toast.error(result.error ?? 'Mesaj oluşturulamadı.')
        return
      }
      incrementAIUsage(isSuperAdmin)
      setActiveMessage({
        candidateId: c.id,
        candidateName: c.full_name,
        candidatePhone: c.phone ?? null,
        message: result.message
      })
    } catch (err) {
      console.error(err)
      toast.error('Mesaj oluşturulamadı.')
    } finally {
      setGeneratingFor(null)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Trophy className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('achievements.title') || 'Kazanımlar'}
            </h1>
            <p className="text-xs text-[var(--text-3)] md:text-sm">
              {lang === 'en' ? 'Converted prospects who joined your active team' : 'Ekibinize başarıyla katılan adaylar'}
            </p>
          </div>
        </div>
      </header>

      {wsLoading || cLoading || mLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
            ))}
          </div>
        </div>
      ) : kazananlar.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center bg-[var(--bg-card)]">
          <p className="mb-2 text-3xl">🏆</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">
            {lang === 'en' ? 'No achievements yet' : 'Henüz kazanım yok'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-3)]">
            {lang === 'en' ? "Update your candidates' stages to Joined in Pipeline." : 'Adaylarının aşamalarını Boru Hattı sayfasından Katıldı olarak güncelleyin.'}
          </p>
        </div>
      ) : (
        <>
          {/* Analytics Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            
            {/* Card 1: Total Conversions */}
            <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_4px_12px_rgba(245,158,11,0.03)]">
              <div className="flex items-center justify-between text-[var(--text-3)]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {lang === 'en' ? 'Total Members' : 'Toplam Ekip Üyesi'}
                </span>
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-1)]">{count}</span>
                <span className="text-xs text-[var(--text-3)]">
                  {lang === 'en' ? 'joined' : 'katılımcı'}
                </span>
              </div>
            </div>

            {/* Card 2: This Month's Successes */}
            <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-sky-500/20 hover:shadow-[0_4px_12px_rgba(14,165,233,0.03)]">
              <div className="flex items-center justify-between text-[var(--text-3)]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {lang === 'en' ? 'Conversions This Month' : 'Bu Ay Katılanlar'}
                </span>
                <Calendar className="h-4.5 w-4.5 text-sky-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-1)]">{joinedThisMonth}</span>
                <span className="text-xs text-[var(--text-3)]">
                  {lang === 'en' ? 'this month' : 'bu ay'}
                </span>
              </div>
            </div>

            {/* Card 3: Builder Badge Rank */}
            <div className={`flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(99,102,241,0.03)]`}>
              <div className="flex items-center justify-between text-[var(--text-3)]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {lang === 'en' ? 'Builder Rank' : 'Liderlik Unvanı'}
                </span>
                <Award className="h-4.5 w-4.5 text-indigo-500" />
              </div>
              <div className="mt-4 flex items-center gap-2.5">
                <span className="text-2xl">{rankBadge}</span>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${rankColorClass.split(' ')[0]}`}>{rankTitle}</span>
                  <span className="text-[10px] text-[var(--text-3)] leading-tight">{rankDesc}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Members List Header */}
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              {lang === 'en' ? 'Achievements List' : 'Kazanılan Adaylar Listesi'}
            </h2>
            <span className="text-xs text-[var(--text-3)]">
              {lang === 'en' ? 'Click on a card to see profile detail' : 'Detayları görmek için karta tıklayın'}
            </span>
          </div>

          {/* Converted Candidates List */}
          <ul className="space-y-3">
            {kazananlar.map(c => {
              const parsed = parseNote(c.note)
              const isTeamMember = members?.some(m =>
                m.role === 'member' &&
                m.full_name?.toLowerCase().trim() === c.full_name.toLowerCase().trim()
              )
              return (
                <li key={c.id} className="relative group">
                  <Link
                    href={`/pipeline/${c.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:scale-[1.01] hover:border-amber-500/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] cursor-pointer"
                  >
                    
                    {/* Candidate Avatar (Cloud URL or Initials fallback) */}
                    {parsed.avatarUrl ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
                        <img
                          src={parsed.avatarUrl}
                          alt={c.full_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-500/5 text-sm font-bold text-amber-700">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Member Details */}
                    <div className="min-w-0 flex-1 pr-12">
                      <p className="truncate text-sm font-semibold text-[var(--text-1)] group-hover:text-amber-600 transition-colors flex items-center gap-1.5 flex-wrap">
                        {c.full_name}
                        {isTeamMember && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EEEDFE] dark:bg-[#534AB7]/10 border border-[#d4d0f7] dark:border-[#534AB7]/20 px-2 py-0.5 text-[9px] font-extrabold text-[#534AB7] dark:text-[#c4b5fd] uppercase tracking-wider">
                            💎 {lang === 'en' ? 'IN MY TEAM' : 'EKİBİMDE'}
                          </span>
                        )}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </p>
                      {c.last_contact_at && (
                        <p className="text-xs text-[var(--text-3)]">
                          {lang === 'en' ? 'Joined' : 'Katıldı'}: {formatDate(c.last_contact_at, lang)}
                        </p>
                      )}
                    </div>

                    {/* Action buttons (Bot + WhatsApp + Joined Badge) */}
                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* Bot Button (congratulations message) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleAIMessage(c)
                        }}
                        disabled={generatingFor === c.id}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-all active:scale-90 disabled:opacity-50"
                        title={lang === 'en' ? 'Generate AI Welcoming Message' : 'YZ Tebrik Mesajı Üret'}
                      >
                        {generatingFor === c.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
                        ) : (
                          <Bot className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        )}
                      </button>

                      {/* WhatsApp Button (Only shown if phone number exists) */}
                      {c.phone && (
                        <a
                          href={waHref(c.phone, lang === 'en'
                            ? `Hi ${c.full_name}, welcome to our team! We will achieve great things together. 🚀`
                            : `Merhaba ${c.full_name}, ekibe hoş geldin! Seninle birlikte harika şeyler başaracağız. 🚀`
                          )!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-90"
                          title={lang === 'en' ? 'Chat on WhatsApp' : 'WhatsApp İle Mesaj Gönder'}
                          onClick={(e) => e.stopPropagation()} // Stop clicking candidate link
                        >
                          <WhatsAppIcon className="h-4.5 w-4.5" />
                        </a>
                      )}

                      {/* Joined Tag Badge */}
                      <span className="rounded-full bg-[#E1F5EE] dark:bg-[#0F6E56]/10 border border-[#E1F5EE] dark:border-[#0F6E56]/20 px-2.5 py-1 text-[10px] font-semibold text-[#0F6E56] dark:text-[#E1F5EE]">
                        {lang === 'en' ? 'Joined ✅' : 'Katıldı ✅'}
                      </span>

                    </div>

                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* AI Message Result Modal */}
      {activeMessage && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveMessage(null)} />
          
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Sparkles className="h-4.5 w-4.5 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-1)]">Yapay Zeka Mesajı</h2>
                  <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">{activeMessage.candidateName} için üretildi</p>
                </div>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Textarea */}
            <div className="relative mb-5">
              <textarea
                value={activeMessage.message}
                readOnly
                rows={6}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] leading-relaxed outline-none resize-none"
              />
            </div>

            {/* Actions: ONLY Copy and WhatsApp icons, WITHOUT ANY text */}
            <div className="flex justify-end gap-2.5">
              {/* Copy Button (Only Icon) */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeMessage.message)
                  toast.success('Mesaj kopyalandı!')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-amber-50 hover:text-amber-600 active:scale-95 cursor-pointer"
                title="Kopyala"
              >
                <Copy className="h-4 w-4" />
              </button>

              {/* WhatsApp Button (Only Icon) */}
              {activeMessage.candidatePhone && waHref(activeMessage.candidatePhone, activeMessage.message) && (
                <a
                  href={waHref(activeMessage.candidatePhone, activeMessage.message)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setActiveMessage(null)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:opacity-90 active:scale-95 shadow-[0_4px_12px_rgba(37,211,102,0.2)] cursor-pointer"
                  title="WhatsApp ile Gönder"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
