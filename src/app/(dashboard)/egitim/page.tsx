'use client'

import { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, Clock, Star, CheckCircle2, Circle } from 'lucide-react'

interface Konu {
  id: string
  baslik: string
  emoji: string
  sure: string
  seviye: 'Temel' | 'Orta' | 'İleri'
  ozet: string
  maddeler: string[]
}

interface Kategori {
  id: string
  baslik: string
  emoji: string
  renk: string
  konular: Konu[]
}

const KATEGORILER: Kategori[] = [
  {
    id: 'zihniyet',
    baslik: 'Zihniyet & Temel',
    emoji: '🧠',
    renk: 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc] border-[#E0E7FF] dark:border-[#312e8130]',
    konular: [
      {
        id: 'z1',
        baslik: 'Network Marketing Nedir?',
        emoji: '🌐',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'İşin gerçek tanımı, efsanelerden arındırılmış sade anlatım.',
        maddeler: [
          'NM, doğrudan satış ve kişisel tavsiye ekonomisinin birleşimidir.',
          'Şirket, reklam bütçesini distribütörlere komisyon olarak öder.',
          'Kazanç iki kaynaktan gelir: kendi satışın ve ekibinin satışı.',
          'Yasal NM\'de ürün gerçek, tüketim sürekli, büyüme sürdürülebilir.',
          'Piramit sistemiyle farkı: NM\'de çıkılan basamağı geride bırakabilirsin.',
        ],
      },
      {
        id: 'z2',
        baslik: 'Niçin Çoğu İnsan Bırakıyor?',
        emoji: '🚶',
        sure: '4 dk',
        seviye: 'Temel',
        ozet: 'İstatistiklerin arkasındaki gerçek ve onlardan sıyrılma yolu.',
        maddeler: [
          'Çoğu insan ilk 90 günde bırakır — yanlış beklenti nedeniyle.',
          'NM bir maraton, sprint değil; yavaş ama güçlü büyüme gerektirir.',
          'Sosyal baskı ve ilk reddedilmeler en yaygın bırakma nedenidir.',
          'Sürekli kalan %20, toplamın %80\'ini kazanır — bu her alanda böyle.',
          'Çözüm: net bir "neden" bulmak ve mentorla çalışmak.',
        ],
      },
      {
        id: 'z3',
        baslik: 'Büyüme Zihniyeti',
        emoji: '🌱',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'Sabit zihniyet tuzağından çıkış ve gelişime açık olmanın pratiği.',
        maddeler: [
          '"Doğuştan satıcı değilim" sabit zihniyet tuzağıdır.',
          'Beceriler öğrenilir — iletişim, takip, sunum, liderlik.',
          'Her reddedilme, evet\'e bir adım daha yaklaşmak demektir.',
          'Geri bildirimi kişisel almamak: "hayır" sana değil, zamana söyleniyor.',
          'Kitap, podcast ve gözlemin günlük zihinsel "egzersizin" olsun.',
        ],
      },
    ],
  },
  {
    id: 'iletisim',
    baslik: 'İletişim & Sunum',
    emoji: '🗣️',
    renk: 'bg-[#E1F5EE] dark:bg-[#0d3d2e] text-[#0F6E56] dark:text-[#4ade80] border-[#D2EFE4] dark:border-[#0d3d2e80]',
    konular: [
      {
        id: 'i1',
        baslik: 'İlk Konuşmayı Açmak',
        emoji: '👋',
        sure: '5 dk',
        seviye: 'Temel',
        ozet: 'Doğal bir konuşmayı nasıl fırsata dönüştürürsün.',
        maddeler: [
          'İnsanlar satış konuşması duymak istemez, hikâye duymak ister.',
          'Kendi değişimini anlat: "Ben de aynı durumdaydım…" ile başla.',
          'Soru sor, cevap verme: merak uyandır, zorla anlatma.',
          'Hedef: ilgi uyandırmak, bir sonraki adımı davet etmek.',
          '"Sana 2 dakikam var, ilgini çeker mi?" formülü çalışır.',
        ],
      },
      {
        id: 'i2',
        baslik: '2 Dakikalık Sunum',
        emoji: '⚡',
        sure: '7 dk',
        seviye: 'Orta',
        ozet: 'Kısa, güçlü ve akılda kalan bir sunum nasıl yapılır.',
        maddeler: [
          'Uzun sunum dikkat öldürür. 2 dakika yeterli, 20 dakika çok fazla.',
          'Yapı: Sorun → Çözüm → Kanıt → Davet.',
          'Rakam kullan: "3 ayda X TL" somut, "iyi para" muğlak.',
          'Öz hikâyeni ezberle: pratik yapar, pratik güven verir.',
          'Sunum bir kapı açar — her şeyi o kapının önünde anlatma.',
        ],
      },
      {
        id: 'i3',
        baslik: 'Takip Sanatı',
        emoji: '🔁',
        sure: '6 dk',
        seviye: 'Orta',
        ozet: '"Hayır" yerine "henüz hazır değilim" diyenleri kaybetmemek.',
        maddeler: [
          'Satışların %80\'i 5. temastan sonra gerçekleşir.',
          'İlk "hayır" karar değil, savunma refleksidir.',
          'Takip zamanlaması: 2 gün → 1 hafta → 1 ay → 3 ay.',
          'Her takipte yeni bir değer sun; sadece "düşündün mü?" deme.',
          'Takip etmek, baskı değil; ilgi ve değer sunmaktır.',
        ],
      },
    ],
  },
  {
    id: 'ekip',
    baslik: 'Ekip & Liderlik',
    emoji: '👥',
    renk: 'bg-[#FAEEDA] dark:bg-[#3a2200] text-[#854F0B] dark:text-[#fbbf24] border-[#F6E4C4] dark:border-[#3a220080]',
    konular: [
      {
        id: 'e1',
        baslik: 'Ekip Kurmak: İlk Adımlar',
        emoji: '🏗️',
        sure: '5 dk',
        seviye: 'Orta',
        ozet: 'Sıfırdan bir ekip inşa etmenin sağlam temelleri.',
        maddeler: [
          'Herkesi değil, doğru insanı ara: hırslı, iletişime açık, güvenilir.',
          'İlk 2–3 kişini doğru seç — onlar kültürünü belirler.',
          'Yeni üyeye ilk 48 saat kritik: hemen aksiyon almasını sağla.',
          'Mentor değil, model ol: kendin yapmazsan ekibin yapmaz.',
          'Duygusal destek ve teknik koçluk arasındaki dengeyi kur.',
        ],
      },
      {
        id: 'e2',
        baslik: 'Çoğaltma: Sistemle Büyümek',
        emoji: '🔄',
        sure: '8 dk',
        seviye: 'İleri',
        ozet: 'Sen olmadan da büyüyen bir ekip nasıl inşa edilir.',
        maddeler: [
          'Çoğaltma: başkasının yapabildiği şeyi sisteme bağlamak.',
          'Tek bir süper yıldıza bağlı ekip kırılgandır; sistem güçlü olmalı.',
          '"Eğitimimi ver, git kendi kendin çalış" formülü çalışır.',
          'Her üye kendi 2–3 kişisini bulana kadar destek ver.',
          'Büyük liderler ekibini bağımlı değil, bağımsız yapar.',
        ],
      },
    ],
  },
  {
    id: 'strateji',
    baslik: 'Strateji & Büyüme',
    emoji: '📈',
    renk: 'bg-[#FBEAF0] dark:bg-[#3d0f1f] text-[#72243E] dark:text-[#f9a8d4] border-[#F5D9E5] dark:border-[#3d0f1f80]',
    konular: [
      {
        id: 's1',
        baslik: 'Günlük 5 Eylem Prensibi',
        emoji: '5️⃣',
        sure: '4 dk',
        seviye: 'Temel',
        ozet: 'Her gün sadece 5 eylem ile tutarlı büyüme.',
        maddeler: [
          '5 yeni kişiyle tanış veya eski biriyle tekrar konuş.',
          'Bir sunum veya bilgilendirme yap.',
          'Bir takip mesajı gönder.',
          'Ürününü kullan ve deneyimini not et.',
          'Bir şey öğren: video, podcast, kitap — 15 dakika yeter.',
        ],
      },
      {
        id: 's2',
        baslik: 'Sosyal Medyayı İş Aracına Dönüştürmek',
        emoji: '📱',
        sure: '7 dk',
        seviye: 'Orta',
        ozet: 'Spam değil, değer içeriğiyle organik büyüme.',
        maddeler: [
          'Ürün/fırsat paylaşımı değil, dönüşüm hikâyeleri paylaş.',
          '80/20 kuralı: %80 değer içeriği, %20 iş içeriği.',
          'DM stratejisi: sormadan önce ilgi göster, dinle, sonra davet et.',
          'Günde 1 story + haftada 2–3 gönderi sürdürülebilir hedeftir.',
          'Rakam + sonuç + duygu: "3 ayda X TL + ne hissettim" formülü güçlü.',
        ],
      },
      {
        id: 's3',
        baslik: '90 Günlük Başlangıç Planı',
        emoji: '🗓️',
        sure: '6 dk',
        seviye: 'Temel',
        ozet: 'İlk 90 günde ne yapmalı, ne yapmamalı.',
        maddeler: [
          '1–30. gün: Öğren, dene, listeyi yaz. Ürünü kendin kullan.',
          '31–60. gün: İlk 10 konuşmayı tamamla, ilk satışı veya üyeyi al.',
          '61–90. gün: İlk ekip üyeni mentor et, sistemi çoğalt.',
          'Bu dönemde tek odak: momentum kırmamak.',
          '90 günün sonunda bir değerlendirme yap ve bir sonraki 90 günü planla.',
        ],
      },
    ],
  },
]

