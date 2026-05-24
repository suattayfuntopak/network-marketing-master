# Hot Log

## 2026-05-24

### ux: silme onay modalı sadeleştirildi

- `ConfirmDeleteModal`'dan gereksiz açıklama paragrafı (`{name} silindikten sonra 5 saniye içinde geri alabilirsiniz.`) kaldırıldı
- `name` prop'u artık kullanılmadığından interface'den ve tüm çağıran bileşenlerden (`EditCandidateSheet`, `CandidateDetail`, `EkipPanel`, `CandidateCard`) temizlendi
- Modal artık yalnızca uyarı ikonu, "Silmek istediğinizden emin misiniz?" başlığı ve iki buton içeriyor

### ux: kişi ekle paneli ortalanmış popup'a dönüştürüldü

- `AddCandidateSheet` mobilizde alta yapışan / masaüstünde sağ üste konumlanan alt sheet tasarımından arındırıldı
- `EditCandidateSheet` ile tutarlı şekilde tam ortada açılan centered modal olarak yeniden tasarlandı
- z-index hiyerarşisi `EditCandidateSheet` ile eşleştirildi (backdrop `z-[60]`, panel `z-[70]`)

---

### refactor: z-index merkezi sabitlerle yönetiliyor

- `src/lib/zIndex.ts` oluşturuldu — `sheetBackdrop(60)`, `sheet(70)`, `confirmBackdrop(80)`, `confirm(90)` sabitleri
- 9 bileşen güncellendi: `AddCandidateSheet`, `EditCandidateSheet`, `CandidateCard`, `CandidateDetail`, `ConfirmDeleteModal`, `ProfileModal`, `NotificationsModal`, `SettingsModal`, `EkipPanel`
- Tüm hardcoded `z-[xx]` sınıfları sabitlerle değiştirildi; çakışma riski ortadan kalktı

### feat: ConfirmDeleteModal bağlam mesajı desteği

- `message?: string` opsiyonel prop eklendi
- Mesaj verildiğinde başlığın altında bağlama özel küçük metin gösteriyor
- `EkipPanel`'de `"[üye adı] ekibinizden çıkarılacak."` mesajıyla kullanıma alındı

### feat: kişi ekle telefon formatı doğrulaması

- `AddCandidateSheet`'e `PHONE_RE = /^(\+90|0)5\d{9}$/` regex doğrulaması eklendi
- Hatalı format girişinde alan kırmızıya döner, açıklayıcı hata mesajı inline gösterilir
- Kullanıcı düzeltmeye başladığında hata otomatik temizlenir

### not: deleteWithUndo toast zaten mevcut

- 4. öneri `lib/deleteWithUndo.tsx`'te halihazırda uygulanmış durumdaydı
- Circular SVG countdown animasyonu + "Geri Al" butonu + 5 saniyelik timer zaten aktif
