# CLAUDE.md — Faz 0: Proje Temeli

## 🎯 BU SEANSIN AMACI

Network Marketing Master uygulamasının **sıfırdan teknik temelini** kurmak:
1. Proje iskeleti (Vite + React 19 + TypeScript + Tailwind v4)
2. Supabase kurulumu (şema, RLS, auth)
3. Landing page (public)
4. Auth akışı (kayıt, giriş, şifre sıfırlama)
5. Dashboard layout + navigasyon + dark mode

**Seans sonunda:** Kullanıcı kayıt olabilmeli, giriş yapabilmeli, boş ama çalışan bir dashboard görmeli.

---

## 📐 PROJE KİMLİĞİ

- **Ad:** Network Marketing Master
- **Kısa ad:** NMM
- **Slogan:** "Distribütörün dijital komut merkezi"
- **Dil:** Türkçe (UI), İngilizce (kod, commit mesajları)
- **Renk paleti:** Primary = Emerald (yeşil, büyüme), Accent = Amber (enerji)
- **DB prefix:** `nmm_` (paylaşımlı Supabase hesabında izolasyon için)

---

## 🛠️ TEKNİK YIĞIN

```
Frontend:    React 19 + TypeScript + Vite 5
Styling:     Tailwind CSS v4 + shadcn/ui
State:       Zustand (client) + TanStack Query (server)
Routing:     React Router v6
Forms:       react-hook-form + zod
Backend:     Supabase (Postgres + Auth + Storage + Realtime)
Icons:       lucide-react
Date:        date-fns (tr locale)
Deploy:      Vercel
```

---

## 📁 KLASÖR YAPISI

```
src/
├── app/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── MobileNav.tsx
│   └── providers/
│       ├── QueryProvider.tsx
│       ├── ThemeProvider.tsx
│       └── AuthProvider.tsx
├── pages/
│   ├── public/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   └── dashboard/
│       └── DashboardHome.tsx
├── components/
│   ├── ui/           (shadcn bileşenleri)
│   ├── landing/
│   └── shared/
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   └── useTheme.ts
├── stores/
│   └── authStore.ts
├── types/
│   ├── database.ts
│   └── index.ts
├── styles/
│   └── globals.css
├── App.tsx
├── main.tsx
└── router.tsx
```

---

## 🗄️ SUPABASE ŞEMASI (FAZ 0)

**ÖNEMLİ:** Tüm tablolar `nmm_` prefix'i ile oluşturulacak (paylaşımlı Supabase hesabında diğer projelerle karışmasın diye).

### Tablolar

```sql
-- nmm_profiles: Kullanıcı profili
CREATE TABLE nmm_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  sponsor_name TEXT,
  role TEXT DEFAULT 'distributor' CHECK (role IN ('distributor', 'leader', 'admin')),
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Istanbul',
  language TEXT DEFAULT 'tr',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION nmm_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nmm_profiles_updated_at
  BEFORE UPDATE ON nmm_profiles
  FOR EACH ROW EXECUTE FUNCTION nmm_update_updated_at_column();

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
CREATE OR REPLACE FUNCTION nmm_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nmm_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_nmm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION nmm_handle_new_user();
```

### RLS Politikaları

```sql
ALTER TABLE nmm_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON nmm_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON nmm_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON nmm_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('nmm-avatars', 'nmm-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "NMM avatar upload policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nmm-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "NMM avatar public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nmm-avatars');
```

---

## 🔐 AUTH AKIŞI

### Kayıt (Register)
1. Form: email, şifre, şifre tekrar, tam ad, telefon (opsiyonel)
2. Zod validation (email format, şifre min 8 karakter + 1 sayı + 1 büyük harf)
3. `supabase.auth.signUp()` çağrısı
4. Trigger otomatik `nmm_profiles` kaydı oluşturur
5. Email doğrulama linki gönderilir
6. Kullanıcı "Email'ini kontrol et" sayfasına yönlenir

### Giriş (Login)
1. Form: email, şifre
2. `supabase.auth.signInWithPassword()`
3. Başarılı → `/pano` yönlendirme
4. Başarısız → hata mesajı (Türkçe)

### Şifre Sıfırlama
1. Form: email
2. `supabase.auth.resetPasswordForEmail()`
3. Email'deki link `/sifre-yenile?token=...`
4. Yeni şifre formu
5. Başarılı → giriş sayfasına yönlendir

