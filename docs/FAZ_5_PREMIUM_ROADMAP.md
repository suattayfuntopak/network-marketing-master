# FAZ_5_PREMIUM_ROADMAP.md

## Amac

Bu belge, Network Marketing Master projesini:

1. calisan ama kirilgan bir urunden
2. guvenilir, olceklenebilir, premium bir saha isletim sistemine

donusturmek icin izlenecek net yol haritasini tanimlar.

Bu proje sadece "kontak tutan bir uygulama" olmayacak.
Hedef, su 4 seyi ayni anda yapan bir platform kurmak:

1. Bireysel distributoru gunluk aksiyonda netlestiren
2. Liderin ekibini erken sinyallerle yonetmesini saglayan
3. Urun satisi ile is firsatini ayni sistemde yoneten
4. Global olcek dusunup local pazarlarda da guclu calisan

## Kuzey Yildizi

Urunun ana vaadi su olmali:

> "Bugun kimi, neden, ne sekilde, hangi sira ile yonetmem gerektigini bana tek ekranda gosteren saha komuta merkezi."

Bu yuzden bundan sonra her gelistirme su soruyu gecmek zorunda:

`Bu degisiklik kullanicinin karar alma hizini, saha netligini veya ekip gorunurlugunu arttiriyor mu?`

Arttirmiyorsa, o degisiklik ya ertelenir ya da sadeletirilir.

---

## Bugunku Durum

Projenin bugunku hali guclu bir temel veriyor:

- Contacts, pipeline, calendar, messages, academy, analytics ve settings omurgasi var.
- Cift dil dusuncesi var.
- Demo workspace fikri dogru.
- Network marketing davranisina gore kurgulanmis mesaj ve egitim mantigi guclu.
- Landing ve urun dili siradan CRM dilinin ustunde.

Ama buyuk urune donusmeden once asmamiz gereken 5 ana engel var:

1. Teknik istikrar tam degil.
2. Veri modeli gercek takim yapisini temsil etmiyor.
3. Bazi ekranlar buyuk veriyle olceklenmez.
4. Test, gozlemleme ve kalite guvencesi zayif.
5. "Premium urun" hissi var ama "premium sistem" disiplini tam oturmamis.

---

## Kirmizi Alanlar

Ilk ele alinmasi gereken mevcut problemler:

1. `lint` temiz degil; React 19 kurallari, effect/state kullanimi ve gereksiz importlar teknik borcu buyutuyor.
2. Kontak filtreleme ve sayfalama mantiginda veri tutarsizligi riski var.
3. Team modulu gercek team/workspace omurgasina degil, distributor tipindeki kontaklara yaslaniyor.
4. Dashboard ve analytics gibi alanlar istemcide fazla veri cekerek hesaplama yapiyor.
5. Test, hata izleme ve release guvenlik kati yok denecek kadar az.

Bu 5 alan duzelmeden "yeni feature" hizini artirmak, gelecekte her seyi daha pahali hale getirir.

---

## Yol Haritasi

Asagidaki sira zorunlu tavsiye sirasidir. Bu sirayi bozmak ileride daha cok is cikarir.

### Faz 5.1 - Stabilizasyon ve Teknik Temizlik

Bu fazin amaci:
Urunu yeni gelistirmelere hazir hale getirmek.

Teslimatlar:

1. `npm run lint` temiz olmali.
2. React effect ve purity hatalari duzeltilmeli.
3. Kontak filtreleme/sayfalama mantigi dogrulanmali.
4. Query key ve invalidation standardi tek bir sistem haline getirilmeli.
5. Presentational component icinden veri sorgusu alma aliskanligi azaltılmali.

Odak dosyalar:

- `src/app/providers/AuthProvider.tsx`
- `src/lib/contacts/queries.ts`
- `src/hooks/useContacts.ts`
- `src/pages/dashboard/team/TeamPage.tsx`
- `src/pages/dashboard/analytics/AnalyticsPage.tsx`
- `src/components/dashboard/BirthdayMessageDialog.tsx`
- `src/components/messages/AIMessageGeneratorModal.tsx`
- `src/pages/dashboard/pipeline/modals/ManageStagesModal.tsx`
- `src/components/contacts/StageBadge.tsx`

