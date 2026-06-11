export const pagesSection = {
  tr: {
    pagesUi: {
      // search/page.tsx
      objectionsAndAnswers: "İtirazlar ve Cevaplar",
      readAnswer: "Cevabı oku ➔",

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
      followUpCompleted: "Takip tamamlandı",
      bulkDeferOneDay: "Hepsini yarına ertele",
      bulkDeferTitle: "Gecikmiş takipleri ertele",
      bulkDeferMessage: "{count} adayın takibi {date} tarihine ertelenecek. Devam edilsin mi?",
      bulkDeferConfirm: "Evet, ertele",
      bulkDeferSuccess: "{count} takip ertelendi",
      bulkDeferNone: "Takip ertelenemedi — sayfayı yenileyip tekrar deneyin",
      teamCalendarTitle: "Ekip Takvimi",
      teamCalendarSubtitle: "Alt ekip liderlerinin planlı takip yoğunluğu (salt okunur)",
      teamCalendarEmpty: "Bu ay planlı takip yok",

      // saha-provasi/page.tsx
      fieldRehearsalTitle: "Saha Provası",
      fieldRehearsalSubtitle: "İtiraz karşılama, davet ve kapanış senaryolarını dinamik olarak deneyimle",

      // bugun/ilgilen/page.tsx
      todayPrioritiesTitle: "Bugün İlgilen",
      todayPrioritiesSubtitle: "Bugün sen ve ekibin ne durumdasınız, neler yapmalısınız; hızlıca göz at, aksiyona geç!",
      ilgilenHubSubtitle: "Yol haritanız, günlük huni ve özet sekmeleri — pano ile aynı organizasyon.",

      // bugun/ilgilen/_components/IlgilenContent.tsx
      neverContacted: "Hiç aranmadı",
      oneDayAgo: "1 gün önce",
      daysAgo: "{days} gün önce",
      couldNotGenerateMessage: "Mesaj oluşturulamadı.",
      noPendingFollowUps: "Bugün için bekleyen eylem yok",
      greatJob: "Harika iş çıkardın!",
      prioritiesLabel: "kişi öncelikli",
      moreWaiting: "daha bekliyor",
      generateAiMessage: "AI Mesaj Üret",
      generateAndCopyAiMessage: "AI Mesaj Üret ve Kopyala",
      unlockAiBasic: "Basic planla AI'ı aç",
      call: "Ara",
      aiMessage: "Yapay Zeka Mesajı",
      generatedFor: "{name} için üretildi",
      messageCopied: "Mesaj kopyalandı!",
      copy: "Kopyala",
      sendViaWhatsApp: "WhatsApp ile Gönder",

      // ekip/_components/BroadcastPanel.tsx
      broadcastDocHeader: "📄 *Doküman / Link*",
      contentType: "İçerik Türü",
      recipients: "Alıcılar",
      selectRecipients: "Kişileri seçin",
      noOtherMembers: "Henüz başka ekip üyeniz yok.",
    },
  },
  en: {
    pagesUi: {
      // search/page.tsx
      objectionsAndAnswers: "Objections & Answers",
      readAnswer: "Read Answer ➔",

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
      followUpCompleted: "Follow-up completed",
      bulkDeferOneDay: "Defer all to tomorrow",
      bulkDeferTitle: "Defer overdue follow-ups",
      bulkDeferMessage: "{count} follow-ups will move to {date}. Continue?",
      bulkDeferConfirm: "Yes, defer",
      bulkDeferSuccess: "{count} follow-ups deferred",
      bulkDeferNone: "Could not defer — refresh and try again",
      teamCalendarTitle: "Team Calendar",
      teamCalendarSubtitle: "Downline leaders' scheduled follow-up load (read-only)",
      teamCalendarEmpty: "No scheduled follow-ups this month",

      // saha-provasi/page.tsx
      fieldRehearsalTitle: "Field Rehearsal",
      fieldRehearsalSubtitle: "Practice objection handling, invitations, and closing scenarios dynamically",

      // bugun/ilgilen/page.tsx
      todayPrioritiesTitle: "Today's Priorities",
      todayPrioritiesSubtitle: "See where you and your team stand today and what to do — glance quickly and take action!",
      ilgilenHubSubtitle: "Your roadmap, daily funnel, and summary tabs — aligned with the home hub.",

      // bugun/ilgilen/_components/IlgilenContent.tsx
      neverContacted: "Never contacted",
      oneDayAgo: "1 day ago",
      daysAgo: "{days} days ago",
      couldNotGenerateMessage: "Could not generate message.",
      noPendingFollowUps: "No pending follow-ups today",
      greatJob: "Great job!",
      prioritiesLabel: "priorities",
      moreWaiting: "more waiting",
      generateAiMessage: "Generate AI Message",
      generateAndCopyAiMessage: "Generate and Copy AI Message",
      unlockAiBasic: "Unlock AI with Basic plan",
      call: "Call",
      aiMessage: "AI Message",
      generatedFor: "Generated for {name}",
      messageCopied: "Message copied!",
      copy: "Copy",
      sendViaWhatsApp: "Send via WhatsApp",

      // ekip/_components/BroadcastPanel.tsx
      broadcastDocHeader: "📄 *Document / Link*",
      contentType: "Content Type",
      recipients: "Recipients",
      selectRecipients: "Select recipients",
      noOtherMembers: "No other team members yet.",
    },
  },
} as const
