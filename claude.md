# CLAUDE.md — Network Marketing Master

## 📐 PROJE KİMLİĞİ

- **Ad:** Network Marketing Master (NMM)
- **Stack:** React 19 + TypeScript + Vite 5 + Tailwind v4 + Supabase + i18next
- **Dil:** Türkçe (UI default), İngilizce (kod, commit)
- **DB prefix:** `nmm_` (tüm tablolar bu prefix'li)
- **Storage bucket:** `nmm-avatars`
- **Brand:** "Network Marketing Master" (TR ve EN'de AYNI, asla çevirme)

## 🎯 SEANS BAŞLANGIÇ PROSEDÜRÜ

Her yeni seansta ŞUNU YAP:
1. Bu dosyayı (CLAUDE.md) oku
2. `docs/PATTERNS.md` oku — ÇALIŞAN kod pattern'ları burada
3. `docs/REGRESSIONS.md` oku — Daha önce yaşanan bug'lar
4. O seansın faz dökümanını oku (örn: `docs/FAZ_3.md`)
5. `git log --oneline -20` ile son commit'leri gör

## ⛔ ASLA YAPMA (KIRMIZI ÇİZGİLER)

### 1. Loading State — `isSubmitting` KULLANMA
react-hook-form'un `formState.isSubmitting` pattern'ı bu projede BOZUK. 
Her form submit'te SADECE `useState` + try/catch/finally kullan.
Detay: `docs/PATTERNS.md` → "Form Loading Pattern"

### 2. Mevcut çalışan özellikleri BOZMA
Yeni faz eklerken şu özellikleri HİÇ değiştirme:
- Login/Register/ForgotPassword akışı
- Kontak CRUD (ContactForm, ContactsListPage)
- Pipeline Kanban drag & drop
- Language switcher (TR/EN)
- Sidebar collapse
- User menu logout

Eğer bir dosyayı değiştirmen gerekirse, değişikliklerinin bu listedeki 
özellikleri etkilemediğinden emin ol. Şüphedeysen sor.

### 3. Yeni kütüphane kurma (izinsiz)
Projede şunlar ZATEN KURULU, bunları kullan:
- **Tarih:** date-fns (FullCalendar kurma!)
- **Form:** react-hook-form + zod (form submit loading'i hariç)
- **State:** Zustand + TanStack Query
- **UI:** shadcn/ui + @base-ui/react
- **Drag & Drop:** @dnd-kit
- **Toast:** sonner
- **i18n:** react-i18next
- **Icons:** lucide-react (ama `Instagram` ikonu YOK, `AtSign` kullan)

### 4. Brand ismini çevirme
"Network Marketing Master" — TR ve EN'de aynı kalır. `t()` ile bağlama.
Ama "Pipeline" → TR'de "Süreç Takibi", "Deal" → TR'de "Fırsat".

### 5. Hard-coded metin yazma
TÜM kullanıcıya görünen metinler `t('namespace.key')` formatında olmalı.
Yeni metin ekliyorsan `tr.json` VE `en.json`'a ikisine birden ekle.

## ✅ HER ZAMAN YAP (ALIŞKANLIKLAR)

### 1. Her büyük değişiklik sonrası
- `npx tsc --noEmit` ile TypeScript kontrol et
- Manuel test et (login + etkilenen sayfa)
- `git commit -m "kısa mesaj"` at

### 2. Her yeni feature için
- Mevcut bir similar feature'a bak (örn: yeni modal için NewDealModal'a bak)
- Aynı pattern'i kopyala
- PATTERNS.md'yi ihlal etme

### 3. Error handling
- Her async işlem try/catch içinde
- Catch içinde `console.error('[ComponentName] Error:', err)` log at
- Kullanıcıya `toast.error(t('common.error'))` göster

### 4. i18n
- Yeni metin → hem tr.json hem en.json
- Select/Dropdown'larda SEÇİLDİKTEN SONRA da label'ı t() ile göster
- Veritabanından gelen enum değerleri (stage, source vb.) frontend'de t() ile çevir

### 5. Commit mesajları
```
feat: add calendar monthly view
fix: resolve appointment modal loading stuck
refactor: extract contact picker to shared component
```

## 📁 KLASÖR YAPISI

```
src/
├── app/           (layout, providers)
├── pages/         (public, dashboard/*)
├── components/    (ui, shared, contacts, pipeline, calendar vb.)
├── hooks/         (use* hook'lar)
├── lib/           (supabase, utils, contacts/, pipeline/, calendar/)
├── stores/        (zustand stores)
├── types/         (database.ts, index.ts)
├── i18n/          (index.ts, locales/tr.json, en.json)
└── styles/        (globals.css)

docs/
├── PATTERNS.md       (zorunlu pattern'lar)
├── REGRESSIONS.md    (yaşanan bug'lar)
├── FAZ_3.md          (mevcut/sıradaki)
└── ...
```

## 🎨 TASARIM İLKELERİ

- **Renk:** Primary = Emerald, Accent = Amber
- **Tipografi:** Inter font
- **Dark mode default**, light mode opsiyonel (sadece 2 state)
- **Mobile-first:** Her sayfa mobilde kullanılabilir olmalı

## 🔐 SUPABASE KURALLARI

- Her yeni tablo `nmm_` prefix'li olmalı
- RLS **her zaman** aktif (`ENABLE ROW LEVEL SECURITY`)
- Her tablo için en az bir policy: `user_id = auth.uid()`
- Trigger fonksiyonları `SECURITY DEFINER SET search_path = public` ile yazılmalı
- Supabase şema değişikliklerini `supabase-schema-fazN.sql` dosyasına yaz, 
  kullanıcı manuel çalıştıracak

## 💬 İLETİŞİM

- Yanıtlar Türkçe (kod yorumları İngilizce)
- "Tamamlandı" demeden önce gerçekten tamamlandığından emin ol
- Task listende "in progress" kalan varsa bitir
- Bilmiyorsan tahmin etme, sor
- Regression yapma — yaptıysan REGRESSIONS.md'ye ekle

---

**Aktif faz:** `docs/FAZ_3.md` — Takvim & Akıllı Takip