Basari kriteri:

- Build ve lint birlikte temiz gececek.
- Liste sayfalama ve filtre sayilari tutarli olacak.
- Sayfa gecislerinde stale data ve effect kaynakli cift render davranislari azalacak.

Neden once bu?

Cunku kirilgan temele premium kat cikilmaz.

---

### Faz 5.2 - Veri Dogrulugu ve Ozet Katmani

Bu fazin amaci:
Buyuk veri geldiginde bile panelin hizli ve guvenilir kalmasi.

Teslimatlar:

1. Dashboard kartlari icin istemcide 500-10000 kayit cekme yaklasimi terk edilmeli.
2. Supabase RPC, SQL view veya summary tablolar ile ozetler uretilmeli.
3. Contacts, pipeline, analytics ve team ekranlarinda "summary-first" veri akisi kurulmalı.
4. "Gunluk odak", "bugunku takip", "asama dagilimi", "ekip ritmi" gibi metrikler sorgu seviyesinde hesaplanmali.

Yeni hedef yapi:

- `nmm_dashboard_summary`
- `nmm_team_summary`
- `nmm_pipeline_summary`
- Gerekirse `nmm_daily_snapshots`

Basari kriteri:

- Dashboard ilk acilista daha az veri ceker.
- Mobilde ve zayif agda ekranlar daha hizli hissedilir.
- Analytics ve Team sayfalari buyuk datasetlerde bozulmaz.

---

### Faz 5.3 - Gercek Workspace ve Team Mimarisi

Bu fazin amaci:
Projeyi tek kullanicili CRM gorunumunden cikarip gercek ekip sistemine donusturmek.

Bugun eksik olan ana konu budur.

Olmasi gereken cekirdek yapilar:

1. `workspaces`
2. `workspace_members`
3. `workspace_roles`
4. `member_relationships` veya `sponsor_tree`
5. `shared_templates`
6. `shared_objections`
7. `shared_academy_content`

Urun davranisi:

- Bir lider kendi workspace'ini kurar.
- Ekip uyeleri o workspace'e dahil olur.
- Her uye kendi datasi uzerinde calisir.
- Lider, izin verilen alanlarda ritim, destek ihtiyaci, aktivasyon ve gelisim gorur.
- Ortak kaynaklar ekip icinde paylasilabilir.

Basari kriteri:

- Team modulu artik kontak simulasyonu degil, gercek uye yapisini kullanir.
- Rol bazli erisim netlesir.
- Ekip buyudukce lider paneli anlamsizlasmak yerine guclenir.

---

### Faz 5.4 - Product + Opportunity Cift Motoru

Bu fazin amaci:
Network marketingin iki ana gercegini ayni sistemde yonetmek:

1. urun hareketi
2. is firsati hareketi

Bugun sistem daha cok aday ve surec merkezli.
Bir sonraki buyuk sifta ihtiyac:
Kisiyi tek rolde degil, yasam dongusu olarak gormek.

Olmasi gereken durumlar:

- Prospect
- Product Customer
- Repeat Customer
- Business Prospect
- New Distributor
- Active Distributor
- At-Risk Distributor

Gelistirilecek moduller:

1. Musteri tekrar siparis takibi
2. Urun deneme -> memnuniyet -> tavsiye akisi
3. Is sunumu -> karar -> onboarding akisi
4. Yeni uye 30-60-90 gun aktivasyon sistemi

Basari kriteri:

- Ayni kisi hem urun hem is firsati ekseninde takip edilebilir.
- "Urun musterisi" ile "ekip uyesi" ayni veri modelinde daha dogru yasatilir.
- Gelir ve ekip buyumesi ayni panelde anlamli hale gelir.

---

### Faz 5.5 - AI Coach ve Next Best Action Sistemi

