# Network Marketing Master

Network Marketing Master, network marketing ekipleri ve bireysel distribütörler için hazırlanmış bir React + Supabase uygulamasıdır. Kontak yönetimi, süreç takibi, takvim/follow-up planlama, AI mesaj üretimi, itiraz bankası ve eğitim içeriğini tek panelde toplar.

## Özellikler

- Kontak yönetimi: filtreleme, etiketleme, sıcaklık skoru, ilişki geçmişi
- Süreç takibi: pipeline, fırsat yönetimi, aşama bazlı görünüm
- Takvim: takipler, randevular, hızlı aksiyon akışı
- AI mesaj üretimi: kontağa ve bağlama göre mesaj varyantları
- Akademi: itiraz bankası, eğitim içeriği, içerik detay sayfaları
- Çok dil desteği: Türkçe varsayılan, İngilizce destekli

## Teknoloji Yığını

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Supabase
- TanStack Query
- Zustand
- react-i18next

## Gerekli Environment Değişkenleri

Frontend için:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Supabase Edge Function için:

- `ANTHROPIC_API_KEY`

Eksik olursa:

- `VITE_SUPABASE_URL` veya `VITE_SUPABASE_ANON_KEY` yoksa uygulama açılışta hata verir ve API/auth akışı çalışmaz.
- `ANTHROPIC_API_KEY` yoksa AI mesaj üretimi çalışmaz; uygulamanın geri kalanı çalışmaya devam eder.

## Local Çalıştırma

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. `.env.local` dosyanıza frontend environment değişkenlerini ekleyin:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

4. Production build kontrolü:

```bash
npm run build
```

## Supabase ve AI Kurulumu

AI mesaj üretimi `supabase/functions/generate-message` edge function’ı üzerinden çalışır.

Örnek deploy akışı:

```bash
supabase functions deploy generate-message
supabase secrets set ANTHROPIC_API_KEY=...
```

Supabase şema değişiklikleri repo içindeki SQL dosyalarında tutulur. Gerekli migration/script dosyalarını manuel olarak çalıştırmanız gerekir.

## Deploy

Frontend Vercel üzerinde deploy edilebilir. SPA yönlendirmesi için `vercel.json` zaten repo içinde bulunur.

Vercel’e deploy etmeden önce:

1. Proje environment değişkenlerini tanımlayın:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
2. Supabase edge function’ın deploy edildiğinden ve `ANTHROPIC_API_KEY` secret’ının tanımlı olduğundan emin olun.
3. Build kontrolü yapın:

```bash
npm run build
```

Hedef canlı domain:

- `https://networkmarketing.suattayfuntopak.com`

## Production Smoke Checklist

Canlı domaine bağlamadan veya yeni release aldıktan sonra şu akışları kontrol edin:

1. Auth:
   login, register, forgot password, reset password, email confirm
2. Dashboard:
   ilk açılış, route geçişleri, dil değişimi
3. Contacts:
   liste, filtre, yeni kayıt, detay, düzenleme, import
4. Messages:
   template oluşturma, AI modal açılışı, mesaj üretimi, history görünümü
5. Academy:
   içerik listesi, itiraz bankası, detay sayfası, kopyala/düzenle modalı
6. Analytics ve Settings:
   sayfa yüklenmesi, temel render, hata vermeden açılması
7. SEO/share:
   title, description, OG preview, favicon

## Dizin Yapısı

```text
src/
  app/
  components/
  hooks/
  i18n/
  lib/
  pages/
  stores/
  styles/
  types/

supabase/
  functions/

docs/
  FAZ_4.md
  patterns.md
  regressions.md
```

## Release Notları

- Uygulama route-level lazy loading ile ilk yükleme için optimize edilmiştir.
- AI mesaj üretimi daha ayrıştırılmış hata yönetimi ile çalışır.
- Türkçe ve İngilizce modlarda temel i18n cleanup uygulanmıştır.
