# SPRINT_1_PREMIUM_STABILIZATION.md

## Sprint Amaci

Bu sprintin tek gorevi:

`Projeyi yeni buyuk fazlara guvenle tasiyacak teknik zemini kurmak.`

Bu sprintte yeni buyuk feature acmiyoruz.
Odak:

1. hatalari azaltmak
2. davranis tutarliligini arttirmak
3. gelistirme hizini gelecege hazirlamak

---

## Sprint Cikis Kriteri

Sprint bitmis sayilmasi icin:

1. `npm run build` gecer
2. `npm run lint` temiz olur
3. kontak filtreleme ve sayfalama tutarli olur
4. team ve analytics ekranlari purity-safe hale gelir
5. effect tabanli modal reset davranislari sade ve guvenilir olur

---

## Gorev Listesi

### Gorev 1 - Auth bootstrap temizligi

Dosyalar:

- `src/app/providers/AuthProvider.tsx`

Yapilacaklar:

1. `fetchProfile` akisini hook kurallariyla uyumlu hale getir
2. ilk session bootstrap mantigini daha acik yap
3. loading kapanis davranisini deterministic hale getir
4. demo seed ve profile sync akisini yan etkilerden ayrisacak sekilde sadeletir

Done kriteri:

- lint hatasi kalmayacak
- login / refresh / logout akisi kararsiz hissettirmeyecek

---

### Gorev 2 - Contacts query dogrulugu

Dosyalar:

- `src/lib/contacts/queries.ts`
- `src/hooks/useContacts.ts`
- `src/pages/dashboard/contacts/ContactsListPage.tsx`

Yapilacaklar:

1. tag filtreleme ve pagination tutarsizligini gider
2. `count`, `totalPages`, filtreli sonuc sayisi ve liste ayni gercegi gostersin
3. buyuk veri cekip istemcide filtreleme yapilan alanlari not et
4. ileride RPC'ye tasinacak yerleri ayristir

Done kriteri:

- filtre acik oldugunda sayfa sayisi ve sonuc sayisi tutarli olacak
- ilk sayfada olup ikinci sayfada kaybolan hayalet veri davranisi olmayacak

---

### Gorev 3 - Purity ve memo guvenligi

Dosyalar:

- `src/pages/dashboard/team/TeamPage.tsx`
- `src/pages/dashboard/analytics/AnalyticsPage.tsx`
- `src/pages/dashboard/DashboardHome.tsx`
- `src/pages/dashboard/contacts/ContactsSummaryListPage.tsx`
- `src/pages/dashboard/messages/MessagesPage.tsx`

Yapilacaklar:

1. render sirasinda `Date.now()` kullanma
2. unstable dependency ureten `?? []` ve benzeri kaliplari kontrol et
3. memo girdilerini deterministik hale getir
4. hesaplamalari ya memo icine ya da saf yardimci fonksiyonlara tasi

Done kriteri:

- react purity ve exhaustive-deps kaynakli ana lint hatalari kapanacak

---

### Gorev 4 - Modal ve effect temizligi

Dosyalar:

- `src/components/dashboard/BirthdayMessageDialog.tsx`
- `src/components/messages/AIMessageGeneratorModal.tsx`
- `src/pages/dashboard/pipeline/modals/ManageStagesModal.tsx`

Yapilacaklar:

1. effect icinde senkron `setState` davranislarini azalt
2. acilis/kapanis reset mantigini daha acik kur
3. request olusturma mantigini stabil hale getir
4. kullanici kapatip yeniden actiginda beklenen ilk state net olsun

Done kriteri:

- modal state resetleri tahmin edilebilir olacak
- React lint hatalari kapanacak

---

### Gorev 5 - Presentational component ayrimi

Dosyalar:

- `src/components/contacts/StageBadge.tsx`
- stage bilgisini kullanan ust componentler

Yapilacaklar:

1. gorunum componenti icinden veri fetch etme aliskanligini azalt
2. stage label bilgisini yukari seviyede resolve etmeyi degerlendir
3. badge'i olabildigince saf hale getir

Done kriteri:

- `StageBadge` sadece gosterim sorumlulugu tasir

---

### Gorev 6 - Lint toplama turu

Dosyalar:

- takvim componentleri
- kullanilmayan import ve degiskenlerin oldugu dosyalar
- `router.tsx`
- `components/ui/*`

Yapilacaklar:

1. kullanilmayan importlari temizle
2. fast refresh kuralinda gürültü olan yerleri yapisal olarak duzelt veya uygun sekilde ayarla
3. `any` kullanimlarini azalt
4. warning listesini de minimuma indir

Done kriteri:

- repo temiz teknik sinyal vermeli

---

## Onerilen Calisma Sirasi

Bu sprintte su sirayla ilerle:

1. AuthProvider
2. Contacts query ve pagination
3. Team + Analytics purity temizligi
4. Modal/effect temizligi
5. StageBadge ve sunum component ayrimi
6. Repo capinda kalan lint toplama turu
7. Build + lint + smoke kontrol

Bu sira dogrudur cunku:

- auth ve veri dogrulugu temel
- purity sorunlari sonraki refactorlari bloke ediyor
- modal temizligi davranis kalitesini artiriyor
- kalan lint temizligi en sonda daha hizli toparlaniyor

---

## Smoke Checklist

Sprint sonunda mutlaka kontrol et:

1. login
2. register
3. kontak listesi filtreleme
4. kontak detaya gecis
5. pipeline acilisi
6. analytics acilisi
7. team acilisi
8. birthday dialog acilisi
9. AI message modal acilisi
10. dil degisimi

---

## Bu Sprintin Kazandirdigi Sey

Bu sprint goz alici olmayabilir.
Ama en degerli sprintlerden biri budur.

Cunku bu sprintten sonra:

1. daha hizli gelistiririz
2. daha az bozarak ilerleriz
3. workspace/team mimarisine daha guvenli geceriz
4. premium urun kalitesi sadece tasarimda degil, davranista da hissedilir
