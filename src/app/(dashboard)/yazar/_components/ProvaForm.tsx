'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Zap, Phone, Shield, BarChart3, Target, Clock, Users, RefreshCw,
  MessageSquare, UserCheck, Heart, UserPlus, ArrowLeft, Send, Sparkles, X, Loader2
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { generateRoleplayResponseAction } from '../actions'
import { toast } from 'sonner'

interface Scenario {
  id: string
  emoji: string
  icon: any
  titleTr: string
  titleEn: string
  descTr: string
  descEn: string
  initialPromptTr: string
  initialPromptEn: string
  color: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'davet',
    emoji: '📞',
    icon: Phone,
    titleTr: 'Davet Pratiği',
    titleEn: 'Invitation Practice',
    descTr: 'Soğuk veya sıcak adaya merak uyandırarak davet mesajı gönderme',
    descEn: 'Send a high-curiosity invite message to a cold or hot prospect',
    initialPromptTr: 'Ben sıcak bir adayım. Bana toplantıya davet eden samimi bir mesaj gönder!',
    initialPromptEn: 'I am a warm prospect. Send me a friendly invitation to a meeting!',
    color: 'border-blue-100 text-blue-600 dark:border-blue-900/30 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/10'
  },
  {
    id: 'itiraz',
    emoji: '🛡️',
    icon: Shield,
    titleTr: 'İtiraz Karşılama Pratiği',
    titleEn: 'Objection Handling',
    descTr: '"Para yok", "Zamanım yok" gibi gerçekçi itirazları profesyonelce yönetme',
    descEn: 'Professionally manage realistic objections like "no money" or "no time"',
    initialPromptTr: 'Sana "Bu işler bana göre değil, zamanım yok" diyorum. Beni ikna et!',
    initialPromptEn: 'I tell you "This is not for me, I have no time". Convince me!',
    color: 'border-red-100 text-red-600 dark:border-red-900/30 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10'
  },
  {
    id: 'sunum',
    emoji: '📊',
    icon: BarChart3,
    titleTr: 'Sunum Pratiği',
    titleEn: 'Presentation Practice',
    descTr: '90 saniyede kişisel hikaye anlatımı ve iş fırsatı aktarma',
    descEn: 'Share your personal story and the business opportunity in 90 seconds',
    initialPromptTr: 'Şirketini ve iş fırsatını 90 saniyede bana anlat, merak edip dinlemek isteyeyim!',
    initialPromptEn: 'Pitch me your company and opportunity in 90 seconds so I want to listen!',
    color: 'border-purple-100 text-purple-600 dark:border-purple-900/30 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/10'
  },
  {
    id: 'kapanis',
    emoji: '🎯',
    icon: Target,
    titleTr: 'Kapanış Pratiği',
    titleEn: 'Closing Practice',
    descTr: 'Karar veremeyen kararsız adayı nazikçe karara yönlendirme',
    descEn: 'Gently guide a hesitant, undecided prospect towards a final decision',
    initialPromptTr: 'Sunumu dinledim, beğendim ama karar veremiyorum, kararsızım. Kapanış konuşmasını yap!',
    initialPromptEn: 'I listened to the presentation, I liked it but I am hesitant. Do the closing pitch!',
    color: 'border-emerald-100 text-emerald-600 dark:border-emerald-900/30 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10'
  },
  {
    id: 'takip',
    emoji: '⏳',
    icon: Clock,
    titleTr: 'Takip Pratiği',
    titleEn: 'Follow-up Practice',
    descTr: 'Sunumdan sonra 3 gündür sessiz kalan adayla yeniden bağ kurma',
    descEn: 'Reconnect with a prospect who went silent for 3 days after the pitch',
    initialPromptTr: '3 gündür sessiz kalan bir adayım, sunumdan sonra hiç yazmadım. Yeniden bağlantı kur!',
    initialPromptEn: 'I am a prospect who went silent for 3 days after the pitch. Reconnect with me!',
    color: 'border-amber-100 text-amber-600 dark:border-amber-900/30 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10'
  },
  {
    id: 'ise_alim',
    emoji: '🤝',
    icon: UserPlus,
    titleTr: 'İşe Alım Pratiği',
    titleEn: 'Onboarding Practice',
    descTr: 'Ekibe yeni katılan distribütörle ilk adım planlamasını yapma',
    descEn: 'Plan the critical first steps with a newly recruited distributor partner',
    initialPromptTr: 'Ekibine yeni katıldım, çok heyecanlıyım ama ne yapacağımı bilmiyorum. İlk adımı planlayalım!',
    initialPromptEn: 'I just joined your team, I am excited but clueless. Let\'s plan our first step!',
    color: 'border-indigo-100 text-indigo-600 dark:border-indigo-900/30 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/10'
  },
  {
    id: 'donusum',
    emoji: '🔄',
    icon: Users,
    titleTr: 'Müşteri ➔ Distribütör',
    titleEn: 'Client ➔ Partner',
    descTr: 'Memnun bir müşteriyi iş ortağı olmaya ve işi kurmaya davet etme',
    descEn: 'Invite a highly satisfied customer to upgrade into a business partner',
    initialPromptTr: 'Ürünleri çok beğendim, düzenli kullanıyorum. Beni bir iş ortağı olmaya davet et!',
    initialPromptEn: 'I love the products and use them regularly. Invite me to become a business partner!',
    color: 'border-teal-100 text-teal-600 dark:border-teal-900/30 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/10'
  },
  {
    id: 'motivasyon',
    emoji: '🔥',
    icon: Heart,
    titleTr: 'Ekip Motivasyonu',
    titleEn: 'Team Motivation',
    descTr: 'Reddedilen ve inancı düşen ekibe mentörlük ve moral koçluğu yapma',
    descEn: 'Coach and motivate a team member who got rejected and lost confidence',
    initialPromptTr: 'Bugün üst üste 3 hayır aldım, moralim sıfır, bu işi yapamayacağımı düşünüyorum. Bana koçluk yap!',
    initialPromptEn: 'I got 3 rejections in a row today, I\'m demotivated and think I can\'t do this. Coach me!',
    color: 'border-rose-100 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/10'
  },
  {
    id: 'liderlik',
    emoji: '👑',
    icon: UserCheck,
    titleTr: '1\'e 1 Lider Koçluğu',
    titleEn: '1-on-1 Leader Coach',
    descTr: 'Büyümesi duran ve distribütörleri inaktif olan lidere rehberlik etme',
    descEn: 'Guide a key downline leader whose team growth has stalled',
    initialPromptTr: 'Ekibim büyüdü ama kimse çalışmıyor, ciro düştü, tıkandım. Bir lider olarak bana yol göster!',
    initialPromptEn: 'My team grew but nobody is active, sales fell, I\'m stuck. As a leader, guide me!',
    color: 'border-violet-100 text-violet-600 dark:border-violet-900/30 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/10'
  },
  {
    id: 'soguk_cevre',
    emoji: '❄️',
    icon: Compass,
    titleTr: 'Soğuk Çevre Pratiği',
    titleEn: 'Cold Market Practice',
    descTr: 'Yabancı bir kişiyle teklif yapmadan önce samimi ve doğal bağ kurma',
    descEn: 'Build natural trust and rapport with a cold prospect before pitching',
    initialPromptTr: 'Sosyal medyadan yeni tanıştığın biriyim. İş konuşmadan önce benimle doğal bir bağ kur!',
    initialPromptEn: 'I am someone you just met on social media. Build a natural connection before pitching!',
    color: 'border-cyan-100 text-cyan-600 dark:border-cyan-900/30 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/10'
  }
]

