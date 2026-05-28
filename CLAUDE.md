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

### 4. Süper Admin = Gerçek Kullanıcı + Uygulama Sahibi
`SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'` olan kullanıcı (Suat Tayfun TOPAK) aynı anda **iki rol** üstlenir:
- **Uygulama sahibi / platform yöneticisi:** Platform Yönetimi sayfasına erişebilir, tüm kullanıcıların lisanslarını yönetebilir, sınırsız AI kullanımı vardır.
- **Gerçek bir kullanıcı ve lider:** "Focus Team" adıyla kendi ekibini yönetir, kendi adayları var, sponsor olduğu kişiler var, bu uygulamayı başka kullanıcılar gibi aktif olarak kullanır.

**Bu dualizmden kaynaklanan mimari kurallar:**
1. **Limit kontrolü (`if (!isSuperAdmin)`):** Günlük AI kotası bypass edilir — sınırsız kullanım. Bu değişmez.
2. **Aksiyon kaydı (`nmm_daily_actions`):** Super admin'in AI aksiyonları artık kaydedilir (`if (membership)` koşulu, `!isSuperAdmin` guard'ı olmadan). Gerçek kullanıcı olarak hareket ettiğinde bu kayıt olmalıdır.
3. **Ownership check:** Super admin admin amaçlı herhangi bir adaya erişebilir — bu bypass korunur.
4. **Workspace & team:** Super admin'in kendi workspace'i, adayları ve ekip üyeleri tam anlamıyla gerçektir; diğer liderlerle aynı şekilde Supabase'de saklanır. Hiçbir zaman "sahte/test verisi" olarak değerlendirilmez.
5. **Yeni özellik eklerken:** Super admin için ayrı bir "test/bypass" koşulu ekleme. Onun için çalışan şey, diğer kullanıcılar için de çalışmalıdır. Fark sadece sınırsız kotada ve Platform Yönetimi erişimindedir.
