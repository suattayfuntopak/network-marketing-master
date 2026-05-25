@AGENTS.md

## Proje Kuralları & Sloganımız
**Sloganımız:** Alanında öncü, basit, kullanıcı dostu, işlevsel ve aynı zamanda son derece profesyonel ve premium bir uygulama.

### 1. Genel Kurallar & Prensipler
- **Kullanıcı Dostu & Premium Kalite:** Eklenen her yeni özellik ve öneri, uygulamayı karmaşıklaştırmadan, basit, son derece sade ve premium kullanıcı deneyimi sunacak şekilde tasarlanmalıdır. Arayüzü gereksiz öğelerle doldurmaktan kaçının.

### 2. Dil ve Yerelleştirme Politikası
- **Kalıcı Çeviri ve Saklama Kuralı:** Uygulamada üretilen her türlü dinamik içerik (Aday Notları, Lider Notları vb. — özel isimler hariç) veritabanına kaydedilmeden önce mutlaka kalıcı İngilizce çevirileri de üretilmeli ve `Türkçe ||| İngilizce` formatında veritabanında kalıcı olarak saklanmalıdır. İstemci dili İngilizce seçildiğinde, lazy-load veya on-the-fly gecikmeli çeviriler yerine doğrudan veritabanındaki kalıcı İngilizce çeviriler gösterilmelidir.

### 3. Teknik Mimari Kuralları
- **z-index katmanları** `src/lib/zIndex.ts`'ten yönetilir — yeni overlay/modal eklerken bu dosyayı güncelle.
- **Modal onClose** `deleteWithUndo`'ya parametre olarak geçirilmez; çağıran bileşen `onClose()`'u kendisi hemen çağırır.
