export const errorsSection = {
  tr: {
    errors: {
      sessionRequired: 'Oturum gerekli.',
      geminiMissing:
        'GEMINI_API_KEY eksik! Lütfen .env.local dosyanıza GEMINI_API_KEY=your_key ekleyin ve sunucuyu yeniden başlatın.',
      simulationFailed: 'Simülasyon yanıtı oluşturulamadı: {detail}',
      auditInputRequired: 'Lütfen denetlenecek bir metin girin.',
      auditFailed: 'Metin denetlenirken hata oluştu: {detail}',
      paymentMaintenance: 'Ödeme sistemi şu anda bakımda, lütfen birkaç dakika sonra tekrar deneyin.',
      paymentSession: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
      paymentWorkspace: 'Çalışma alanı bulunamadı. Lütfen ekibe katılın veya yeni bir alan oluşturun.',
      checkoutFailed: 'Ödeme başlatılamadı: {detail}',
    },
  },
  en: {
    errors: {
      sessionRequired: 'Session required.',
      geminiMissing:
        'GEMINI_API_KEY is missing. Add GEMINI_API_KEY=your_key to .env.local and restart the server.',
      simulationFailed: 'Simulation failed: {detail}',
      auditInputRequired: 'Please enter text to audit.',
      auditFailed: 'Audit failed: {detail}',
      paymentMaintenance: 'Payment is under maintenance. Please try again in a few minutes.',
      paymentSession: 'Session not found. Please sign in again.',
      paymentWorkspace: 'Workspace not found. Join a team or create a workspace.',
      checkoutFailed: 'Could not start checkout: {detail}',
    },
  },
} as const
