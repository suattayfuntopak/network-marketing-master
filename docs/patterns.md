# PATTERNS.md — Zorunlu Kod Pattern'ları

Bu dosyadaki pattern'lar projede defalarca test edildi ve çalışıyor. 
YENİ PATTERN İCAT ETME, buradakileri kullan.

## 🔴 FORM LOADING PATTERN (EN ÖNEMLİ)

**Problem:** react-hook-form'un `formState.isSubmitting`'i bu projede takılı kalıyor. 
"Kaydediliyor..." ekranında sonsuz bekleme olur. Bu bug 5 kez yaşandı.

**Çözüm:** Manuel useState + try/catch/finally pattern'i ZORUNLU.

### ✅ DOĞRU PATTERN

```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function MyFormModal({ onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Form field state'leri (react-hook-form kullanıyorsan sadece validation için)
  const [formData, setFormData] = useState({ title: '', ... });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Double-submit guard — ÖNEMLİ!
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('nmm_table_name')
        .insert({ ...formData });
      
      if (error) throw error;
      
      toast.success(t('namespace.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['tableName'] });
      onClose(); // modal kapat
    } catch (err: any) {
      console.error('[MyFormModal] Error:', err);
      toast.error(err?.message || t('common.error'));
    } finally {
      setLoading(false); // GARANTİLİ false'a dön
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* fields */}
      <button 
        type="submit" 
        disabled={loading}
        className="..."
      >
        {loading ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
```

### ❌ YANLIŞ — ASLA YAPMA

```tsx
// YANLIŞ — isSubmitting takılıyor
const { formState: { isSubmitting }, handleSubmit } = useForm();
<button disabled={isSubmitting}>
  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
</button>

// YANLIŞ — try/catch yok, hata loading'i kapatmaz
const handleSubmit = async () => {
  setLoading(true);
  await supabase.from('...').insert(...);
  setLoading(false);
};

// YANLIŞ — finally yok
const handleSubmit = async () => {
  setLoading(true);
  try {
    await supabase.from('...').insert(...);
    setLoading(false);
  } catch (err) {
    // setLoading(false) burada YOK, takılır
  }
};
```

### 🔐 Login/Register/Navigate Durumu

Login gibi başarıyla sonrasında navigate eden formlarda:
```tsx
try {
  const { error } = await supabase.auth.signInWithPassword({...});
  if (error) throw error;
  navigate('/pano', { replace: true });
  // setLoading(false) ÇAĞIRMA — navigate ediyoruz, component unmount olacak
} catch (err) {
  toast.error(err.message);
  setLoading(false); // sadece HATA durumunda
}
```

### 🎯 Autofill için FormData Kullan

Safari/Mac parmak izi autofill'i react state'i güncellemeyebilir. Bu yüzden 
auth form'larında native FormData kullan:

```tsx
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  // ...
};

<form onSubmit={handleSubmit}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
</form>
```

---

## 🔍 KONTAK AUTOCOMPLETE PATTERN

**Problem:** Yeni randevu/takip modallarında kontak arayınca sonuç gelmiyor.

