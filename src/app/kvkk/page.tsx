'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { LegalPageToolbar } from '@/app/_components/legal/LegalPageToolbar'

export default function KVKKPage() {
  const { lang, t } = useTranslation()
  const [activeSection, setActiveSection] = useState('p1')

  const content = {
    tr: {
      title: 'Kişisel Verilerin Korunması ve Gizlilik Politikası',
      subtitle: 'Kişisel verilerinizin güvenliği ve gizliliği bizim için en yüksek önceliğe sahiptir.',
      updateDate: 'Son Güncelleme: 31 Mayıs 2026',
      sections: [
        {
          id: 'p1',
          title: '1. Veri Sorumlusu',
          text: '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, Network Marketing Master ("Platform") olarak, kişisel verilerinizi aşağıda açıklanan çerçevede yasal mevzuata uygun olarak işliyoruz. Kişisel verilerinizin güvenli bir şekilde saklanması ve yasal sınırların dışına çıkılmaması en temel ilkemizdir.',
        },
        {
          id: 'p2',
          title: '2. İşlenen Kişisel Verileriniz',
          text: 'Platformu kullanımınız kapsamında yalnızca hizmet sunumu için zorunlu olan şu veriler işlenmektedir:',
          bullets: [
            'Kimlik ve İletişim Bilgileri: Adınız, soyadınız, e-posta adresiniz, telefon numaranız.',
            'Kullanım ve İşlem Verileri: Eklediğiniz aday listeleri, boru hattı (pipeline) geçiş hareketleri, günlük YZ Mesaj Yazarı ve YZ Koçu sorgularınız.',
            'Cihaz ve Bağlantı Verileri: Giriş yaptığınız IP adresleri, tarayıcı türleri ve oturum doğrulama kayıtları.',
          ],
        },
        {
          id: 'p3',
          title: '3. Veri İşleme Amaçları ve Hukuki Sebepleri',
          text: 'Kişisel verileriniz, KVKK 5. maddesi uyarınca "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması" ve "Veri sorumlusunun meşru menfaati" hukuki sebeplerine dayalı olarak şu amaçlarla işlenir:',
          bullets: [
            'Çalışma alanınızın (Workspace) oluşturulması ve oturum doğrulaması yapılması.',
            'Aday takip boru hattı (pipeline) ve ekip koordinasyonu araçlarının çalıştırılması.',
            'YZ Koçu ve Saha Provası simülasyonları gibi yapay zeka entegrasyonlarının kişiselleştirilmiş olarak sunulması.',
            'Platformun güvenliğinin sağlanması ve yasal uyum denetim raporlarının üretilmesi.',
          ],
        },
        {
          id: 'p4',
          title: '4. Verilerin Aktarılması ve Saklanması',
          text: 'Toplanan kişisel verileriniz kesinlikle üçüncü şahıslara veya reklam ağlarına satılmaz ya da paylaşılmaz. Verileriniz, dünya standartlarında güvenlik önlemlerine (ISO 27001, SOC2) sahip olan Supabase bulut veri tabanı altyapısında, Avrupa sunucularında KVKK ve Genel Veri Koruma Yönetmeliği (GDPR) uyum standartlarına uygun olarak uçtan uca şifrelenmiş biçimde saklanır. Ödeme bilgileri ise BDDK lisanslı güvenli ödeme geçidi aracılığıyla doğrudan işlenir ve sunucularımızda kart bilgisi tutulmaz.',
        },
        {
          id: 'p5',
          title: '5. Haklarınız (KVKK Madde 11)',
          text: 'KVKK\'nın 11. maddesi uyarınca bize başvurarak kişisel verilerinizin;',
          bullets: [
            'İşlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme,',
            'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,',
            'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,',
            'Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,',
            'Kanunun 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme hakkına sahipsiniz.',
          ],
          footer: 'Tüm bu haklarınız kapsamındaki taleplerinizi info@suattayfuntopak.com adresine yazılı olarak iletebilirsiniz.',
        },
      ],
    },
    en: {
      title: 'PDPL & Privacy Policy',
      subtitle: 'The safety and confidentiality of your personal data is our highest priority.',
      updateDate: 'Last Updated: May 31, 2026',
      sections: [
        {
          id: 'p1',
          title: '1. Data Controller',
          text: 'In accordance with the Personal Data Protection Law No. 6698 (PDPL), Network Marketing Master ("Platform") processes your personal data legally within the scope defined below. Protecting your personal data with state-of-the-art security measures is our core commitment.',
        },
        {
          id: 'p2',
          title: '2. Processed Personal Data',
          text: 'Only personal data strictly necessary for providing the SaaS workspace services are processed within the platform:',
          bullets: [
            'Identity & Contact Details: Your full name, email address, phone number.',
            'Workspace & Activity Metrics: Candidate pipeline transitions, prospect profiles, daily AI copywriter & AI coach transaction histories.',
            'Connection Logs: IP addresses, device identifiers, browser types, and session tokens.',
          ],
        },
        {
          id: 'p3',
          title: '3. Legal Grounds & Purposes of Processing',
          text: 'Your personal data is processed under PDPL Article 5 on the legal bases of "Performance of a contract" and "Legitimate interests of the controller" for the following objectives:',
          bullets: [
            'Managing your authentication, workspace security, and session validation.',
            'Enabling candidate follow-up databases, kanban pipelines, and team sharing synchronization.',
            'Powering personalized generative AI tools such as the AI Coach and Rehearsal roleplays.',
            'Securing the platform infrastructure and preventing license term violations.',
          ],
        },
        {
          id: 'p4',
          title: '4. Third-Party Sharing & Safe Storage',
          text: 'Under no circumstances do we sell, trade, or share your data with external advertisers or third parties. All platform data is end-to-end encrypted and hosted on European servers using the world-class Supabase database cloud provider, which adheres to PDPL and General Data Protection Regulation (GDPR) security standards including SOC2 and ISO 27001. All payment processes are carried out directly via encrypted SSL pathways by secure BDDK-licensed (Banking Regulation and Supervision Agency) payment processors; no credit card details are ever stored on our servers.',
        },
        {
          id: 'p5',
          title: '5. Your Rights under PDPL (Article 11)',
          text: 'Under the PDPL, you may contact us to exercise the following rights regarding your personal data:',
          bullets: [
            'Request details on whether your data is processed and demand copies,',
            'Learn the scope of data processing and verify appropriate usage,',
            'Know of any third-party infrastructure processors utilized,',
            'Demand correction of any outdated or faulty records,',
            'Request permanent deletion or erasure of your account details at any time.',
          ],
          footer: 'To exercise any of these rights, please write to us at info@suattayfuntopak.com.',
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/acilis"
            className="flex items-center gap-2 text-xs font-bold text-[#534AB7] dark:text-[#a09be8] hover:opacity-80 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'en' ? 'Back to Home' : 'Giriş Sayfası'}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                {lang === 'en' ? 'PDPL COMPLIANT' : 'KVKK UYUMLU GÜVENLİ VERİ'}
              </span>
            </div>
            <LegalPageToolbar />
          </div>
        </div>
      </nav>

      {/* Title Hero */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#534AB7] dark:text-[#a09be8]">
          <Shield className="h-3.5 w-3.5" />
          <span>{lang === 'en' ? 'PDPL' : 'KVKK'}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-zinc-200 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
          {activeContent.title}
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium max-w-5xl mx-auto">
          {activeContent.subtitle}
        </p>
        <p className="text-xs font-bold text-indigo-500/80 dark:text-indigo-400/80 tracking-wider">
          {activeContent.updateDate}
        </p>
      </header>

      {/* Document Centered Layout */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
        
        {/* Main Document Body */}
        <article className="space-y-6">
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

                {section.footer && (
                  <p className="text-xs font-bold text-[#534AB7] dark:text-[#a09be8] bg-[#534AB7]/5 p-3.5 rounded-xl border border-[#534AB7]/10 leading-relaxed">
                    {section.footer}
                  </p>
                )}
              </section>
            ))}
          </div>
        </article>

      </main>
    </div>
  )
}
