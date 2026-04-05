import { Link } from 'react-router-dom'
import {
  Zap, Target, Thermometer, MessageSquare, BarChart2, Users2, BookOpen,
  ArrowRight, CheckCircle, Star, ChevronDown, ChevronUp
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Target,
    title: 'Akıllı Günlük Görev Listesi',
    desc: 'AI, bugün kime ulaşman gerektiğini söyler. Tahmin yok, öncelikli aksiyon var.',
  },
  {
    icon: Thermometer,
    title: 'Lead Sıcaklık Skoru',
    desc: 'Her kontağın hazırlık seviyesini anlık takip et. Doğru kişiye doğru zamanda ulaş.',
  },
  {
    icon: MessageSquare,
    title: 'AI Mesaj Üretici',
    desc: 'Kontağa özel, doğal ve ikna edici mesajları saniyeler içinde oluştur.',
  },
  {
    icon: BarChart2,
    title: 'Pipeline Takibi',
    desc: 'Satış sürecinin her aşamasını görsel olarak takip et. Hiçbir şans kaçırma.',
  },
  {
    icon: Users2,
    title: 'Ekip Radar',
    desc: 'Ekibinin aktivitesini gerçek zamanlı izle. Kim aktif, kim desteğe ihtiyaç duyuyor?',
  },
  {
    icon: BookOpen,
    title: 'İtiraz Bankası',
    desc: 'En yaygın itirazlara hazır yanıtlar. Sunum sırasında anında cevap ver.',
  },
]

const plans = [
  {
    name: 'Başlangıç',
    price: 'Ücretsiz',
    period: '',
    desc: 'Bireysel distribütörler için',
    features: ['50 kontak', 'Temel pipeline', 'AI mesaj (5/gün)', 'Mobil uygulama'],
    cta: 'Ücretsiz Başla',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₺299',
    period: '/ay',
    desc: 'Büyümeye odaklanmış distribütörler için',
    features: ['Sınırsız kontak', 'Gelişmiş pipeline', 'Sınırsız AI mesaj', 'Lead skoru', 'Öncelikli destek'],
    cta: 'Pro Başla',
    highlighted: true,
  },
  {
    name: 'Ekip',
    price: '₺799',
    period: '/ay',
    desc: 'Liderler ve ekip yöneticileri için',
    features: ['Pro özelliklerin hepsi', 'Ekip radar', '20 takım üyesi', 'Ekip analizleri', 'Özel eğitim'],
    cta: 'Ekip Başla',
    highlighted: false,
  },
]

const faqs = [
  {
    q: 'NMM nedir ve kime yönelik?',
    a: 'Network Marketing Master (NMM), multi-level marketing (MLM) distribütörlerine yönelik bir dijital yönetim aracıdır. Kontak takibi, AI destekli mesajlaşma ve ekip yönetimi özelliklerini tek platformda sunar.',
  },
  {
    q: 'Ücretsiz plan yeterli mi?',
    a: 'Başlangıç için evet! 50 kontak ve temel özelliklerle işe başlayabilirsin. Ekibin büyüdükçe Pro veya Ekip planına geçmek çok kolay.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Evet. Tüm veriler Supabase (PostgreSQL) üzerinde şifreli olarak saklanır. Row Level Security ile yalnızca kendi verilerine erişebilirsin.',
  },
  {
    q: 'Hangi network marketing şirketleriyle çalışır?',
    a: 'NMM şirketten bağımsızdır. Amway, Herbalife, Oriflame, Avon gibi tüm MLM şirketleriyle kullanılabilir.',
  },
  {
    q: 'Mobil uygulaması var mı?',
    a: 'Web uygulaması tüm mobil cihazlarda optimize çalışır. Native iOS/Android uygulamaları yol haritamızda.',
  },
  {
    q: 'İptal edebilir miyim?',
    a: 'Evet, istediğin zaman iptal edebilirsin. Ücretlendirme aylık dönemler halindedir, dönem sonunda iptal gerçekleşir.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex items-center justify-between w-full py-4 text-left text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground">{a}</p>}
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold">NMM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Özellikler</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Fiyatlar</a>
            <a href="#faq" className="hover:text-foreground transition-colors">SSS</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">Giriş</Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button size="sm">Başla</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 sm:py-32">
        <div className="absolute inset-0 bg-[size:32px_32px] opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6">
            Distribütörün dijital komut merkezi
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Network Marketing'i{' '}
            <span className="text-primary">Akıllıca</span>{' '}
            Yönet
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Kontakları yönet, AI ile mesaj üret, ekibini büyüt — hepsi tek yerde.
            Dağınık listeler ve kaçırılan takipler tarih oluyor.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Ücretsiz Başla
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Özellikleri Keşfet
              </Button>
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-primary" />
              Kredi kartı gerekmez
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-primary" />
              Anında kurulum
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-primary" />
              İstediğin zaman iptal
            </div>
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Tanıdık geliyor mu?</h2>
            <p className="text-muted-foreground mt-2">Çoğu distribütörün yaşadığı sorunlar</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: '📋', title: 'Listeler dağınık, takipler kayıp', desc: 'Not defteri, WhatsApp, Excel... Kontaklar her yerde ama hiçbir yerde değil.' },
              { emoji: '😓', title: '"Düşüneceğim" — sonra?', desc: 'Sunum yaptın, ilgi gösterdi. Ama ne zaman takip edeceksin? Kaç gün sonra?' },
              { emoji: '🤷', title: 'Ekipte kim aktif bilmiyorum', desc: 'Downline büyüdükçe takip zorlaşıyor. Kim destek bekliyor, bilmiyorsun.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-border bg-background">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Her şey tek platformda</h2>
            <p className="text-muted-foreground mt-2">Network marketing başarısı için ihtiyacın olan tüm araçlar</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Nasıl Çalışır?</h2>
            <p className="text-muted-foreground mt-2">3 basit adımda başarıya ulaş</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Kontaklarını Ekle', desc: 'Mevcut listeni import et veya tek tek ekle. WhatsApp, Telegram, telefon — her kanalı destekliyoruz.' },
              { step: '2', title: 'AI Önceliklendirsin', desc: 'Yapay zeka her kontağı analiz eder, sıcaklık skoru verir ve bugünkü aksiyonlarını listeler.' },
              { step: '3', title: 'Doğru Kişiyle Ulaş', desc: 'Hazırladığı mesajı gönder, takip zamanlamasını ayarla ve sonuçları izle.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Basit Fiyatlandırma</h2>
            <p className="text-muted-foreground mt-2">Sürpriz yok, gizli ücret yok</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'p-6 rounded-xl border',
                  plan.highlighted
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border'
                )}
              >
                {plan.highlighted && (
                  <Badge className="mb-3 bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    En Popüler
                  </Badge>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={ROUTES.REGISTER}>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Sık Sorulan Sorular</h2>
          </div>
          <div className="bg-background rounded-xl border border-border px-6">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold">Bugün başla, fark yarat</h2>
          <p className="text-muted-foreground mt-3 mb-8">
            Kredi kartı gerektirmez. 2 dakikada kurulum. İstediğin zaman iptal.
          </p>
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" className="gap-2">
              Ücretsiz Hesap Oluştur
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm">Network Marketing Master</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Özellikler</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Fiyatlar</a>
              <a href="#faq" className="hover:text-foreground transition-colors">SSS</a>
              <Link to={ROUTES.LOGIN} className="hover:text-foreground transition-colors">Giriş</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NMM. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
