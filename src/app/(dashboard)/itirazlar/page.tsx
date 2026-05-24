'use client'

import { useState, useMemo } from 'react'
import { MessageCircleQuestion, Search, X, ChevronDown } from 'lucide-react'

interface Itiraz {
  id: number
  kategori: string
  soru: string
  cevap: string
  emoji: string
}

const ITIRAZLAR: Itiraz[] = [
  // — Para / Kazanç —
  {
    id: 1,
    kategori: 'Para & Kazanç',
    soru: 'Bu piramit sistemi mi?',
    cevap:
      'Hayır. Piramit sistemlerde gerçek ürün/hizmet yoktur ve para yalnızca yeni üye getirmekten kazanılır — bu Türkiye\'de yasadışıdır. Network marketing\'de gerçek ürün veya hizmet satılır; kazanç hem kendi satışlarınızdan hem de ekibinizin satışlarından gelir. Bunu fark etmek için bir soruyu sor: "Ürünü ağ olmasa da satın alır mıydın?" Cevap evetse, bu gerçek bir iş.',
    emoji: '🏛️',
  },
  {
    id: 2,
    kategori: 'Para & Kazanç',
    soru: 'Bundan gerçekten para kazanılır mı?',
    cevap:
      'Evet — ama herkes kazanamaz, çünkü herkes çalışmaz. Bu bir iş, piyango değil. İlk 6–12 ayda küçük gelir, tutarlı çalışanlar 1–3 yılda önemli kazanç elde eder. Somut bir şey söyleyeyim: ben de aynı soruyu sormuştum. Rakamları beraber inceleyelim.',
    emoji: '💰',
  },
  {
    id: 3,
    kategori: 'Para & Kazanç',
    soru: 'Param yok, başlayamam.',
    cevap:
      'Başlangıç maliyeti çoğu küçük işletmenin çok altında. Üstelik bir işletme kuruyorsun; kira, stok, çalışan masrafı yok. Başlangıç için yatırdığın şey, uzun vadede geri dönüşü olan bir yatırım. İstersen minimum başlangıç seçeneklerine birlikte bakalım.',
    emoji: '🪙',
  },
  {
    id: 4,
    kategori: 'Para & Kazanç',
    soru: 'Yukardakiler zaten kazandı, ben geç kaldım.',
    cevap:
      'Network marketing\'de piyasanın doygunluğu yoktur — çünkü insanlar sürekli değişiyor, tüketim devam ediyor. McDonald\'s\'ın 1955\'te açılan franchise\'ının geç kalındığı söylenseydi, bugün yüz binlerce şube olmazdı. Sıra sende: sen de "erken kalan" biri olabilirsin.',
    emoji: '⏰',
  },

  // — Zaman —
  {
    id: 5,
    kategori: 'Zaman & Yoğunluk',
    soru: 'Vaktim yok.',
    cevap:
      'Anlıyorum, herkes yoğun. Ama şöyle düşün: haftada 5–7 saat ayırabilir misin? Bu kadar yeter. Çoğu insan bunu ana işinin yanında yapar. Soru "vakit var mı?" değil, "bu hayatı değiştirebilecek bir şey için vakit yaratabilir miyim?"',
    emoji: '⏳',
  },
  {
    id: 6,
    kategori: 'Zaman & Yoğunluk',
    soru: 'Şu an çok zor bir dönemdeyim.',
    cevap:
      'Bunu anlıyorum ve saygı duyuyorum. Belki de şu an değil, ama bu konuşmayı aklının bir köşesine koy. Çok zor dönemler geçer — ve çıkışı kolaylaştıracak bir ek gelir kaynağı tam da bu dönemde anlam kazanır. Hazır olduğunda buradayım.',
    emoji: '🤝',
  },

  // — Güven / Şüphe —
  {
    id: 7,
    kategori: 'Güven & Şüphe',
    soru: 'Arkadaşlarımla ilişkim bozulur.',
    cevap:
      'Bu en meşru endişelerden biri. Güzel haber: doğru yapıldığında tam tersi olur. Arkadaşını zorlamıyorsun, sadece faydalı bulduğun bir şeyi paylaşıyorsun. "Hayır" deyince "tamam, anlıyorum" diyorsun — ve ilişki kırılmıyor. Satıcı gibi değil, insan gibi konuşmak yeterli.',
    emoji: '💛',
  },
  {
    id: 8,
    kategori: 'Güven & Şüphe',
    soru: 'Daha önce denemişim, olmadı.',
    cevap:
      'Hangi şirketti? Ne kadar süre çalıştın? Çoğu zaman başarısızlık şirketten değil, yöntemden kaynaklanır. Bu sefer yanında bir ekip ve kanıtlanmış bir sistem var. İki dakika anlat, bakalım fark ne.',
    emoji: '🔄',
  },
  {
    id: 9,
    kategori: 'Güven & Şüphe',
    soru: 'Bu şirkete güvenilir mi?',
    cevap:
      'Haklısın, araştırmak şart. Şirketin kuruluş tarihi, ülkedeki yasal kaydı, ürün sertifikaları ve bağımsız distribütör sayısını birlikte inceleyelim. Sana somut belgeleri paylaşayım — sonra karar ver.',
    emoji: '🔍',
  },
  {
    id: 10,
    kategori: 'Güven & Şüphe',
    soru: 'Bunu sadece benden para kazanmak için söylüyorsun.',
    cevap:
      'Dürüst olmak gerekirse: evet, bir kazancım olacak — ama bu ancak sen de kazanırsan sürdürülebilir. Senin başarın benim başarım. İstersen rakamları ve komisyon yapısını şeffaf biçimde göstereyim, hiçbir şey gizli değil.',
    emoji: '🪞',
  },

  // — Yetenek / Kimlik —
  {
    id: 11,
    kategori: 'Yetenek & Kimlik',
    soru: 'Ben satıcı değilim, bu bana göre değil.',
    cevap:
      'Keşke "satış" kelimesini unuttursam. Burada arkadaşlarınla dürüst konuşmak, faydalı bir şeyi tavsiye etmek var. Her gün zaten tavsiye veriyorsun — hangi restoran, hangi dizi, hangi telefon. Fark şu: bu sefer o tavsiyeden para kazanıyorsun.',
    emoji: '🗣️',
  },
  {
    id: 12,
    kategori: 'Yetenek & Kimlik',
    soru: 'Yeterince sosyal değilim.',
    cevap:
      'İçe dönük insanlar çok başarılı distribütörler olabilir — çünkü dinlemeyi, derinlemesine ilgilenmeyi iyi bilirler. Sosyallik performans değil, güven inşasıdır. Kendi tarzınla yapabilirsin.',
    emoji: '🌱',
  },
  {
    id: 13,
    kategori: 'Yetenek & Kimlik',
    soru: 'Eğitimim yok, bilgim yok.',
    cevap:
      'Bu iş üniversite diploması değil, öğrenme isteği ister. Başlarken yanında bir mentor, bir sistem ve adım adım eğitim materyali olacak. Hiçbir şey bilmeden başlayan, bugün lider olan yüzlerce kişi var.',
    emoji: '📚',
  },

  // — Aile / Çevre —
  {
    id: 14,
    kategori: 'Aile & Çevre',
    soru: 'Ailem karşı çıkıyor.',
    cevap:
      'Bu çok normal. Aileler sevdiklerini riske karşı korumak ister. En iyi cevap tartışmak değil, somut sonuç göstermek. Küçük bir adımla başla, ilk kazancını göster — söylemek değil, yaşamak en güçlü ikna aracıdır.',
    emoji: '🏠',
  },
  {
    id: 15,
    kategori: 'Aile & Çevre',
    soru: 'Çevremde kimse bu tür şeylere inanmıyor.',
    cevap:
      'İlk çevren her zaman en zor gruptur — çünkü seni "eski sen" olarak tanıyorlar. Bu iş sadece yakın çevrenle değil, tüm insanlarla yapılır. Ağını genişletmek için yöntemler var; adım adım öğrenirsin.',
    emoji: '🌐',
  },

  // — Ürün / Sistem —
  {
    id: 16,
    kategori: 'Ürün & Sistem',
    soru: 'Ürünler çok pahalı.',
    cevap:
      'Fiyat, kaliteyle karşılaştırıldığında değerlendirilmeli. Çoğu NM ürünü konsantre ya da premium formülasyonla gelir — birim başına maliyet zannedilenden düşük çıkar. Seninle birlikte hesaplarsak görürsün.',
    emoji: '🧴',
  },
  {
    id: 17,
    kategori: 'Ürün & Sistem',
    soru: 'Bu ürünleri zaten marketlerden alabiliyorum.',
    cevap:
      'Belki benzer ürünler var, ama bu ürünlerin formülasyonu, klinik testleri ve arkasındaki destek farklı. Üstelik burada hem kullanıcı hem de iş ortağısın — market sana komisyon ödemiyor.',
    emoji: '🛒',
  },
  {
    id: 18,
    kategori: 'Ürün & Sistem',
    soru: 'Bunu başka şirketler de yapıyor zaten.',
    cevap:
      'Evet, rekabet var — ve bu olgunlaşmış bir pazarın işareti. Soru şu: hangi şirket daha güçlü sisteme, daha iyi ürüne ve sana daha iyi destek veren bir ekibe sahip? Bunu beraber karşılaştıralım.',
    emoji: '⚖️',
  },

  // — Genel —
  {
    id: 19,
    kategori: 'Genel',
    soru: 'Şu an düşünmek istemiyorum.',
    cevap:
      'Tamam, hiç sorun değil. Seni zorlamak istemem. Sadece şunu bırakayım: hazır olduğunda veya aklına takılan sorular olduğunda bana yaz. Kapı her zaman açık.',
    emoji: '🚪',
  },
  {
    id: 20,
    kategori: 'Genel',
    soru: 'Biraz daha bilgi alabilir miyim?',
    cevap:
      'Tabii! Bu tam istediğim şey. Ne merak ediyorsan sor — ürün mü, kazanç planı mı, sistem mi? Beraber bakalım. Hiçbir sorun aptalca değil, her sorunun cevabı var.',
    emoji: '💬',
  },
]

