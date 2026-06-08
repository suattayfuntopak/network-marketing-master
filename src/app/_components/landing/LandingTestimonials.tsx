'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { TESTIMONIALS, TESTIMONIAL_CARD } from './constants'
import { Z } from '@/lib/ui/zIndex'

export function LandingTestimonials() {
  const { t, lang } = useTranslation()

  return (
    <section className="py-16 space-y-12 overflow-hidden relative">
      <div className="text-center space-y-3 px-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('landingPage.testimonialsTitle')}
        </h2>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('landingPage.testimonialsSubtitle')}
        </p>
      </div>

      {/* Fading Glass Overlay Outer Container */}
      <div className={`relative w-full overflow-hidden space-y-6 before:absolute before:left-0 before:top-0 before:h-full before:w-16 sm:before:w-32 before:bg-gradient-to-r before:from-white dark:before:from-[#0A0B10] before:to-transparent before:${Z.cardControls} after:absolute after:right-0 after:top-0 after:h-full after:w-16 sm:after:w-32 after:bg-gradient-to-l after:from-white dark:after:from-[#0A0B10] after:to-transparent after:${Z.cardControls}`}>
        
        {/* Row 1 - scrolling left */}
        <div className="flex w-max gap-6 py-2">
          <div className="animate-marquee-left gap-6 flex">
            {TESTIMONIALS.slice(0, 5).map((item, idx) => (
              <div key={`row1-${idx}`} className={TESTIMONIAL_CARD}>
                <p className="text-xs sm:text-sm italic text-slate-600 dark:text-zinc-300 leading-relaxed">
                  &ldquo;{lang === 'en' ? item.text.en : item.text.tr}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${item.bg} flex items-center justify-center font-black text-xs ${item.color}`}>
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-500 mt-1 leading-none">
                      {lang === 'en' ? item.title.en : item.title.tr}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate for infinite effect */}
            {TESTIMONIALS.slice(0, 5).map((item, idx) => (
              <div key={`row1-dup-${idx}`} className={TESTIMONIAL_CARD}>
                <p className="text-xs sm:text-sm italic text-slate-600 dark:text-zinc-300 leading-relaxed">
                  &ldquo;{lang === 'en' ? item.text.en : item.text.tr}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${item.bg} flex items-center justify-center font-black text-xs ${item.color}`}>
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-500 mt-1 leading-none">
                      {lang === 'en' ? item.title.en : item.title.tr}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 - scrolling right */}
        <div className="flex w-max gap-6 py-2">
          <div className="animate-marquee-right gap-6 flex">
            {TESTIMONIALS.slice(5, 10).map((item, idx) => (
              <div key={`row2-${idx}`} className={TESTIMONIAL_CARD}>
                <p className="text-xs sm:text-sm italic text-slate-600 dark:text-zinc-300 leading-relaxed">
                  &ldquo;{lang === 'en' ? item.text.en : item.text.tr}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${item.bg} flex items-center justify-center font-black text-xs ${item.color}`}>
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-500 mt-1 leading-none">
                      {lang === 'en' ? item.title.en : item.title.tr}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate for infinite effect */}
            {TESTIMONIALS.slice(5, 10).map((item, idx) => (
              <div key={`row2-dup-${idx}`} className={TESTIMONIAL_CARD}>
                <p className="text-xs sm:text-sm italic text-slate-600 dark:text-zinc-300 leading-relaxed">
                  &ldquo;{lang === 'en' ? item.text.en : item.text.tr}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${item.bg} flex items-center justify-center font-black text-xs ${item.color}`}>
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-500 mt-1 leading-none">
                      {lang === 'en' ? item.title.en : item.title.tr}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