Bu fazin amaci:
AI'yi sadece mesaj yazan degil, aksiyon oneren sistem haline getirmek.

Gelmesi gereken kabiliyetler:

1. Bugun en kritik 3 kisi onerisi
2. Her kisi icin neden o kisi oldugunun aciklamasi
3. Hangi tonda yazilmasi gerektigi
4. Hangi itiraz kategorisine hazir olunmasi gerektigi
5. Hangi akademi iceriginin acilmasi gerektigi
6. Hangi lider destegine ihtiyac oldugu

Bu sistemin cekirdegi:

- daily focus
- message playbooks
- objection matching
- academy matching
- team radar

bunlarin ayni karar motorunda birlestirilmesidir.

Basari kriteri:

- Kullanici "ne yapacagim?" diye dusunmeden ekrana girip aksiyon alir.
- AI deneyimi gosteri degil, saha faydasi uretir.

---

### Faz 5.6 - Trust, Compliance ve Global-Local Katmani

Bu fazin amaci:
Urunu sadece etkili degil, guvenli ve ulkeler arasi tasinabilir hale getirmek.

Eklenmesi gerekenler:

1. Compliance kutuphanesi
2. Onayli claim ve yasakli ifade sistemi
3. Ulke bazli dil ve pazar paketleri
4. Para birimi, tarih, saat, telefon formatlari
5. Yerel bayram, kampanya, sezon akisleri
6. "Bu mesaj bu pazarda riskli olabilir" uyarilari

Country pack mantigi:

- `TR pack`
- `EN global pack`
- sonra diger pazarlar

Basari kriteri:

- Urun yerelde dogal hisseder.
- Global pazarda ise tekrar yazilmadan genisler.

---

### Faz 5.7 - Premium UX ve Urun Sunumu

Bu fazin amaci:
Sadece guclu calisan degil, kullanicida "bu profesyonel bir arac" hissi uyandiran sistem kurmak.

Premium standardimiz:

1. Ilk ekran tek bakista netlik vermeli.
2. Her sayfada birincil aksiyon belli olmali.
3. Kartlar sadece bilgi gostermemeli, yon vermeli.
4. Bos durumlar egitici olmali.
5. Mobil kullanim ikinci sinif olmamali.
6. Tasarim dili her modulde ayni kaliteyi korumali.

Yapilacaklar:

1. Dashboard'u komuta merkezine donustur
2. KPI yerine eylem odakli kartlar artir
3. Form ve modal deneyimini standartlastir
4. Bos durumlari "ne yapmaliyim" anlatan hale getir
5. Premium microcopy standardi olustur

Basari kriteri:

- Urun sade hisseder.
- Ama basit degil, guclu hisseder.

---

### Faz 5.8 - Test, Gozlemleme ve Release Disiplini

Bu fazin amaci:
Urunu "sadece gelistirilen" degil, "guvenle buyutulen" sisteme cevirmek.

Eksik alanlar:

1. Unit test yok denecek kadar az
2. E2E smoke yok
3. Hata izleme yok
4. Product analytics yok
5. Release checklist manuel ama teknik guvencesi zayif

Kurulmasi gerekenler:

1. Vitest veya benzeri unit test altyapisi
2. Playwright ile ana smoke senaryolari
3. Hata izleme
4. Event bazli urun analitigi
5. PR checklist ve release checklist

Minimum test kapsamimiz:

- auth
- yeni kontak
- kontak detay
- takip olusturma
- AI mesaj modal acilisi
- pipeline gecisi
- dil degisimi

Basari kriteri:

- Yeni gelistirme korkutmamali.
- Regresyonlar daha kod merge olmadan yakalanmali.

---

## Uygulama Sirasi

Bu projenin uygulanabilir sirasi asagidaki gibi olmali:

1. Faz 5.1 - Stabilizasyon
2. Faz 5.2 - Ozet ve performans katmani
3. Faz 5.3 - Workspace ve team mimarisi
4. Faz 5.4 - Product + opportunity motoru
5. Faz 5.5 - AI coach karar motoru
6. Faz 5.6 - Compliance ve country pack
7. Faz 5.7 - Premium UX toparlama
8. Faz 5.8 - Test ve release guvencesi

