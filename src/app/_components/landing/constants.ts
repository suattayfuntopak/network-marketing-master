export { NEXT_THEME } from '@/lib/ui/themeToggle'

/** Pano Aylık sekmesi (coral) — landing birincil CTA; light modda brand mor kalır.
 *  Dark: eski «Zirveye Ulaş» pembe gradyan — hero, header, billing toggler. */
export const LANDING_PRIMARY_CTA =
  'bg-gradient-to-r from-brand to-brand-accent dark:from-pink-600 dark:to-rose-500 text-white'

export const LANDING_PRIMARY_CTA_SHADOW =
  'shadow-md dark:shadow-pink-500/15'

export const LANDING_PRIMARY_CTA_HOVER =
  'hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-pink-500/25'

/** Basic plan — «14 Günlük ÜCRETSİZ Denemeyi Başlat»; dark: pano Takvim teal crown. */
export const LANDING_BASIC_TRIAL_CTA =
  'border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 dark:border-transparent dark:bg-gradient-to-br dark:from-[#90E894] dark:to-[#009688] dark:text-white dark:shadow-md dark:hover:brightness-105'

/** Plus plan CTA — light: brand (değişmez); dark: pano Vaktin Varsa blue crown. */
export const LANDING_PLUS_CTA =
  'bg-gradient-to-r from-brand to-brand-accent text-white dark:border-transparent dark:bg-gradient-to-br dark:from-[#448AFF] dark:to-[#2962FF] dark:hover:brightness-105 dark:shadow-md'

export const LANDING_PLUS_CTA_HOVER =
  'hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/20'

/** Pro plan — «Zirveye Ulaş»; light: pembe (değişmez); dark: Aylık Ödeme pembe gradyan. */
export const LANDING_PRO_CTA =
  'bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-500/10 dark:from-pink-600 dark:to-rose-500 dark:shadow-md dark:shadow-pink-500/15 dark:hover:opacity-95'

export const NEXT_THEME_LABEL: Record<string, string> = {
  dark: 'Light moduna geç', light: 'System moduna geç', system: 'Dark moduna geç',
}

export const TESTIMONIAL_CARD =
  'rounded-3xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 transition duration-300 p-6 w-[290px] sm:w-[360px] shrink-0 space-y-4 flex flex-col justify-between'

