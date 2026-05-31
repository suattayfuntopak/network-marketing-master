'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function LandingFaq() {
  const { lang } = useTranslation()
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  const faqData = {
    tr: [
      {
        id: 'faq-1',
        question: 'Verilerim nerede saklanıyor?',
        answer: 'Verileriniz, dünya standartlarında güvenlik önlemlerine (SOC2, ISO 27001) sahip Avrupa merkezli Supabase bulut sunucularında uçtan uca şifrelenmiş olarak saklanır. Aday listeleriniz ve ekip verileriniz tamamen size özeldir ve hiçbir üçüncü tarafla paylaşılmaz.',
      },
      {
        id: 'faq-2',
        question: 'Bu uygulama belirli bir Ağ Pazarlama/MLM şirketine bağlı mı?',
        answer: 'Hayır. Network Marketing Master bağımsız bir yazılımdır. Hangi şirket veya ürün grubu ile çalışırsanız çalışın, aday takip huninizi, eğitimlerinizi ve diğer tüm hususları kendi işinize göre tamamen özelleştirebilirsiniz.',
      },
      {
        id: 'faq-3',
        question: 'Yeni başlayan biri için kullanımı zor mu?',
        answer: 'Kesinlikle hayır! Platform, yeni distribütörlerin adaptasyonunu hızlandırmak için tasarlanmıştır. "Doğru Başlangıç Rehberi" adımları, yeni başlayanların ilk 4 haftalık kritik aksiyonlarını adım adım, oyunlaştırılmış bir tik listesiyle kolayca tamamlamasını sağlar.',
      },
      {
        id: 'faq-4',
        question: 'Ekibimle birlikte kullanabilir miyim?',
        answer: 'Evet! Plus ve Pro planları ile alt ekibinizin aday sayılarını ve "Doğru Başlangıç" ilerlemelerini tek bir panelden takip edebilirsiniz. Ekip panelinden paylaşacağınız davet koduyla saha ortaklarınızı anında ekibinize bağlayabilirsiniz.',
      },
      {
        id: 'faq-5',
        question: 'Bu uygulama sadece mesaj yazdıran bir yapay zeka aracı mı?',
        answer: 'Elbette hayır, çok daha fazlası! Yapay Zeka (YZ) mesaj üreticisinin yanı sıra, interaktif YZ Saha Provası modülü sayesinde ilgili senaryoları seçip yapay zeka ile canlı yazışarak provalar yapabilir, YZ Koçu\'na dilediğiniz Ağ Pazarlama/MLM stratejileri ve liderlik sorularını sorabilirsiniz.',
      },
      {
        id: 'faq-6',
        question: 'Yapay zeka kullanımı nasıl ücretlendiriliyor?',
        answer: 'Ekstra bir ücret ödemezsiniz. Seçtiğiniz üyelik planına (Basic, Plus, Pro) göre günlük YZ Mesajı, YZ Koçu, Saha Provası ve Uyum Merkezi kredileriniz her gün otomatik olarak yenilenir.',
      },
      {
        id: 'faq-7',
        question: 'Mobilde çalışıyor mu?',
        answer: 'Evet! Network Marketing Master mobil öncelikli (mobile-first) duyarlı bir tasarıma sahiptir. Sahada veya yoldayken telefonunuzun tarayıcısından tüm panolara, YZ provasına ve aday listenize kusursuzca erişebilirsiniz.',
      },
      {
        id: 'faq-8',
        question: 'Farklı modüller gerçekten birlikte çalışıyor mu?',
        answer: 'Evet, tamamen entegre çalışır. Örneğin, boru hattına eklediğiniz bir adayın geçmişi ve son notları, YZ Mesaj üreticisine otomatik bağlam sağlar. Böylece yapay zeka, adayın tüm geçmişini bilerek en uygun takip mesajını hazırlar.',
      },
      {
        id: 'faq-9',
        question: 'Kimler için en uygun?',
        answer: 'Bireysel satış yapan bağımsız temsilcilerden, yüzlerce kişilik organizasyonları yöneten ve ekibinin başlangıç süreçlerini standartlaştırarak zamandan tasarruf etmek isteyen büyük takım liderlerine kadar her seviyedeki ağ pazarlamacısı için mükemmeldir.',
      },
      {
        id: 'faq-10',
        question: 'Ne kadar sürede sonuç görürüm?',
        answer: 'İlk günden itibaren düzen ve hız kazanımı hissedebilirsiniz; ancak sonuçlar (takdir edersiniz ki) kişiden kişiye, liderden lidere değişir ve uygulamayı ne kadar doğru ve disiplinli kullandığınız sonuçları doğrudan etkiler. NMM bir sihirli değnek değil, işleri kolaylaştıran güçlü bir araçtır.',
      },
    ],
    en: [
      {
        id: 'faq-1',
        question: 'Where is my data stored?',
        answer: 'Your data is stored fully encrypted in European Supabase cloud servers that meet world-class security standards (SOC2, ISO 27001). Your prospect lists and team metrics are entirely private to you and never shared with third parties.',
      },
      {
        id: 'faq-2',
        question: 'Is this application tied to a specific Network Marketing/MLM company?',
        answer: 'No. Network Marketing Master is an independent software. Regardless of the company or product line you represent, you can fully customize your prospect funnel, team training, and all other aspects to fit your specific business.',
      },
      {
        id: 'faq-3',
        question: 'Is it hard to use for a beginner?',
        answer: 'Absolutely not! The platform is designed to accelerate the onboarding of new distributors. The "Quick Start Guide" ensures beginners can easily complete their critical first 4 weeks of actions through a step-by-step, gamified checklist.',
      },
      {
        id: 'faq-4',
        question: 'Can I use it together with my team?',
        answer: 'Yes! With our Plus and Pro plans, you can track your downline\'s prospect counts and "Quick Start" onboarding progress from a single dashboard. You can instantly link downline members using the invitation code shared from your Team panel.',
      },
      {
        id: 'faq-5',
        question: 'Is this application just an AI tool that writes messages?',
        answer: 'Of course not, it is much more! In addition to the AI message generator, our interactive AI Rehearsal module lets you select scenarios and chat live with artificial intelligence to conduct roleplay trials, and you can consult the AI Coach for any Network Marketing/MLM strategy and leadership questions.',
      },
      {
        id: 'faq-6',
        question: 'How is AI usage charged?',
        answer: 'There are no extra charges. Based on your selected subscription tier (Basic, Plus, Pro), your daily AI Message, AI Coach, Rehearsal, and Compliance credits are automatically renewed every day at midnight.',
      },
      {
        id: 'faq-7',
        question: 'Does it work on mobile?',
        answer: 'Yes! Network Marketing Master features a fully responsive, mobile-first design. Whether you are in the field or on the road, you can access your dashboard, AI rehearsal, and prospect database flawlessly via any mobile browser.',
      },
      {
        id: 'faq-8',
        question: 'Do different modules really work together?',
        answer: 'Yes, they are fully integrated. For example, a prospect\'s pipeline history and notes automatically feed context directly into the AI Message generator. This allows the AI to craft the perfect personalized follow-up message with full historical knowledge.',
      },
      {
        id: 'faq-9',
        question: 'Who is it best for?',
        answer: 'Perfect for network marketers at all levels — from solo distributors looking to optimize their pipeline to top team leaders managing hundreds of partners who want to standardize onboarding checklists and save hundreds of sponsor hours.',
      },
      {
        id: 'faq-10',
        question: 'How soon will I see results?',
        answer: 'You can feel order and speed gains from day one; however, results (as you will appreciate) vary from person to person, leader to leader, and how correctly and disciplined you use the application directly impacts the outcome. NMM is not a magic wand, but a powerful tool that makes tasks easier.',
      },
    ],
  }

  const activeFaq = lang === 'en' ? faqData.en : faqData.tr

  return (
    <section id="sss" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-300">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {lang === 'en' ? 'Frequently Asked Questions' : 'Sıkça Sorulan Sorular'}
        </h2>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] backdrop-blur-xl p-4 sm:p-6 shadow-xl divide-y divide-slate-200 dark:divide-white/[0.04]">
        {activeFaq.map((faq) => {
          const isOpen = openId === faq.id
          return (
            <div key={faq.id} className="py-4 first:pt-2 last:pb-2">
              <button
                type="button"
                onClick={() => toggleItem(faq.id)}
                className="w-full flex items-center justify-between text-left gap-4 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 hover:text-[#534AB7] dark:hover:text-white transition duration-200 cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-[#534AB7] dark:text-[#a09be8]' : ''
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-1 border-l-2 border-[#534AB7]/30 dark:border-[#a09be8]/20">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
