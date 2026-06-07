'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Phone, Shield, BarChart3, Target, Clock, Users, RefreshCw,
  UserCheck, Heart, UserPlus, ArrowLeft, Send, Sparkles, Loader2,
  Compass
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { pickLangField } from '@/lib/utils/pickLang'
import { generateRoleplayResponseAction } from '../actions'
import { toast } from 'sonner'
import { useAILimits } from '@/hooks/useAILimits'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'

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
  },
  {
    id: 'sosyal_aday',
    emoji: '📱',
    icon: Compass,
    titleTr: 'Sosyal Medya Adayı',
    titleEn: 'Social Media Prospect',
    descTr: 'Sosyal medyada gönderini beğenen meraklı yabancı adayı sunuma davet etme',
    descEn: 'Invite an interested stranger who liked your social post to a presentation',
    initialPromptTr: 'Ben senin Instagram gönderini beğenen ve meraklı olan biriyim. İşinin ne olduğunu merak ettim, DM\'den yazıyorum. Bana işi anlatmadan merak uyandırarak sunuma davet et!',
    initialPromptEn: 'I am someone who liked your Instagram post and am curious. I\'m DMing you to ask what your business is. Invite me to the presentation with high curiosity without explaining the business yet!',
    color: 'border-teal-100 text-teal-600 dark:border-teal-900/30 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/10'
  },
  {
    id: 'etik_pazarlama',
    emoji: '⚖️',
    icon: Shield,
    titleTr: 'Etik Pazarlama Pratiği',
    titleEn: 'Ethical Pitching',
    descTr: 'Sağlık veya gelir abartısı yapmadan adaya yasal ve dürüst ürün tanıtımı yapma',
    descEn: 'Present the product legally and honestly without making exaggerated medical/income claims',
    initialPromptTr: 'Ben ürünleri merak eden titiz ve şüpheci bir adayım. Ürünlerin hastalıkları iyileştirip iyileştirmediğini soruyorum. Hiçbir abartı yapmadan dürüst ve yasal kurallara uygun şekilde ürününü tanıt!',
    initialPromptEn: 'I am a meticulous and skeptical prospect curious about products. I am asking if they cure diseases. Pitch me your product honestly and legally without exaggerations!',
    color: 'border-slate-100 text-slate-600 dark:border-slate-900/30 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/10'
  }
]

const OBJECTION_PROMPTS = [
  {
    tr: 'Sana kibarca "Aslında iş güzel ama benim bu işi yapacak hiç çevrem yok" diyorum. Bana kibar bir yaklaşımla cevap ver!',
    en: 'I politely tell you "Actually the business is nice but I have no network to do this". Reply to me with a polite approach!'
  },
  {
    tr: 'Sana şüpheci ve soğuk bir tavırla "Bu işler saadet zinciri / titan zinciri değil mi? İnsanları kandırıp para kazanıyorsunuz" diyorum. Beni ikna et!',
    en: 'I tell you skeptically and coldly "Isn\'t this a pyramid scheme? You earn money by fooling people". Convince me!'
  },
  {
    tr: 'Aceleci ve meşgul bir ses tonuyla "Kardeşim çok acelem var, sadede gel. Benim bu işlere hiç zamanım yok" diyorum. Bana pratik bir cevap ver!',
    en: 'In a rushed and busy tone, I tell you "Brother, I\'m in a big rush, get to the point. I have no time for these things". Give me a practical response!'
  },
  {
    tr: 'Karamsar ve kaba bir tavırla "Geç bunları, benim bir arkadaşım girdi bu işe, batıp para kaybetti. Hepsi yalan!" diyorum. Beni ikna et!',
    en: 'In a pessimistic and rude tone, I tell you "Forget all this, a friend of mine got into this, went broke and lost money. It\'s all a lie!" Convince me!'
  },
  {
    tr: 'Meraklı ama kararsız bir şekilde "Ürünleriniz çok güzel görünüyor ama çok pahalı. Kimse bu devirde buna para vermez." diyorum. İtirazımı karşıla!',
    en: 'Curiously but hesitantly, I tell you "Your products look great but they are very expensive. No one will spend money on this nowadays." Handle my objection!'
  },
  {
    tr: 'Muhafazakar ve şüpheli bir edayla "Bu sistem dinen caiz mi? Üsttekiler alttakilerin sırtından helal olmayan para kazanıyor diyorlar." diyorum. Beni aydınlat!',
    en: 'With a conservative and suspicious vibe, I say "Is this system religiously permissible? They say people at the top make non-permissible money off the back of people at the bottom." Enlighten me!'
  },
  {
    tr: 'Çekingen ve kaba bir şekilde "Ben asla satış yapamam, insanlara bir şey pazarlama fikri bana çok itici geliyor." diyorum. Yaklaşımını göster!',
    en: 'Shyly and bluntly, I tell you "I can never sell, the idea of marketing anything to people is highly repulsive to me." Show me your approach!'
  }
]