Bu siradaki mantik:

- Once duzgun calisan sistem
- sonra hizli ve olceklenebilir sistem
- sonra gercek ekip yapisi
- sonra daha buyuk urun zekasi
- sonra trust ve premium finishing

---

## Ilk 3 Sprint

Asagidaki 3 sprint en kritik bolum.

### Sprint 1

Hedef:
Teknik zemini saglamlastirmak.

Yapilacaklar:

1. `lint` temizlenecek.
2. Tag filter + pagination mantigi duzeltilecek.
3. Team ve Analytics sayfalarindaki impure render mantigi temizlenecek.
4. AuthProvider, modal effectleri ve stale query davranislari temizlenecek.
5. `StageBadge` gibi componentler presentational hale getirilecek.

Sprint sonunda:

- Kodu daha rahat degistirebilir hale geliriz.
- Regresyon riski azalir.

### Sprint 2

Hedef:
Dashboard ve analytics'i summary-first mimariye tasimak.

Yapilacaklar:

1. Ozet metrikler icin RPC veya SQL view tasarla.
2. Dashboard kartlarini bu ozetlerden besle.
3. Team radar ve analytics summary'i buyuk veri cekmeden hesapla.
4. Contacts insight kutularini summary endpoint'e tasi.

Sprint sonunda:

- Uygulama daha premium hisseder.
- Veriler daha hizli gelir.

### Sprint 3

Hedef:
Gercek workspace temellerini atmak.

Yapilacaklar:

1. `workspaces` ve `workspace_members` tablolari.
2. Rol yapisi.
3. Team sayfasini kontak yerine uye bazli calistirma.
4. Paylasilan icerik mantiginin temelini atma.

Sprint sonunda:

- Bu proje artik buyuk urune evrilmeye baslar.

---

## "Bitti" Dememiz Icin Kriterler

Bir faz tamamlandi diyebilmemiz icin:

1. Teknik kabul kriteri yazilmali.
2. UI kabul kriteri yazilmali.
3. Veri davranisi dogrulanmali.
4. Cift dil kontrolu yapilmali.
5. Smoke test gecerli olmali.

Sadece ekranin acilmasi "tamamlandi" sayilmaz.

---

## Calisma Prensibimiz

Bu projeyi buyuturken su kurallari koruyacagiz:

1. Eskiyi yikmadan uzerine koyacagiz.
2. Komple rewrite yerine kontrollu farklarla ilerleyecegiz.
3. Once istikrar, sonra hiz, sonra buyuk feature.
4. Her modulu "bugun kullanilir mi?" gozunden test edecegiz.
5. Premiumluk gosteriyle degil, netlik ve guven duygusuyla gelecek.

---

## Hemen Simdi Ne Yapmaliyiz?

Bir sonraki icra adimi nettir:

### Simdi baslayacagimiz is paketi

`Premium Stabilization Sprint`

Icinde su 5 is olmali:

1. Lint hatalarini temizle
2. Tag filtreleme ve pagination bug'ini duzelt
3. Team ve Analytics sayfalarini purity-safe hale getir
4. Auth ve modal effectlerini React 19 uyumlu temizle
5. Summary-first performans gecisine hazir teknik zemin kur

Bu paketi bitirmeden buyuk feature acmiyoruz.

---

## Motivasyon Notu

Bu proje dogru elde buyuk urun olur.
Temel fikir kuvvetli.
Saha problemi gercek.
Urun dili siradan degil.

Bizim avantajimiz su:

- Ne yapmak istedigimizi biliyoruz
- Sorunlarin nerede oldugunu artik goruyoruz
- Bundan sonra rastgele degil, sira ile ilerleyecegiz

Bu noktadan sonra hedef:

`daha cok ozellik eklemek` degil,
`dogru sirayla guclenen bir sistem kurmak`.

Bu belge o sirayi sabitler.