### Oturum Yönetimi
- `AuthProvider` component `supabase.auth.onAuthStateChange` dinler
- Zustand store'da `user`, `session`, `profile` tutulur
- Protected route wrapper: oturum yoksa `/giris`'e yönlendir

---

## 🎨 LANDING PAGE YAPISI

Tek sayfa, scroll-based, 7 bölüm:

### 1. Hero
- Başlık: "Distribütörün Dijital Komut Merkezi"
- Alt başlık: "Kontakları yönet, AI ile mesaj üret, ekibini büyüt — hepsi tek yerde"
- CTA: "Ücretsiz Başla" (primary) + "Demo İzle" (secondary)
- Arka plan: Gradient (emerald → teal) + subtle grid pattern

### 2. Sorun Bölümü ("Tanıdık geliyor mu?")
3 kart:
- "Listeler dağınık, takipler kayıp"
- "Sunum sonrası 'düşüneceğim' — sonra?"
- "Ekipte kim aktif bilmiyorum"

### 3. Çözüm / Özellikler
6 özellik kartı:
- 🎯 Akıllı Günlük Görev Listesi
- 🌡️ Lead Sıcaklık Skoru
- 💬 AI Mesaj Üretici
- 📊 Pipeline Takibi
- 👥 Ekip Radar
- 🎓 İtiraz Bankası

### 4. Nasıl Çalışır (3 Adım)
1. Kontaklarını ekle
2. AI önceliklendirsin
3. Doğru kişiyle doğru zamanda konuş

### 5. Fiyatlandırma
3 plan: Başlangıç (ücretsiz), Pro (₺299/ay), Ekip (₺799/ay)

### 6. SSS
Accordion, 6-8 soru

### 7. Footer
Logo, linkler, sosyal medya, telif

---

## 🖼️ DASHBOARD LAYOUT

### Desktop (≥1024px)
- Sol sidebar (240px)
- Üst bar (64px)
- Ana içerik: padding 24px