### ✅ DOĞRU

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function ContactPicker({ onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data, error } = await supabase
        .from('nmm_contacts')
        .select('id, full_name, phone, whatsapp, avatar_url')
        .ilike('full_name', `%${search}%`)
        .order('full_name')
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: search.length >= 2,
    staleTime: 30000, // 30 sn cache
  });
  
  return (
    <div className="relative">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('common.searchContact')}
      />
      {search.length >= 2 && (
        <div className="absolute dropdown">
          {isLoading && <div>...</div>}
          {!isLoading && contacts.length === 0 && (
            <div>{t('common.noResults')}</div>
          )}
          {contacts.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelected(c);
                onSelect(c);
                setSearch(c.full_name);
              }}
            >
              {c.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 TANSTACK QUERY CACHE PATTERN

**Problem:** Mutation sonrası liste güncellenmiyor, yeni kayıt görünmüyor.

### ✅ DOĞRU

```tsx
const queryClient = useQueryClient();

// Mutation sonrası:
await supabase.from('nmm_contacts').insert(...);
queryClient.invalidateQueries({ queryKey: ['contacts'] });
// TanStack Query otomatik refetch yapar
```

### Query Keys Standartlaştır

```tsx
// ✅ İyi — filters query key'in parçası
useQuery({
  queryKey: ['contacts', { stage, tags, search }],
  queryFn: () => fetchContacts({ stage, tags, search })
});

// ❌ Kötü — filters query key'de yok, cache invalidation bozuk
useQuery({
  queryKey: ['contacts'],
  queryFn: () => fetchContacts({ stage, tags, search })
});
```

---

## 🌐 İ18N PATTERN

### Enum Değerlerini Çevirme

Veritabanında `stage = 'presenting'` saklanıyor. Frontend'de göstermek için:

```tsx
// ✅ DOĞRU
<span>{t(`contactStages.${stage}`)}</span>

// tr.json:
{
  "contactStages": {
    "new": "Yeni Aday",
    "presenting": "Sunum Yapıldı"
  }
}

// en.json:
{
  "contactStages": {
    "new": "New Prospect",
    "presenting": "Presenting"
  }
}

// ❌ YANLIŞ — hard-coded
const STAGE_LABELS = { presenting: 'Sunum Yapıldı' };
<span>{STAGE_LABELS[stage]}</span>
```

### Select Seçili Değer Gösterimi

Select'te option seçilince VALUE değil LABEL gösterilmeli:

```tsx
<Select.Value>
  {({ value }) => value ? t(`sources.${value}`) : t('common.selectPlaceholder')}
</Select.Value>
```

### Yeni Metin Ekleme

```
1. UI'da yeni bir metin gördün: "Randevu Ekle"
2. t() ile çağır: {t('calendar.addAppointment')}
3. tr.json'a ekle: "calendar": { "addAppointment": "Randevu Ekle" }
4. en.json'a ekle: "calendar": { "addAppointment": "Add Appointment" }
5. HER İKİ dosyaya da ekle, unutma
```

---

## 🎨 SHADCN DROPDOWN PATTERN

**Problem:** `MenuGroupRootContext is missing` hatası.

### ✅ DOĞRU — Group ZORUNLU

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>...</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuLabel>Başlık</DropdownMenuLabel>
      <DropdownMenuItem>Öğe 1</DropdownMenuItem>
      <DropdownMenuItem>Öğe 2</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>Çıkış</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

### ❌ YANLIŞ

```tsx
// Group yok, Label direkt Content içinde
<DropdownMenuContent>
  <DropdownMenuLabel>Başlık</DropdownMenuLabel> {/* HATA */}
  <DropdownMenuItem>Öğe 1</DropdownMenuItem>
</DropdownMenuContent>
```

---

## 🗄️ SUPABASE TRIGGER FUNCTION PATTERN

```sql
CREATE OR REPLACE FUNCTION nmm_my_function()
RETURNS TRIGGER AS $$
BEGIN
  -- logic
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in nmm_my_function: %', SQLERRM;
    RETURN NEW; -- Auth akışını bozmamak için
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Kritik:** `SECURITY DEFINER SET search_path = public` olmadan trigger'lar 
RLS tarafından engellenebilir.

---

## 📞 BUGÜN = DATE HELPERS

```tsx
import { 
  format, 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  isPast,
  formatDistanceToNow 
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
const locale = i18n.language === 'tr' ? tr : enUS;

format(date, 'PPP', { locale });              // "5 Nisan 2026"
format(date, 'PPPP', { locale });              // "5 Nisan 2026 Pazar"
formatDistanceToNow(date, { locale, addSuffix: true }); // "3 gün önce"
```

---

Her yeni pattern keşfedince buraya ekle. Gelecek Claude Code seansları bu dosyayı okuyacak.