const DYNAMIC_PROMPTS: Record<string, { tr: string; en: string }[]> = {
  itiraz: OBJECTION_PROMPTS,
  davet: [
    {
      tr: 'Ben senin liseden beri görüşmediğin eski bir arkadaşınım. Sosyal medyadan hal hatır sorarken bana teklif yapmadan samimi bir mesaj at!',
      en: 'I am an old high school friend of yours whom you haven\'t spoken to in years. Send me a friendly message without pitching yet while catch up!'
    },
    {
      tr: 'Ben LinkedIn üzerinden eklediğin profesyonel biriyim. Sektör hakkında konuşmak istiyorsun, bana iş odaklı şık bir davet mesajı yaz!',
      en: 'I am a professional you added on LinkedIn. You want to talk about the industry, write me a sleek, business-oriented invitation!'
    },
    {
      tr: 'Ben senin yakın ve samimi bir arkadaşınım. Beni iş sunumuna davet eden heyecanlı ve samimi bir mesaj gönder!',
      en: 'I am a close, personal friend of yours. Send me an excited and friendly invite message to the business presentation!'
    }
  ],
  kapanis: [
    {
      tr: 'Sunumu dinledim, beğendim ama karar veremiyorum, çok kararsızım. Kapanış konuşmasını yap!',
      en: 'I listened to the presentation, I liked it but I am hesitant. Do the closing pitch!'
    },
    {
      tr: 'Sunumu dinledim ama "Ya yapamazsam, ya param boşa giderse" diye korkuyorum. Beni korkularım konusunda rahatlat!',
      en: 'I listened to the presentation but I\'m afraid "What if I can\'t do it, what if my money is wasted". Comfort me regarding my fears!'
    },
    {
      tr: 'Sunumu izledim. "Şu an param yok ama başlamak istiyorum, borç mu alsam acaba?" diyorum. Bana bir lider olarak yol göster!',
      en: 'I watched the presentation. I say "I don\'t have money right now but I want to start, should I borrow some?". As a leader, guide me!'
    }
  ]
}

function getInitialPrompt(s: Scenario, lang: string): string {
  const dynamics = DYNAMIC_PROMPTS[s.id]
  if (dynamics && dynamics.length > 0) {
    const randomPrompt = dynamics[Math.floor(Math.random() * dynamics.length)]
    return pickLangField(randomPrompt.tr, randomPrompt.en, lang as 'tr' | 'en')
  }
  return pickLangField(s.initialPromptTr, s.initialPromptEn, lang as 'tr' | 'en')
}

interface Message {
  role: 'candidate' | 'user' | 'yzk'
  text: string
  score?: number
  strengths?: string[]
  improvements?: string
}

