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
      weekView: "Hafta görünümü",
      nearestFollowUp: "En yakın takip: {date} ({count} aday)",

      // saha-provasi/page.tsx
      fieldRehearsalTitle: "Saha Provası",
      fieldRehearsalSubtitle: "İtiraz karşılama, davet ve kapanış senaryolarını dinamik olarak deneyimle",

      // bugun/ilgilen/page.tsx
      todayPrioritiesTitle: "Bugün İlgilen",
      todayPrioritiesSubtitle: "Takip edilmesi gereken adaylar",

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
      weekView: "Week view",
      nearestFollowUp: "Nearest follow-up: {date} ({count} prospects)",

      // saha-provasi/page.tsx
      fieldRehearsalTitle: "Field Rehearsal",
      fieldRehearsalSubtitle: "Practice objection handling, invitations, and closing scenarios dynamically",

      // bugun/ilgilen/page.tsx
      todayPrioritiesTitle: "Today's Priorities",
      todayPrioritiesSubtitle: "Prospects to follow up today",

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