import { Compass } from 'lucide-react'

interface Message {
  role: 'candidate' | 'user' | 'yzk'
  text: string
  score?: number
  strengths?: string[]
  improvements?: string
}

export function ProvaForm() {
  const { lang } = useTranslation()
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectScenario(s: Scenario) {
    setActiveScenario(s)
    const initText = lang === 'en' ? s.initialPromptEn : s.initialPromptTr
    setMessages([
      {
        role: 'candidate',
        text: initText
      }
    ])
  }

  function resetSession() {
    if (activeScenario) {
      const initText = lang === 'en' ? activeScenario.initialPromptEn : activeScenario.initialPromptTr
      setMessages([
        {
          role: 'candidate',
          text: initText
        }
      ])
      setInputValue('')
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || isPending || !activeScenario) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsPending(true)

    // Append user's reply locally
    const updatedMessages = [
      ...messages,
      { role: 'user' as const, text: userMessage }
    ]
    setMessages(updatedMessages)

    try {
      // Build simple serializable message history for the LLM
      const history = updatedMessages.map(m => ({
        role: m.role,
        text: m.text,
        score: m.score,
        strengths: m.strengths,
        improvements: m.improvements
      }))

      const result = await generateRoleplayResponseAction(
        activeScenario.id,
        history,
        userMessage,
        lang
      )

      if (result.error) {
        toast.error(result.error)
        // Rollback user message on quota failure
        setMessages(messages)
      } else if (result.candidate_reply) {
        // Set remaining limits if returned
        if (typeof result.remaining === 'number') {
          setRemainingUsage(result.remaining)
        }

        // Append YZK feedback + candidate response
        setMessages(prev => [
          ...prev,
          {
            role: 'yzk',
            text: '', // Feedback card doesn't need simple text
            score: result.yzk_score,
            strengths: result.yzk_strengths,
            improvements: result.yzk_improvements
          },
          {
            role: 'candidate',
            text: result.candidate_reply || ''
          }
        ])
      }
    } catch (err) {
      console.error(err)
      toast.error(lang === 'en' ? 'Something went wrong.' : 'Bir hata oluştu.')
      setMessages(messages)
    } finally {
      setIsPending(false)
    }
  }

  if (activeScenario) {
    const scTitle = lang === 'en' ? activeScenario.titleEn : activeScenario.titleTr
    return (
      <div className="mx-auto max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
          <button 
            onClick={() => {
              setActiveScenario(null)
              setMessages([])
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-3)] hover:text-[#D97706] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'en' ? 'Change Scenario' : 'Senaryoyu Değiştir'}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${activeScenario.color}`}>
              <Sparkles className="h-3 w-3 shrink-0 animate-pulse" />
              {scTitle}
            </span>
            <button 
              onClick={resetSession}
              title={lang === 'en' ? 'Reset Simulation' : 'Sıfırla'}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition active:scale-90"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Timeline */}
        <div className="h-[55vh] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {messages.map((m, idx) => {
            if (m.role === 'candidate') {
              return (
                <div key={idx} className="flex gap-2.5 items-start animate-in slide-in-from-left duration-200">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-black shadow-sm text-slate-700 dark:text-slate-300">
                    👤
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-4 py-3 text-sm text-[var(--text-1)] max-w-[85%] shadow-sm leading-relaxed">
                    {m.text}
                  </div>
                </div>
              )
            } else if (m.role === 'user') {
              return (
                <div key={idx} className="flex gap-2.5 items-start justify-end animate-in slide-in-from-right duration-200">
                  <div className="rounded-2xl rounded-tr-none bg-[#D97706] text-white px-4 py-3 text-sm max-w-[85%] shadow-md leading-relaxed">
                    {m.text}
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black shadow-sm text-amber-800">
                    🙋‍♂️
                  </div>
                </div>
              )
            } else if (m.role === 'yzk') {
              return (
                <div key={idx} className="flex gap-2.5 items-start animate-in zoom-in duration-300">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-black shadow-md">
                    🤖
                  </div>
                  {/* Gold/Amber Framed Premium YZK Feedback Card */}
                  <div className="flex-1 rounded-2xl border-2 border-amber-200 bg-amber-500/5 dark:border-amber-900/40 p-4 shadow-sm max-w-[90%] space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/30 pb-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {lang === 'en' ? 'AI COACH MENTOR NOTE' : 'YAPAY ZEKA KOÇU DEĞERLENDİRME NOTU'}
                      </p>
                      <span className="rounded-full bg-[#D97706] text-white px-2 py-0.5 text-xs font-black shadow-md animate-pulse">
                        {m.score}/100
                      </span>
                    </div>

                    <div className="space-y-2 text-xs leading-relaxed text-[var(--text-1)]">
                      {m.strengths && m.strengths.length > 0 && (
                        <div>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                            ✅ {lang === 'en' ? 'Strengths:' : 'Güçlü Yönlerin:'}
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[var(--text-2)] font-medium">
                            {m.strengths.map((str, sIdx) => <li key={sIdx}>{str}</li>)}
                          </ul>
                        </div>
                      )}

                      {m.improvements && (
                        <div>
                          <p className="font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                            💡 {lang === 'en' ? 'Mentorship Advice:' : 'Liderlik Tavsiyesi:'}
                          </p>
                          <p className="pl-4 text-[var(--text-2)] font-medium border-l-2 border-amber-300 dark:border-amber-800">
                            {m.improvements}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })}

          {isPending && (
            <div className="flex gap-2.5 items-start animate-in fade-in duration-200">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-black shadow-md">
                🤖
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-amber-500/5 border border-amber-200/50 dark:border-amber-900/20 px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-sm animate-pulse">
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>{lang === 'en' ? 'AI Coach is analyzing your message...' : 'Koçunuz yazınızı analiz ediyor ve hazırlanıyor...'}</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-[var(--border)] pt-4">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isPending}
            placeholder={lang === 'en' ? 'Type your practice response...' : 'Pratik yanıtını buraya yaz...'}
            className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#D97706] focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-950/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D97706] text-white shadow-md transition hover:bg-[#b45309] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Usage notification */}
        {remainingUsage !== null && (
          <p className="mt-2 text-center text-[10px] font-semibold text-[var(--text-3)] animate-pulse">
            {lang === 'en' ? `Remaining AI Roleplay Credits: ${remainingUsage}` : `Kalan Günlük Simülasyon Krediniz: ${remainingUsage}`}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Intro info box */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center bg-[var(--bg-card)] max-w-xl mx-auto shadow-sm animate-in fade-in duration-300">
        <span className="text-3xl leading-none block mb-2">🎭</span>
        <h2 className="text-sm font-bold text-[var(--text-1)]">
          {lang === 'en' ? 'Select Scenario, Start Rehearsing!' : 'Senaryo seç, prova başlasın!'}
        </h2>
        <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed max-w-md mx-auto">
          {lang === 'en'
            ? 'The AI acts as a realistic prospect or team member. Type your replies, receive direct mentor scores, strengths, and leadership tips.'
            : 'YZ aday veya yeni ortak rolüne girer; distribütörü zorlayan gerçekçi itirazlar sunar. Yazdığınız her yanıttan sonra net YZK notu ve puan kazanırsınız.'}
        </p>
      </div>

      {/* 10 Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {SCENARIOS.map(s => {
          const Icon = s.icon
          const title = lang === 'en' ? s.titleEn : s.titleTr
          const desc = lang === 'en' ? s.descEn : s.descTr
          return (
            <button
              key={s.id}
              onClick={() => selectScenario(s)}
              className="group flex gap-3 text-left rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-4.5 transition-all hover:scale-[1.01] hover:border-[#D97706]/30 hover:shadow-lg active:scale-[0.99] animate-in fade-in duration-300"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition group-hover:scale-105 ${s.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black tracking-widest text-[#D97706] uppercase mb-0.5">
                  {s.emoji} SIMULATION
                </p>
                <h3 className="text-sm font-bold text-[var(--text-1)] group-hover:text-[#D97706] transition-colors truncate">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-2)] leading-relaxed line-clamp-2">
                  {desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
