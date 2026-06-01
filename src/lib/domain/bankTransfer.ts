/**
 * Havale/EFT alternatif ödeme seçeneği.
 *
 * KALDIRMAK İÇİN: `BANK_TRANSFER_ENABLED` değerini `false` yap — ödeme sayfasındaki
 * havale kartı tamamen kaybolur, başka hiçbir yere dokunmaya gerek yok. Shopier
 * kartlı ödeme bundan bağımsız çalışmaya devam eder.
 */
export const BANK_TRANSFER_ENABLED = false

export const BANK_TRANSFER_INFO = {
  /**
   * Görüntülenecek IBAN (boşluklu). Kopyalarken boşluklar otomatik temizlenir.
   *
   * IBAN DEĞİŞİRSE: `public/iban-qr.svg` statik QR'ını yeniden üret (masaüstü kartında
   * gösteriliyor). Boşluksuz IBAN ile:
   *   npx --yes qrcode -t svg -m 2 -o public/iban-qr.svg "TR760013400000240091500003"
   */
  iban: 'TR76 0013 4000 0024 0091 5000 03',
  holder: 'Suat Tayfun TOPAK',
  bank: 'Denizbank',
  email: 'info@suattayfuntopak.com',
  /** Uluslararası format, wa.me için (0534… → 90534…). */
  whatsapp: '905346293885',
  whatsappDisplay: '0534 629 38 85',
} as const
