@AGENTS.md

## Proje Kuralları

- **z-index katmanları** `src/lib/zIndex.ts`'ten yönetilir — yeni overlay/modal eklerken bu dosyayı güncelle.
- **Modal onClose** `deleteWithUndo`'ya parametre olarak geçirilmez; çağıran bileşen `onClose()`'u kendisi hemen çağırır.