const SEVIYE_RENK: Record<string, string> = {
  'Temel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'İleri': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const READ_KEY = 'nmm_egitim_read'

function loadRead(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function saveRead(read: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(read)))
}

export default function EgitimPage() {
  const [acikKonu, setAcikKonu] = useState<string | null>(null)
  const [read, setRead] = useState<Set<string>>(new Set())

  useEffect(() => { setRead(loadRead()) }, [])

  function toggle(id: string) {
    setAcikKonu(prev => (prev === id ? null : id))
  }

  function toggleRead(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setRead(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveRead(next)
      return next
    })
  }

  const toplamKonu = KATEGORILER.reduce((s, k) => s + k.konular.length, 0)
  const okunanKonu = read.size

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      {/* Başlık */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
            <BookOpen className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">Vaktin Varsa</h1>
            <p className="text-sm text-[var(--text-3)]">Okusa kardır — seçilmiş içerik havuzu</p>
          </div>
        </div>

        {/* Hero bilgi kutusu */}
        <div className="mt-4 rounded-2xl border border-[#E0E7FF] dark:border-[#312e81]/40 bg-[#EEF2FF] dark:bg-[#1e1b4b]/70 p-4">
          <p className="text-sm font-semibold text-[#3730A3] dark:text-[#a5b4fc] mb-1">
            📖 Kimse seni zorlamıyor — ama bilgi fark yaratır
          </p>
          <p className="text-xs text-[#3730A3]/70 dark:text-[#a5b4fc]/70 leading-relaxed">
            Her konu 4–8 dakika. Sahada fark edilir sonuçlar için sıra sıra değil, ihtiyaca göre oku.
          </p>
          <div className="mt-3 flex gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#3730A3] dark:text-[#a5b4fc]" />
              <span className="text-[11px] font-medium text-[#3730A3] dark:text-[#a5b4fc]">
                {toplamKonu} konu
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#3730A3] dark:text-[#a5b4fc]" />
              <span className="text-[11px] font-medium text-[#3730A3] dark:text-[#a5b4fc]">
                {KATEGORILER.length} kategori
              </span>
            </div>
            {okunanKonu > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {okunanKonu}/{toplamKonu} okundu
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Kategoriler & Accordion */}
      <div className="space-y-6">
        {KATEGORILER.map(kategori => (
          <section key={kategori.id}>
            {/* Kategori başlığı */}
            <div className={`mb-3 flex items-center gap-2 rounded-2xl border px-4 py-3 ${kategori.renk}`}>
              <span className="text-xl leading-none">{kategori.emoji}</span>
              <div>
                <h2 className="text-sm font-bold leading-tight">{kategori.baslik}</h2>
                <p className="text-[11px] opacity-70">{kategori.konular.length} konu</p>
              </div>
            </div>

            {/* Konular listesi */}
            <ul className="space-y-2 pl-1">
              {kategori.konular.map(konu => {
                const acik = acikKonu === konu.id
                const okundu = read.has(konu.id)
                return (
                  <li key={konu.id}>
                    <div
                      className={`rounded-2xl border transition-all duration-200 ${
                        acik
                          ? 'border-[#3730A3]/20 dark:border-[#a5b4fc]/20 bg-[var(--bg-card)] shadow-md'
                          : 'border-[var(--border)] bg-[var(--bg-card)] hover:shadow-sm hover:border-[#3730A3]/20 dark:hover:border-[#a5b4fc]/20'
                      }`}
                    >
                      {/* Konu başlık satırı */}
                      <button
                        onClick={() => toggle(konu.id)}
                        className="flex w-full items-center gap-3 p-3.5 text-left"
                      >
                        <span className={`text-lg leading-none shrink-0 transition-all ${okundu ? 'opacity-50' : ''}`}>{konu.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <p className={`text-sm font-semibold leading-tight ${okundu ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'}`}>{konu.baslik}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${SEVIYE_RENK[konu.seviye]}`}>
                              {konu.seviye}
                            </span>
                            {okundu && (
                              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Okundu</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-[var(--text-3)]" />
                            <span className="text-[11px] text-[var(--text-3)]">{konu.sure}</span>
                            <span className="text-[var(--text-3)]">·</span>
                            <span className="text-[11px] text-[var(--text-3)]">{konu.ozet}</span>
                          </div>
                        </div>
                        {/* Okundu toggle */}
                        <button
                          onClick={e => toggleRead(konu.id, e)}
                          title={okundu ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                            okundu
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-3)] hover:text-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          {okundu
                            ? <CheckCircle2 className="h-5 w-5" />
                            : <Circle className="h-5 w-5" />
                          }
                        </button>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
                          strokeWidth={2}
                        />
                      </button>

                      {/* Açık içerik */}
                      {acik && (
                        <div className="border-t border-[#3730A3]/10 dark:border-[#a5b4fc]/10 px-4 pb-4 pt-3">
                          <ul className="space-y-2.5">
                            {konu.maddeler.map((madde, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[9px] font-bold text-[#3730A3] dark:text-[#a5b4fc]">
                                  {idx + 1}
                                </span>
                                <p className="text-sm leading-relaxed text-[var(--text-2)]">{madde}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