const KATEGORILER = ['Tümü', ...Array.from(new Set(ITIRAZLAR.map(i => i.kategori)))]

export default function ItirazlarPage() {
  const [search, setSearch] = useState('')
  const [acikId, setAcikId] = useState<number | null>(null)
  const [aktifKategori, setAktifKategori] = useState('Tümü')

  const filtrelenmis = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ITIRAZLAR.filter(i => {
      const kategoriEslesti = aktifKategori === 'Tümü' || i.kategori === aktifKategori
      const aramaEslesti = !q || i.soru.toLowerCase().includes(q) || i.cevap.toLowerCase().includes(q)
      return kategoriEslesti && aramaEslesti
    })
  }, [search, aktifKategori])

  function toggle(id: number) {
    setAcikId(prev => (prev === id ? null : id))
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      {/* Başlık */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1F3] dark:bg-[#3d0a1a]">
            <MessageCircleQuestion className="h-5 w-5 text-[#9B1D47] dark:text-[#fda4af]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">İtirazlara Cevap</h1>
            <p className="text-sm text-[var(--text-3)]">Sahadaki en sık sorulara hazır cevaplar</p>
          </div>
        </div>
        {/* İstatistik */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#FFE4EA] dark:border-[#3d0a1a] bg-[#FFF1F3] dark:bg-[#3d0a1a]/60 px-4 py-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="text-xs font-semibold text-[#9B1D47] dark:text-[#fda4af]">
              {ITIRAZLAR.length} itiraz · {KATEGORILER.length - 1} kategori
            </p>
            <p className="text-[11px] text-[#9B1D47]/70 dark:text-[#fda4af]/70">
              Hazır cevabın olsun, sahada kaybolma
            </p>
          </div>
        </div>
      </header>

      {/* Arama */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İtiraz veya cevap içinde ara..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-10 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)] transition"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Kategori filtreleri */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {KATEGORILER.map(k => (
          <button
            key={k}
            onClick={() => setAktifKategori(k)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              aktifKategori === k
                ? 'bg-[#9B1D47] text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#9B1D47] dark:hover:border-[#fda4af]'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Sonuç sayısı */}
      {search && (
        <p className="mb-3 text-xs text-[var(--text-3)]">
          {filtrelenmis.length} sonuç bulundu
        </p>
      )}

      {/* İtiraz listesi */}
      {filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">🔍</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">Eşleşen itiraz bulunamadı</p>
          <p className="mt-1 text-xs text-[var(--text-2)]">Farklı kelimelerle arama yap</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtrelenmis.map(itiraz => {
            const acik = acikId === itiraz.id
            return (
              <li key={itiraz.id}>
                <button
                  onClick={() => toggle(itiraz.id)}
                  className={`w-full text-left rounded-2xl border transition-all duration-200 ${
                    acik
                      ? 'border-[#9B1D47]/30 dark:border-[#fda4af]/30 bg-[var(--bg-card)] shadow-md'
                      : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[#9B1D47]/30 dark:hover:border-[#fda4af]/30 hover:shadow-sm'
                  }`}
                >
                  {/* Başlık satırı */}
                  <div className="flex items-center gap-3 p-4">
                    <span className="shrink-0 text-xl leading-none">{itiraz.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1D47] dark:text-[#fda4af] mb-0.5">
                        {itiraz.kategori}
                      </p>
                      <p className="text-sm font-semibold text-[var(--text-1)] leading-snug">
                        "{itiraz.soru}"
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Cevap — açılır panel */}
                  {acik && (
                    <div className="border-t border-[#9B1D47]/10 dark:border-[#fda4af]/10 px-4 pb-4 pt-3">
                      <div className="flex gap-2">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F3] dark:bg-[#3d0a1a]">
                          <span className="text-[10px]">💡</span>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--text-2)]">
                          {itiraz.cevap}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
