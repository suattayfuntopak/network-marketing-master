# REGRESSIONS.md — Yaşanan Bug'lar ve Sebepleri

Bu dosya daha önce yaşanan bug'ları ve çözümlerini kayıt altında tutar. 
AYNI HATAYI TEKRAR YAPMAMAK için her seans başında oku.

## 🔥 BUG #1 — Form Loading Stuck (5 kez yaşandı!)

**Semptom:** "Kaydediliyor...", "Giriş yapılıyor...", "Hesap oluşturuluyor..." 
butonları sonsuz bekleme moduna giriyor. Arkada işlem başarılı olsa bile UI 
güncellenmiyor.

**Görüldüğü yerler:**
- RegisterPage.tsx
- LoginPage.tsx
- ContactForm.tsx
- NewDealModal.tsx
- NewAppointmentModal.tsx
- NewFollowUpModal.tsx

**Kök sebep:** react-hook-form'un `formState.isSubmitting`'i bu projede bir 
şekilde düzgün reset olmuyor. Büyük ihtimalle async işlem + navigate + 
component unmount timing sorunu.

**Çözüm:** `PATTERNS.md` → "Form Loading Pattern"
- Manuel `useState` kullan
- try/catch/finally ile garantili reset
- Double-submit guard: `if (loading) return;`

**Önlem:**
- Yeni form/modal yazarken HİÇBİR ZAMAN `isSubmitting` kullanma
- `grep -r "isSubmitting" src/` ile kontrol et, varsa değiştir

---

## 🔥 BUG #2 — i18n Regression (4 kez)

**Semptom:** Yeni feature eklerken mevcut t() çağrıları bozuldu, dil değiştirme 
bazı yerlerde çalışmadı.

**Görüldüğü yerler:**
- i18n kurulduktan sonra LoginPage yeniden yazılırken loading fix ezildi
- Aşama badge'leri (StageBadge) hardcoded kaldı
- Etiket isimleri çevrilmedi
- Kanban kolon başlıkları DB name'den geldi, t() kullanmadı

**Kök sebep:** Yeni feature eklerken mevcut dosyaları komple yeniden yazma 
alışkanlığı. Önceki fix'ler eziliyor.

**Çözüm:**
- Dosya düzenleme DIFF ile yap, komple rewrite yapma
- Enum değerleri HER ZAMAN `t('namespace.${value}')` ile çevir
- DB'den gelen label'ı direkt gösterme

**Önlem:**
- Her commit öncesi dil değiştir, tüm sayfaları hızlıca dolaş
- `grep -r "STAGE_LABELS\|SOURCE_LABELS" src/` — hard-coded varsa düzelt

---

## 🔥 BUG #3 — database.ts Bozulması

**Semptom:** Supabase CLI interactive prompt'u yanlışlıkla `database.ts` 
dosyasına yazıldı, dosya bozuldu, TypeScript hataları çıktı.

**Kök sebep:** `npx supabase gen types typescript > src/types/database.ts` 
komutu login isterken Ctrl+C yapıldı, komut yarıda kaldı, output bozuldu.

**Çözüm:** `git checkout src/types/database.ts` ile restore.

**Önlem:**
- Supabase CLI komutlarını önce test et
- Output redirect'li komutları interactive olduklarında KULLANMA
- database.ts'yi elle düzenle veya gen types tamamlandıktan sonra yeniden çalıştır

---

## 🔥 BUG #4 — lucide-react Instagram Icon

**Semptom:** `SyntaxError: Importing binding name 'Instagram' is not found.`
Beyaz ekran, uygulama açılmıyor.

**Kök sebep:** lucide-react'in yeni sürümünde brand ikonları (Instagram, 
Facebook, Twitter vb.) kaldırıldı. Sosyal medya ikonları artık ayrı bir 
kütüphanede (simple-icons veya react-icons).

**Çözüm:**
- `Instagram` → `AtSign` veya `Camera`
- `Facebook` → `Share2`
- Diğer brand ikonlar için `lucide-react` yerine `react-icons/si` kullan

**Önlem:**
- lucide-react'ten sadece jenerik ikonları kullan
- Brand ikonları gerekiyorsa `react-icons` kur

---

## 🔥 BUG #5 — DropdownMenu Group Missing

**Semptom:** `Base UI: MenuGroupRootContext is missing. Menu group parts must 
be used within <Menu.Group>.`

**Kök sebep:** `DropdownMenuLabel` veya `DropdownMenuGroup` içermeyen 
`DropdownMenuContent` yapısı. @base-ui/react strict group hierarchy bekliyor.

**Çözüm:** `PATTERNS.md` → "Shadcn Dropdown Pattern"
- Her Label/Item group içine alınmalı
- `<DropdownMenuGroup>` sarmalayıcı zorunlu

---

## 🔥 BUG #6 — Supabase Trigger RLS Violation

**Semptom:** Yeni kullanıcı kaydı 500 hata veriyor, 
`nmm_handle_new_user` fonksiyonu çalışmıyor.

**Kök sebep:** Trigger fonksiyonu `SECURITY DEFINER` var ama `search_path` 
yok. Supabase Auth admin trigger'ı çalıştırırken RLS'e takılıyor.

**Çözüm:**
```sql
CREATE OR REPLACE FUNCTION nmm_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.nmm_profiles (...) VALUES (...);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON nmm_profiles TO supabase_auth_admin;
```

**Önlem:**
- HER trigger fonksiyonunda `SECURITY DEFINER SET search_path = public`
- Tablo isimlerini `public.nmm_table` şeklinde tam yaz
- Exception handling ile RETURN NEW yap (auth akışını bozmasın)

---

## 🔥 BUG #7 — Query Cache Bayat Veri

