'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { LegalPageToolbar } from '@/app/_components/legal/LegalPageToolbar'
import { Z } from '@/lib/ui/zIndex'

export default function SecurityPage() {
  const { lang } = useTranslation()

  const content = {
    tr: {
      title: 'Bilgi Güvenliği ve Altyapı Bildirgesi',
      subtitle: 'Verilerinizin en yüksek bulut güvenliği standartlarında nasıl korunduğunu, şifrelendiğini ve yalıtıldığını öğrenin.',
      updateDate: 'Son Güncelleme: 31 Mayıs 2026',
      sections: [
        {
          id: 's1',
          title: '1. Satır Düzeyinde Veri Yalıtımı (RLS)',
          text: 'Platformumuzda veri güvenliği, veri tabanı katmanında tavizsiz bir şekilde tasarlanmıştır. Supabase altyapısında "Row-Level Security" (RLS - Satır Düzeyinde Güvenlik) teknolojisi aktif olarak kullanılmaktadır:',
          bullets: [
            'Oluşturduğunuz aday listeleri, notlar ve boru hattı (pipeline) hareketleri tamamen sizin kullanıcı kimliğinize (auth.uid) bağlanır.',
            'Alt ekibinizin (downline) durumunu izlerken, onların adaylarının ad, soyad ve detay verileri RLS kuralları ile otomatik olarak engellenir; liderler yalnızca anonimleştirilmiş sayısal metrikleri görebilir.',
            'Hiçbir kullanıcı, veri tabanı sorgusu doğrudan manipüle edilse dahi bir başkasına ait veriye erişemez ve değiştiremez.',
          ],
        },
        {
          id: 's2',
          title: '2. Veri Şifreleme Standartları',
          text: 'Tüm verileriniz hem iletim sırasında hem de saklanırken endüstri standardı güçlü şifreleme protokolleri ile korunur:',
          bullets: [
            'Veri İletim Güvenliği: Tarayıcınız ile platform sunucuları arasındaki tüm iletişim 256-bit TLS/SSL şifreleme tünelleri üzerinden gerçekleştirilir.',
            'Durağan Veri Güvenliği: Veri tabanımızda saklanan tüm müşteri bilgileri, Avrupa sunucularındaki AWS / Supabase altyapısında KVKK ve Genel Veri Koruma Yönetmeliği (GDPR) uyum standartlarına uygun olarak AES-256 standardında uçtan uca şifrelenmiş (encryption at rest) biçimde barındırılır.',
            'Yedekleme Güvenliği: Günlük olarak alınan sistem yedekleri, aynı yüksek şifreleme katmanı ile izole edilmiş depolama alanlarında saklanır.',
          ],
        },
        {
          id: 's3',
          title: '3. Kimlik Doğrulama ve Oturum Yönetimi',
          text: 'Kullanıcı girişleri ve oturumları, dünyanın en gelişmiş açık kaynaklı kimlik doğrulama motorları tarafından kontrol edilmektedir:',
          bullets: [
            'Şifreleriniz, veri tabanımızda ham metin olarak asla tutulmaz; güçlü tuzlama (salting) ve "bcrypt" algoritmalarıyla tek yönlü şifrelenir.',
            'Oturum doğrulaması için kısa ömürlü, kriptografik olarak imzalanmış JSON Web Tokens (JWT) kullanılır.',
            'Şüpheli giriş girişimleri, brute-force saldırılarına karşı otomatik IP sınırlaması ve oturum sonlandırma tetikleyicileri ile kontrol altında tutulur.',
          ],
        },
        {
          id: 's4',
          title: '4. Ödeme ve Kart Güvenliği (PCI-DSS)',
          text: 'Finansal işlemleriniz en üst düzey güvenlik kurallarına uygun olarak gerçekleştirilir. Platform olarak kart bilgilerinizi asla görmeyiz ve sunucularımızda saklamayız:',
          bullets: [
            'Ödemeler, BDDK (Bankacılık Düzenleme ve Denetleme Kurumu) lisanslı ve PCI-DSS Level 1 uyumlu güvenli ödeme geçitleri aracılığıyla doğrudan işlenir.',
            'Kredi kartı formları, güvenli "iframe" teknolojileriyle doğrudan ödeme kuruluşunun sunucularına bağlanır, platform sunucularımızdan geçmez.',
          ],
        },
        {
          id: 's5',
          title: '5. Yapay Zeka Entegrasyon Güvenliği',
          text: 'Yazılımdaki YZ Koçu, YZ Saha Provası ve Uyum Denetim Araçları kullanılırken gizliliğiniz tamamen korunur:',
          bullets: [
            'Yapay zeka modellerine (Gemini, OpenAI) gönderilen tüm veriler SSL şifreli kurumsal API bağlantıları üzerinden iletilir.',
            'API anlaşmalarımız gereği, eklediğiniz aday verileri veya özel MLM strateji sorularınız, yapay zeka sağlayıcıları tarafından genel modellerin eğitimi için kesinlikle kullanılmaz.',
            'Gönderilen sorgular sadece anlık analiz amaçlı işlenir ve geçici oturum sonrasında silinir.',
          ],
        },
      ],
    },
    en: {
      title: 'Information Security & Infrastructure Statement',
      subtitle: 'Learn how your candidate metrics, workspaces, and credentials are protected, encrypted, and isolated.',
      updateDate: 'Last Updated: May 31, 2026',
      sections: [
        {
          id: 's1',
          title: '1. Row-Level Data Isolation (RLS)',
          text: 'Information privacy is built directly into our database architecture. We leverage advanced Row-Level Security (RLS) rules at the core database level:',
          bullets: [
            'Every candidate profile, interaction record, and pipeline state is strictly bound to your cryptographically validated user ID (auth.uid).',
            'When uplines review downline statistics, all personal lead details (names, emails, phone numbers) are blocked by database-enforced RLS; leaders only view anonymous, aggregate pipeline counts.',
            'No user can read, intercept, or modify another member\'s candidate list, even if database queries are directly altered.',
          ],
        },
        {
          id: 's2',
          title: '2. Advanced Encryption Standards',
          text: 'Your sensitive business information is fully shielded both in transit and at rest using modern military-grade cryptography:',
          bullets: [
            'Data in Transit: All interactions between your browser/app and our servers are encrypted using 256-bit TLS/SSL secure tunnels.',
            'Data at Rest: Your workspace database is encrypted using AES-256 on European Supabase servers, in compliance with PDPL and General Data Protection Regulation (GDPR) standards.',
            'Backup Security: System backups are automatically processed daily and stored in isolated storage layers with equivalent AES-256 coverage.',
          ],
        },
        {
          id: 's3',
          title: '3. Authentication & Session Integrity',
          text: 'User credentials and dashboard access sessions are managed using state-of-the-art authentication frameworks:',
          bullets: [
            'Passwords are never stored in plain text. They are salted and run through secure bcrypt hashing routines before storage.',
            'Dashboard sessions are authenticated using short-lived, cryptographically signed JSON Web Tokens (JWT).',
            'Brute-force protection and automated rate-limiters instantly block suspicious IP ranges or anomalous entry attempts.',
          ],
        },
        {
          id: 's4',
          title: '4. Financial Transaction Security (PCI-DSS)',
          text: 'Subscription payments are processed in compliance with the highest payment industry rules. NMM does not store or process card numbers on our hardware:',
          bullets: [
            'All payment cycles are managed by PCI-DSS Level 1 certified gateways under secure BDDK (Banking Regulation and Supervision Agency) central banking licenses.',
            'Payment forms load via isolated secure frames (iframes), routing credit card payloads directly to financial institutions.',
          ],
        },
        {
          id: 's5',
          title: '5. Artificial Intelligence Security',
          text: 'When utilizing the AI (Artificial Intelligence) Coach, roleplay simulations, or compliance checkers, your prompts are securely isolated:',
          bullets: [
            'Prompt data sent to AI model endpoints (Gemini, OpenAI) travels exclusively over SSL-secured corporate API keys.',
            'Under zero circumstances are your specific team strategies, candidate details, or inputs utilized to train public LLM models.',
            'Transactions are evaluated transiently and deleted from active AI buffers post-execution.',
          ],
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
      <nav className={`sticky top-0 ${Z.header} backdrop-blur-md bg-white/70 dark:bg-[#06070B]/70 border-b border-slate-200 dark:border-white/[0.04] transition-colors`}>
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
              <Lock className="h-4 w-4 text-[#534AB7] dark:text-[#a09be8] shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                {lang === 'en' ? 'HIGH INFRASTRUCTURE SECURITY' : 'YÜKSEK ALTYAPI GÜVENLİĞİ'}
              </span>
            </div>
            <LegalPageToolbar />
          </div>
        </div>
      </nav>

      {/* Title Hero */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#534AB7] dark:text-[#a09be8]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{lang === 'en' ? 'Security' : 'Güvenlik'}</span>
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
              </section>
            ))}
          </div>
        </article>

      </main>
    </div>
  )
}
