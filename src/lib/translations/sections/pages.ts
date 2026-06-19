export const pagesSection = {
  tr: {
    pagesUi: {
      // search/page.tsx
      objectionsAndAnswers: "İtirazlar ve Cevaplar",

      // takvim/page.tsx
      calendarTitle: "Takvim",
      calendarSubtitle: "Planlı takip günleri",

      // takvim/_components/TakvimClient.tsx
      today: "Bugün",
      followUpList: "Takip Listesi",
      followUpsMissed: "{count} takip kaçırıldı — hemen ilgilen",
      noFollowUpsThisDay: "Bu gün için takip yok",
      checkAnotherDay: "Başka bir güne bak",
      next7Days: "Seçili günden sonraki 7 gün",
      prospectSingular: "aday",
      prospectPlural: "aday",
      nextMonth: "Önümüzdeki Ay",
      backToToday: "Bugüne dön",
      overdueFollowUps: "{count} gecikmiş takip",
      viewTodayPriorities: "Bugün İlgilen →",
      nearestFollowUp: "En yakın takip: {date} ({count} aday)",
      monthSummary: "Bu ay: {total} takip, {overdue} gecikmiş",
      followUpUpdated: "Takip tarihi güncellendi",
      viewInPipeline: "Listede gör",
      viewDailySummary: "Saha Özetim'e git",
      viewApprovedContent: "İçeriği gör",
      followUpCompleted: "Takip tamamlandı",
      bulkDeferOneDay: "Hepsini yarına ertele",
      bulkDeferTitle: "Gecikmiş takipleri ertele",
      bulkDeferMessage: "{count} adayın takibi {date} tarihine ertelenecek. Devam edilsin mi?",
      bulkDeferConfirm: "Evet, ertele",
      bulkDeferSuccess: "{count} takip ertelendi",
      bulkDeferNone: "Takip ertelenemedi — sayfayı yenileyip tekrar deneyin",

      // saha-provasi/page.tsx

      // bugun/ilgilen/page.tsx

      // bugun/ilgilen/_components/IlgilenContent.tsx
      unlockAiBasic: "Basic planla AI'ı aç",

      // ekip/_components/BroadcastPanel.tsx
      broadcastDocHeader: "📄 *Doküman / Link*",
      recipients: "Alıcılar",
      selectRecipients: "Kişileri seçin",
      noOtherMembers: "Henüz başka ekip üyeniz yok.",
    },
  },
  en: {
    pagesUi: {
      // search/page.tsx
      objectionsAndAnswers: "Objections & Answers",

      // takvim/page.tsx
      calendarTitle: "Calendar",
      calendarSubtitle: "Scheduled follow-up days",

      // takvim/_components/TakvimClient.tsx
      today: "Today",
      followUpList: "Follow-up List",
      followUpsMissed: "{count} follow-ups missed — act now",
      noFollowUpsThisDay: "No follow-ups for this day",
      checkAnotherDay: "Check another day",
      next7Days: "7 days after selected date",
      prospectSingular: "prospect",
      prospectPlural: "prospects",
      nextMonth: "Next Month",
      backToToday: "Back to today",
      overdueFollowUps: "{count} overdue follow-ups",
      viewTodayPriorities: "Today's Priorities →",
      nearestFollowUp: "Nearest follow-up: {date} ({count} prospects)",
      monthSummary: "This month: {total} follow-ups, {overdue} overdue",
      followUpUpdated: "Follow-up date updated",
      viewInPipeline: "View in Pipeline",
      viewDailySummary: "View Field Summary",
      viewApprovedContent: "View content",
      followUpCompleted: "Follow-up completed",
      bulkDeferOneDay: "Defer all to tomorrow",
      bulkDeferTitle: "Defer overdue follow-ups",
      bulkDeferMessage: "{count} follow-ups will move to {date}. Continue?",
      bulkDeferConfirm: "Yes, defer",
      bulkDeferSuccess: "{count} follow-ups deferred",
      bulkDeferNone: "Could not defer — refresh and try again",

      // saha-provasi/page.tsx

      // bugun/ilgilen/page.tsx

      // bugun/ilgilen/_components/IlgilenContent.tsx
      unlockAiBasic: "Unlock AI with Basic plan",

      // ekip/_components/BroadcastPanel.tsx
      broadcastDocHeader: "📄 *Document / Link*",
      recipients: "Recipients",
      selectRecipients: "Select recipients",
      noOtherMembers: "No other team members yet.",
    },
  },
} as const