export const TESTIMONIALS = [
  {
    initials: 'AK',
    name: 'Ahmet K.',
    title: { en: 'Independent Leader', tr: 'Bağımsız Lider' },
    text: {
      en: 'No more wondering what new partners should do in their first weeks. As they complete steps in the 4-week Onboarding Guide, I get notifications on my panel, keeping the process under control.',
      tr: 'Ekibime yeni katılan ortakların ilk haftalarda ne yapacağını düşünme derdi bitti. 4 haftalık Doğru Başlangıç rehberindeki adımları tamamladıkça panelime bildirim geliyor, süreç tamamen kontrolümde.'
    },
    bg: 'bg-indigo-500/10',
    color: 'text-indigo-400'
  },
  {
    initials: 'EB',
    name: 'Elif B.',
    title: { en: 'Team Coordinator', tr: 'Ekip Koordinatörü' },
    text: {
      en: 'The AI Field Rehearsal simulator is a revolution. My partners practice on AI candidates before meeting real prospects. No more fear of burning leads.',
      tr: 'YZ Saha Provası simülatörü adeta bir devrim. Distribütörlerim, gerçek adayların karşısına çıkmadan önce YZ üzerinde pratik yaparak kendilerini geliştiriyor. Aday kaybetme korkumuz bitti.'
    },
    bg: 'bg-pink-500/10',
    color: 'text-pink-400'
  },
  {
    initials: 'MC',
    name: 'Murat C.',
    title: { en: 'Platinum Sponsor', tr: 'Platin Sponsor' },
    text: {
      en: 'We analyze our social media marketing posts in seconds with the Compliance Control module. Achieving total alignment with regulations and policies is a relief.',
      tr: 'Sosyal medyada paylaşacağımız pazarlama metinlerini Uyum Denetimi modülüyle saniyeler içinde analiz ediyoruz. Yasal kurallara ve firma politikalarına tam uyum sağlamak çok rahatlatıcı.'
    },
    bg: 'bg-blue-500/10',
    color: 'text-blue-400'
  },
  {
    initials: 'SD',
    name: 'Selin D.',
    title: { en: 'Independent Master', tr: 'Bağımsız Master' },
    text: {
      en: 'Candidate tracking used to get lost in notebooks. Now, thanks to the Pipeline, I see who is at which stage (new, presentation, follow-up) in one glance. Nobody is forgotten.',
      tr: 'Aday takibi eskiden defterlerde kayboluyordu. Şimdi Aday Listesi sayesinde hangi adayın hangi aşamada (yeni, sunum, takip) olduğunu tek bakışta görüyorum. Kimseyi unutmuyorum.'
    },
    bg: 'bg-amber-500/10',
    color: 'text-amber-400'
  },
  {
    initials: 'HY',
    name: 'Hakan Y.',
    title: { en: 'Organization Leader', tr: 'Organizasyon Lideri' },
    text: {
      en: 'We use the Objection Resolution module for tough prospect questions. Smart, sincere, and persuasive responses give my field partners incredible confidence.',
      tr: 'Adaylardan gelen zorlu itirazlara karşı İtirazlara Cevaplar modülünü kullanıyoruz. Akılcı, samimi ve ikna edici hazır şablonlar sahadaki distribütörlerimin elini inanılmaz güçlendiriyor.'
    },
    bg: 'bg-emerald-500/10',
    color: 'text-emerald-400'
  },
  {
    initials: 'ZO',
    name: 'Zeynep O.',
    title: { en: 'Sapphire Leader', tr: 'Safir Lider' },
    text: {
      en: 'Whenever someone in my downline adds a prospect or updates a stage, I get instant visual and sound alerts. Keeping the pulse of the team alive feels great.',
      tr: 'Alt ekibimde kim yeni bir aday eklese veya bir aşamayı güncellese panelimde anlık sesli ve görsel bildirim alıyorum. Ekibin nabzını canlı tutmak harika bir duygu.'
    },
    bg: 'bg-purple-500/10',
    color: 'text-purple-400'
  },
  {
    initials: 'KB',
    name: 'Kerem B.',
    title: { en: 'Global Coordinator', tr: 'Küresel Koordinatör' },
    text: {
      en: 'Managing teams across borders is seamless with the dual-language sync. One click translates the UI and AI suggestions to English for my international partners.',
      tr: 'Farklı ülkelerdeki ekiplerimi yönetirken çift dil desteği can kurtarıyor. Sağ üstten tek tıkla tüm arayüzü ve yapay zeka çıktılarını İngilizceye çevirip yabancı ortaklarımla paylaşabiliyorum.'
    },
    bg: 'bg-cyan-500/10',
    color: 'text-cyan-400'
  },
  {
    initials: 'MY',
    name: 'Merve Y.',
    title: { en: 'Field Director', tr: 'Saha Direktörü' },
    text: {
      en: 'Swiping between tabs on my smartphone is extremely practical. I manage my entire candidate pipeline and calendar with one hand while on the move.',
      tr: 'Akıllı telefonlarda sağa sola kaydırarak sekmeler arasında gezinebilmek çok pratik. Sahada koştururken tüm aday listemi ve takvimimi tek elle pürüzsüzce yönetiyorum.'
    },
    bg: 'bg-rose-500/10',
    color: 'text-rose-400'
  },
  {
    initials: 'TA',
    name: 'Tarık A.',
    title: { en: 'Regional Sponsor', tr: 'Bölge Sponsoru' },
    text: {
      en: 'Network Marketing Master saves me at least 10 hours a week. Team coordination and onboarding run automatically, letting me focus entirely on strategic growth.',
      tr: 'Network Marketing Master bana haftada en az 10 saat kazandırdı. Ekip koordinasyonu ve onboarding takibi kendiliğinden işliyor, ben sadece stratejik büyümeye odaklanıyorum.'
    },
    bg: 'bg-violet-500/10',
    color: 'text-violet-400'
  },
  {
    initials: 'ND',
    name: 'Nilgün D.',
    title: { en: 'Diamond Leader', tr: 'Diamond Lider' },
    text: {
      en: 'The Excel-style performance desk in the Statistics tab is a true leader tool. I analyze the downline distribution and activity in one view to provide mentorship.',
      tr: 'İstatistikler sayfasındaki Excel tarzı performans tablosu tam bir lider masası. Tüm ekibin aday dağılımlarını ve aktifliğini tek ekranda analiz edip mentörlük yapabiliyorum.'
    },
    bg: 'bg-teal-500/10',
    color: 'text-teal-400'
  }
]