**Semptom:** Kontak listesine yeni kontak eklendi, geri döndüğünde liste boş 
veya eski hali görünüyor.

**Kök sebep:** TanStack Query cache'lenen veri invalidate edilmiyor. 
`staleTime: Infinity` gibi agresif cache ayarları + `invalidateQueries` 
çağrılmıyor.

**Çözüm:**
- Mutation sonrası `queryClient.invalidateQueries({ queryKey: ['contacts'] })`
- Query key'de filters'ı dahil et
- `staleTime: 0` ve `refetchOnMount: true` listeler için

---

## 🔥 BUG #8 — Kontak Detay Sadece İlk Kontak İçin Açılıyor

**Semptom:** Kontaklar listesinde sadece ilk kontağa (Ahmet) tıklayınca detay 
sayfası açılıyor, diğerleri "Yükleniyor..." takılı kalıyor.

**Kök sebep:** `ContactDetailPage` component'i id prop'u değiştiğinde remount 
olmuyor. React aynı component instance'ını kullanıyor, useEffect tetiklenmiyor.

**Çözüm:** Router route'unda `key={id}` kullan:
```tsx
<Route 
  path="/kontaklar/:id" 
  element={<ContactDetailWrapper />} 
/>

function ContactDetailWrapper() {
  const { id } = useParams();
  return <ContactDetailPage key={id} id={id} />;
}
```

---

## 🔥 BUG #9 — Select Seçili Değer Gösterimi

**Semptom:** Select'te "Tavsiye" option seçilince tekrar "referral" (DB değeri) 
gösteriliyor.

**Kök sebep:** `<SelectValue>` default olarak VALUE gösterir, LABEL değil.

**Çözüm:** Custom display:
```tsx
<SelectValue>
  {({ value }) => value ? t(`sources.${value}`) : 'Seçin...'}
</SelectValue>
```

---

## 🔥 BUG #10 — Appointment Click → 404

**Semptom:** Takvimde randevuya tıklanınca 404 alıyordu veya boş sayfa açılıyordu.

**Görüldüğü yerler:**
- AppointmentBadge.tsx (CalendarMonthView içinde)
- AppointmentCard.tsx (CalendarWeekView, CalendarDayView)
- CalendarAgendaView.tsx (direkt navigate)

**Kök sebep:** `navigate(${ROUTES.CALENDAR}/${appointment.id})` kullanılıyordu ama
bu route router.tsx'te tanımlanmamış.

**Çözüm:** `onClick?: (apt: AppointmentWithContact) => void` callback prop eklendi.
CalendarPage'de `handleAppointmentClick` handler açıp edit modalı açıyor.

**Önlem:**
- Navigasyonu doğrudan component içinde YAPMA, CalendarPage'den callback geçir
- Yeni calendar link'i ekleyeceksen router.tsx'te route var mı kontrol et

---

## 🔥 BUG #11 — Takip Oluşturulunca Listede Görünmüyordu

**Semptom:** Yeni takip oluşturulduktan sonra FollowUpsPage listesi güncellenmiyor,
sadece sayfayı yenileyince görünüyordu.

**Görüldüğü yerler:** FollowUpsPage.tsx, useFollowUpBuckets

**Kök sebep:** `staleTime: 30_000` — yeni kayıt sonrası 30 sn boyunca cache'den geliyordu.

**Çözüm:** `staleTime: 0, refetchOnMount: 'always'` yapıldı. Mutasyon zaten
invalidateQueries çağırıyordu, bu yeterliydi.

**Önlem:**
- Liste query'leri için staleTime: 0 veya düşük tut
- Detay query'leri (useDeal, useAppointment) için staleTime yüksek olabilir

---

## 🔥 BUG #12 — Double-Toast (Mutation Hook + Modal ikisi de toast gösterdi)

**Semptom:** Takip veya randevu kaydedilince başarı mesajı 2 kez çıkıyordu.

**Kök sebep:** Mutation hook (useCreateFollowUp, useUpdateFollowUp vb.) onSuccess'te
toast.success gösteriyor. Modal da aynı toast'ı manuel olarak gösteriyordu.

**Çözüm:** NewFollowUpModal ve NewAppointmentModal'dan modal içindeki toast.success
çağrıları kaldırıldı. Sadece mutasyon hook'undaki toast kaldı.

**Önlem:**
- Mutasyon hook'u zaten toast gösteriyorsa component içinde tekrarlama

---

## 🔥 BUG #13 — Pipeline Stage İsimleri İngilizce'de Türkçe Kalıyordu

**Semptom:** Dil İngilizce seçilince pipeline kolonlarının başlıkları Türkçe
"Sunum Yapıldı", "Düşünüyor" vb. gösteriyordu.

**Kök sebep:** `KanbanColumn.tsx` ve `DealDetailPage.tsx` `stage.name` değerini
direkt kullanıyordu. DB'de stage adları Türkçe kayıtlı.

**Çözüm:** `t('pipelineStages.${stage.slug}', { defaultValue: stage.name })`
pattern'i kullanıldı. tr.json ve en.json'a `pipelineStages.*` namespace eklendi.

**Önlem:**
- DB'den gelen herhangi bir label'ı direkt UI'a basma
- Enum değerleri ve slug'lar her zaman `t('namespace.${value}')` ile çevir

---

## 📝 Yeni Bug Şablonu

```markdown
## 🔥 BUG #N — [Kısa İsim]

**Semptom:** [Kullanıcının gördüğü]

**Görüldüğü yerler:** [Hangi dosyalar]

**Kök sebep:** [Neden oluştu]

**Çözüm:** [Nasıl düzeltildi]

**Önlem:** [Tekrar olmaması için]
```

Her yeni regression yaşandığında buraya ekle.