export function ProvaForm() {
  const { t, lang } = useTranslation()
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null)

  const { data: ws } = useWorkspace()
  const qc = useQueryClient()
  const { isSuperAdmin, roleplayUsed, limits } = useAILimits()
  const roleplayLimit = limits.roleplayLimit

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectScenario(s: Scenario) {
    setActiveScenario(s)
    const initText = getInitialPrompt(s, lang)
    setMessages([
      {
        role: 'candidate',
        text: initText
      }
    ])
  }

  function resetSession() {
    if (activeScenario) {
      const initText = getInitialPrompt(activeScenario, lang)
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
        invalidateTeamAndAIUsage(qc, ws?.workspaceId)

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
      toast.error(t('coachUi.somethingWrong'))
      setMessages(messages)
    } finally {
      setIsPending(false)
    }
  }

  if (activeScenario) {
    const scTitle = pickLangField(activeScenario.titleTr, activeScenario.titleEn, lang as 'tr' | 'en')
    return (
      <div className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
          <button 
            onClick={() => {
              setActiveScenario(null)
              setMessages([])
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-3)] hover:text-[#D97706] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('coachUi.changeScenario')}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${activeScenario.color}`}>
              <Sparkles className="h-3 w-3 shrink-0 animate-pulse" />
              {scTitle}
            </span>
            <button 
              onClick={resetSession}
              title={t('coachUi.resetSimulation')}
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-sm font-black shadow-sm text-slate-700 dark:text-slate-300">
                    👤
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-4 py-3 text-base text-[var(--text-1)] max-w-[85%] shadow-sm leading-relaxed">
                    {m.text}
                  </div>
                </div>
              )
            } else if (m.role === 'user') {
              return (
                <div key={idx} className="flex gap-2.5 items-start justify-end animate-in slide-in-from-right duration-200">
                  <div className="rounded-2xl rounded-tr-none bg-[#D97706] text-white px-4 py-3 text-base max-w-[85%] shadow-md leading-relaxed">
                    {m.text}
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black shadow-sm text-amber-800">
                    🙋‍♂️
                  </div>
                </div>
              )
            } else if (m.role === 'yzk') {
              return (
                <div key={idx} className="flex gap-2.5 items-start animate-in zoom-in duration-300">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-black shadow-md">
                    🤖
                  </div>
                  {/* Gold/Amber Framed Premium YZK Feedback Card */}
                  <div className="flex-1 rounded-2xl border-2 border-amber-200 bg-amber-500/5 dark:border-amber-900/40 p-4 shadow-sm max-w-[90%] space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/30 pb-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {t('coachUi.mentorNote')}
                      </p>
                      <span className="rounded-full bg-[#D97706] text-white px-2 py-0.5 text-sm font-black shadow-md animate-pulse">
                        {m.score}/100
                      </span>
                    </div>

                    <div className="space-y-2 text-sm leading-relaxed text-[var(--text-1)]">
                      {m.strengths && m.strengths.length > 0 && (
                        <div>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                            ✅ {t('coachUi.strengths')}
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[var(--text-2)] font-medium">
                            {m.strengths.map((str, sIdx) => <li key={sIdx}>{str}</li>)}
                          </ul>
                        </div>
                      )}

                      {m.improvements && (
                        <div>
                          <p className="font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                            💡 {t('coachUi.mentorshipAdvice')}
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-black shadow-md">
                🤖
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-amber-500/5 border border-amber-200/50 dark:border-amber-900/20 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 shadow-sm animate-pulse">
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>{t('coachUi.analyzingMessage')}</span>
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
            placeholder={t('coachUi.practiceInputPlaceholder')}
            className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-base text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#D97706] focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-950/20 disabled:opacity-60"
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Intro info box */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center bg-[var(--bg-card)] w-full shadow-sm animate-in fade-in duration-300">
        <span className="text-4xl leading-none block mb-2">🎭</span>
        <h2 className="text-base font-bold text-[var(--text-1)]">
          {t('coachUi.selectScenarioTitle')}
        </h2>
        {!isSuperAdmin && (
          <p className="mt-2.5 text-sm font-bold text-[var(--text-3)]">
            {t('coachUi.dailyRoleplayQuota', { used: roleplayUsed, limit: roleplayLimit })}
          </p>
        )}
      </div>

      {/* 10 Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {SCENARIOS.map(s => {
          const Icon = s.icon
          const title = pickLangField(s.titleTr, s.titleEn, lang as 'tr' | 'en')
          const desc = pickLangField(s.descTr, s.descEn, lang as 'tr' | 'en')
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
                  {s.emoji} {t('coachUi.simulation')}
                </p>
                <h3 className="text-base font-bold text-[var(--text-1)] group-hover:text-[#D97706] transition-colors truncate">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm text-[var(--text-2)] leading-relaxed line-clamp-2">
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
