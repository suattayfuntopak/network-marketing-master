'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export default function TermsPage() {
  const { lang } = useTranslation()
  const [activeSection, setActiveSection] = useState('t1')

  const content = {
    tr: {
      title: 'Kullanım Koşulları ve Üyelik Sözleşmesi',
      subtitle: 'Platformumuzu kullanırken geçerli olan kuralları, haklarınızı ve sorumluluklarınızı açıklayan yasal sözleşme.',
      updateDate: 'Son Güncelleme: 31 Mayıs 2026',
      sections: [
        {
          id: 't1',
          title: '1. Taraflar ve Kabul',
          text: 'Bu Kullanım Koşulları, Network Marketing Master ("Platform") ile Platforma üye olan veya platformu kullanan kişi ("Kullanıcı") arasında akdedilmiştir. Platforma giriş yaparak, kayıt oluşturarak veya hizmetleri kullanarak bu koşulların tamamını okuduğunuzu, anladığınızı ve onayladığınızı kabul etmiş bulunursunuz. Koşulları kabul etmiyorsanız lütfen Platformu kullanmayı sonlandırın.',
        },
        {
          id: 't2',
          title: '2. Sunulan SaaS Hizmeti ve Lisans',
          text: 'Platform, abonelik (SaaS) modeliyle sunulan yapay zeka destekli bir MLM (Ağ Pazarlaması) hızlandırıcı yazılımıdır. Kullanıcıya, seçtiği üyelik planı (Basic, Plus, Pro) limitleri dahilinde;',
          bullets: [
            'Aday Boru Hattı (Pipeline) yönetimi ve aday takip veritabanına erişim,',
            'Yapay Zeka Koçu, YZ Mesaj Yazarı ve YZ Saha Provası simülasyon araçlarının kullanımı,',
            'Doğru Başlangıç (Onboarding) rehberleri ve ekip üyelerinin ilerleme koordinasyonu,',
            'Kişisel kullanım için devredilemez, münhasır olmayan, iptal edilebilir bir kullanım hakkı verilir.',
          ],
        },
        {
          id: 't3',
          title: '3. Üyelik Hesabı ve Güvenlik',
          text: 'Kullanıcı, platform üzerinde oluşturduğu çalışma alanlarının (Workspace) ve şifrelerin güvenliğinden bizzat sorumludur. Hesabınızın yetkisiz kullanımı durumunda derhal durumu bildirmekle yükümlüsünüz. Her bir kullanıcı hesabı bireyseldir; şifre paylaşımı, hesabın ortak kullanımı veya ticari olarak kiralama/devir yapılması yasaktır. Platform, bu tür suistimaller tespit edildiğinde hesabı askıya alma hakkını saklı tutar.',
        },
        {
          id: 't4',
          title: '4. Kabul Edilebilir Kullanım Politikası',
          text: 'Platformu kullanırken aşağıdaki kurallara ve yasalara uymayı taahhüt edersiniz:',
          bullets: [
            'Platforma yüklenen tüm aday bilgilerinin, KVKK mevzuatına uygun şekilde ilgili kişilerin rızası dahilinde toplandığını garanti etmek,',
            'Yapay zeka araçlarını kullanarak spam, taciz, aldatıcı reklam veya spam MLM taktikleri içeren mesajlar üretmemek ve bunları yaymamak,',
            'Platformun altyapısına zarar verecek tersine mühendislik (reverse engineering), veri kazıma (scraping) ve DDoS gibi saldırılardan kaçınmak,',
            'Uyum denetim aracını yasalara aykırı veya yanıltıcı tüketici beyanlarını meşrulaştırmak için kullanmamak.',
          ],
        },
        {
          id: 't5',
          title: '5. Ücretlendirme, Faturalandırma ve İptal',
          text: 'Platform ücretleri, seçilen plana ve faturalandırma periyoduna (Aylık/Yıllık) göre değişiklik gösterir. Ücretler ve iade koşulları şu şekildedir:',
          bullets: [
            'Faturalandırma periyodunun başında tahsil edilen ücretler, aksi belirtilmedikçe iade edilmez.',
            'Ücretsiz deneme süresi (14 gün) sonunda, iptal edilmediği takdirde abonelik otomatik olarak seçilen plan üzerinden yenilenir.',
            'Aboneliğinizi dilediğiniz an hesap ayarları üzerinden bir sonraki dönem için iptal edebilirsiniz. İptal edilen dönem sonunda erişiminiz kapatılır.',
            'Ödemeler BDDK lisanslı güvenli ödeme sağlayıcıları aracılığıyla tamamen şifrelenmiş olarak alınır.',
          ],
        },
        {
          id: 't6',
          title: '6. Sorumlulukların Sınırlandırılması',
          text: 'Network Marketing Master, yazılımı "olduğu gibi" (as-is) sunmaktadır. Platform, kesintisiz çalışma veya sıfır veri kaybı garantisi vermez. Mücbir sebepler, altyapı sağlayıcılarında (Supabase, OpenAI vb.) meydana gelebilecek kesintiler nedeniyle oluşabilecek geçici erişim sorunlarından Platform sorumlu tutulamaz. Aday listelerinizin ve kritik çalışma alanı verilerinizin düzenli yedeklerini (Excel dışa aktarma yoluyla) almak kullanıcının sorumluluğundadır.',
        },
      ],
    },
    en: {
      title: 'Terms of Service & Membership Agreement',
      subtitle: 'The legal agreement governing your rights, rules, and obligations when using our platform.',
      updateDate: 'Last Updated: May 31, 2026',
      sections: [
        {
          id: 't1',
          title: '1. Parties and Acceptance',
          text: 'These Terms of Service are entered into by and between Network Marketing Master ("Platform") and the individual accessing or using the software ("User"). By registering, creating a workspace, or using the platform tools, you acknowledge that you have read, understood, and agreed to be bound by these terms. If you do not agree, please discontinue using the platform immediately.',
        },
        {
          id: 't2',
          title: '2. SaaS Provisioning and License Scope',
          text: 'The Platform is an AI-powered MLM (Network Marketing) productivity and acceleration suite provided under a Software-as-a-Service (SaaS) model. Subject to your selected subscription tier (Basic, Plus, Pro), the Platform grants you:',
          bullets: [
            'Access to the visual Candidate Pipeline and prospect tracking database engines,',
            'Full use of the AI Coach, AI Copywriter, and Rehearsal roleplay simulation environments,',
            'Participation in Quick Start checklists and collaborative team coordination boards,',
            'A non-transferable, non-exclusive, revocable, personal license to utilize the tools solely for your professional sales management.',
          ],
        },
        {
          id: 't3',
          title: '3. Member Account Security',
          text: 'You are entirely responsible for maintaining the confidentiality of your workspace login credentials and password. You must notify us immediately of any unauthorized use or security breaches. User accounts are strictly individual; account-sharing, password-pooling, or sub-licensing/renting accounts to third parties is strictly prohibited. The platform reserves the right to suspend accounts suspected of credential sharing.',
        },
        {
          id: 't4',
          title: '4. Acceptable Use Policy',
          text: 'When using our platform, you legally commit to the following standards of practice:',
          bullets: [
            'Warranting that all prospective lead lists uploaded have been gathered in strict compliance with GDPR, KVKK, and relevant telecommunication marketing consent laws,',
            'Refraining from generating spam, abusive prospecting copy, or misleading network-marketing recruitment campaigns through our AI models,',
            'Avoiding reverse-engineering, system scraping, automatic bots, or triggering server-overloading requests (DDoS attacks),',
            'Not using our compliance analysis tools to circumvent consumer protection guidelines or validate illegal pyramids.',
          ],
        },
        {
          id: 't5',
          title: '5. Subscriptions, Billing, and Cancellation',
          text: 'Platform access fees are dictated by the plan selected and the billing frequency (Monthly or Annually). The financial terms are:',
          bullets: [
            'All billing cycles are paid in advance and are non-refundable unless legally mandated otherwise.',
            'If a 14-day free trial is not cancelled prior to expiration, your payment method will be automatically charged for the recurring subscription.',
            'You can cancel your subscription at any time within your Workspace billing panel. Cancellation stops future renewals while keeping active access until the cycle ends.',
            'Payment transactions are safely handled by fully compliant, secure payment gateways using end-to-end SSL keys.',
          ],
        },
        {
          id: 't6',
          title: '6. Limitation of Liability & Disclaimers',
          text: 'Network Marketing Master is provided on an "as-is" and "as-available" basis. We make no warranty that the SaaS will run error-free, uninterrupted, or without temporary cloud outages. Under no circumstances shall NMM be held liable for commercial performance, data loss, or server downtime caused by underlying infrastructure providers (e.g., Supabase, OpenAI, Resend). We highly recommend regularly exporting your pipeline data via our spreadsheet exports.',
        },
      ],
    },
  }

  const activeContent = lang === 'en' ? content.en : content.tr

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#06070B] dark:text-[#E2E8F0] selection:bg-[#534AB7] selection:text-white font-sans transition-colors duration-300">
      
      {/* Background Orbs */}
      <div className="absolute top-[5%] left-[-10%] h-[300px] w-[300px] rounded-full bg-[#534AB7]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-pink-600/5 blur-[140px] pointer-events-none" />

      {/* Header Back Bar */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-[#06070B]/70 border-b border-slate-200 dark:border-white/[0.04] transition-colors">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link
            href="/acilis"
            className="flex items-center gap-2 text-xs font-bold text-[#534AB7] dark:text-[#a09be8] hover:opacity-80 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'en' ? 'Back to Home' : 'Giriş Sayfası'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#534AB7] dark:text-[#a09be8] shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
              {lang === 'en' ? 'LEGAL USER TERMS' : 'YASAL KULLANICI SÖZLEŞMESİ'}
            </span>
          </div>
        </div>
      </nav>

      {/* Title Hero */}
      <header className="mx-auto max-w-6xl px-4 pt-10 pb-6 text-center md:text-left space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#534AB7] dark:text-[#a09be8]">
          <FileText className="h-3.5 w-3.5" />
          <span>{lang === 'en' ? 'Terms' : 'Koşullar'}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-zinc-200 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
          {activeContent.title}
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium max-w-3xl">
          {activeContent.subtitle}
        </p>
        <p className="text-xs font-bold text-indigo-500/80 dark:text-indigo-400/80 tracking-wider">
          {activeContent.updateDate}
        </p>
      </header>

      {/* Document split Layout */}
      <main className="mx-auto max-w-6xl px-4 pb-24 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Index */}
        <aside className="md:col-span-4 sticky top-20 hidden md:block space-y-2.5">
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.04] bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
              {lang === 'en' ? 'TERMS SECTIONS' : 'SÖZLEŞME BÖLÜMLERİ'}
            </h3>
            <ul className="space-y-1.5 font-medium">
              {activeContent.sections.map(section => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id)
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className={`w-full text-left rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                      activeSection === section.id
                        ? 'bg-[#534AB7] text-white shadow-md shadow-[#534AB7]/15 translate-x-1'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Document Body */}
        <article className="md:col-span-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-white/[0.04] bg-white dark:bg-white/[0.01] backdrop-blur-xl p-6 md:p-9 shadow-xl space-y-8 animate-in fade-in duration-300">
            {activeContent.sections.map(section => (
              <section
                key={section.id}
                id={section.id}
                className="space-y-4 border-b border-slate-100 dark:border-white/[0.03] pb-8 last:border-b-0 last:pb-0"
              >
                <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-indigo-500">■</span>
                  {section.title}
                </h2>
                
                <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                  {section.text}
                </p>

                {section.bullets && (
                  <ul className="space-y-2.5 pl-2 font-medium">
                    {section.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#534AB7] dark:text-[#a09be8] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

      </main>
    </div>
  )
}