### Tablet (768-1024px)
- Sidebar collapsed (64px, hover'da genişler)

### Mobile (<768px)
- Alt tab bar (5 ikon)
- Hamburger menü

### Sidebar Menü Öğeleri
```
📊 Pano               /pano
👥 Kontaklar          /kontaklar
📋 Pipeline           /pipeline
💬 Mesajlar           /mesajlar
📅 Takvim             /takvim
🎓 Akademi            /akademi
👨‍👩‍👧 Ekip               /ekip (sadece lider)
📈 Analiz             /analiz
⚙️ Ayarlar            /ayarlar
```

---

## 🎨 DESIGN SYSTEM

### Renkler (Tailwind v4 CSS variables)

```css
@theme {
  --color-primary-50: oklch(0.98 0.02 150);
  --color-primary-500: oklch(0.65 0.18 155);
  --color-primary-600: oklch(0.58 0.20 155);
  --color-primary-900: oklch(0.30 0.12 155);
  --color-accent-500: oklch(0.75 0.15 75);
  --color-success: oklch(0.65 0.18 155);
  --color-warning: oklch(0.75 0.15 75);
  --color-danger: oklch(0.60 0.22 25);
  --color-info: oklch(0.65 0.15 240);
}
```

### Tipografi
- Font: Inter (Google Fonts)
- Başlıklar: font-bold, tracking-tight
- Metin: font-normal, leading-relaxed

### Bileşenler (shadcn)
Button, Input, Label, Card, Dialog, Dropdown, Toast, Avatar, Badge, Tabs, Sheet, Select, Textarea, Switch, Separator

---

## 📦 ENV DEĞİŞKENLERİ

```env
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Network Marketing Master
VITE_DB_PREFIX=nmm_
VITE_STORAGE_BUCKET=nmm-avatars
```

---

## ✅ FAZ 0 GÖREV LİSTESİ (Sırayla)

### 1. Proje Kurulumu
- [ ] `npm create vite@latest . -- --template react-ts` (nokta = mevcut klasör)
- [ ] Bağımlılıklar: tailwindcss@next, react-router-dom, zustand, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers, @supabase/supabase-js, lucide-react, date-fns
- [ ] Tailwind v4 config (CSS-first, @import "tailwindcss")
- [ ] shadcn/ui: `npx shadcn@latest init`
- [ ] Temel shadcn bileşenlerini ekle
- [ ] Klasör yapısını oluştur
- [ ] ESLint + Prettier config

### 2. Supabase Kurulumu
- [ ] Supabase projesi hazır (manuel olarak kullanıcı tarafından kuruldu)
- [ ] `supabase gen types typescript --project-id XXX > src/types/database.ts`
- [ ] `lib/supabase.ts` client'ı kur

### 3. Auth Altyapısı
- [ ] `AuthProvider` component
- [ ] `authStore` (Zustand)
- [ ] `useAuth` hook
- [ ] `ProtectedRoute` wrapper
- [ ] Session persistence

### 4. Public Sayfalar
- [ ] Landing page (7 bölüm)
- [ ] Login page + form validation
- [ ] Register page + form validation
- [ ] Forgot password page
- [ ] Reset password page
- [ ] Email confirmation page

### 5. Dashboard Layout
- [ ] `DashboardLayout` component
- [ ] `Sidebar` (desktop + collapsed)
- [ ] `Topbar` (search, theme, user menu)
- [ ] `MobileNav` (bottom tab bar)
- [ ] Dark mode toggle + persistence
- [ ] `DashboardHome` placeholder

### 6. Router
- [ ] Public routes
- [ ] Protected routes (auth gerekli)
- [ ] 404 sayfası
- [ ] Loading states

### 7. Test & Deploy
- [ ] Manuel test: kayıt → email doğrulama → giriş → dashboard
- [ ] Mobile responsive kontrol
- [ ] Dark mode kontrol
- [ ] Vercel'e deploy
- [ ] Environment variables Vercel'de ayarla

---

## 📏 KOD STANDARTLARI

### Dosya İsimlendirme
- Component: `PascalCase.tsx`
- Hook: `camelCase.ts` (use ile başlar)
- Utility: `camelCase.ts`

### Import Sıralaması
1. React & external libraries
2. Internal absolute imports (`@/...`)
3. Relative imports
4. Types
5. Styles

### Commit Mesajları
```
feat: add landing page hero section
fix: correct auth redirect loop
refactor: extract sidebar to separate component
docs: update CLAUDE.md for faz 1
```

---

## 🚀 BAŞARI KRİTERLERİ

1. ✅ `npm run dev` hatasız başlıyor
2. ✅ `/` landing page açılıyor, responsive
3. ✅ `/kayit` ile yeni kullanıcı oluşturulabiliyor
4. ✅ Email doğrulama akışı çalışıyor
5. ✅ `/giris` ile giriş yapılabiliyor
6. ✅ `/pano` sadece auth'lu erişilebiliyor
7. ✅ Dashboard layout tüm ekran boyutlarında düzgün
8. ✅ Dark mode toggle çalışıyor, tercih hatırlanıyor
9. ✅ `nmm_profiles` tablosunda kullanıcı kaydı var
10. ✅ Çıkış yapıldığında `/giris`'e yönleniyor
11. ✅ Vercel'de deploy edildi, canlı

---

## 🧭 SONRAKI SEANS (Faz 1 Önizleme)

Faz 1'de:
- `nmm_contacts`, `nmm_interactions`, `nmm_tags` tabloları
- Kontak ekleme formu (WhatsApp, Telegram, email, telefon)
- Kontak listesi (filtre, arama, sıralama)
- Kontak detay sayfası (360° görünüm)
- CSV import/export
- Etiketleme sistemi

---

## 💡 NOTLAR

- **Sonnet kullan**, Opus'u sadece mimari kararlarda çıkar
- Her büyük değişiklikten sonra `git commit` yap
- Tailwind v4 eski v3'ten farklı — `@theme` directive kullan
- Supabase type generation'ı her şema değişikliğinde tekrarla
- RLS politikalarını unutma — auth.uid() ile eşleştir
- Türkçe metinler için date-fns `tr` locale kullan
- **TÜM tablolar `nmm_` prefix'li**, storage bucket `nmm-avatars`

---

## 🆘 YAYGIN HATALAR & ÇÖZÜMLER

**"Invalid API key"** → `.env.local` dosyasında `VITE_` prefix'i var mı?

**"RLS violation"** → Policy `auth.uid()` ile eşleşiyor mu?

**Trigger çalışmıyor** → `SECURITY DEFINER` var mı?

**Tailwind v4 class'ları çalışmıyor** → `@import "tailwindcss"` var mı `globals.css`'te?

**Dark mode flicker** → ThemeProvider'ı erken set et

---

**Hazır mısın? Başlayalım.** 🚀
