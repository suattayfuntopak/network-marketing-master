/**
 * Sayfa yardımı içeriği — her sayfanın "nasıl kullanılır"ını EN SADE dille anlatır.
 * Header'daki (?) butonu açtığında, bulunulan rotaya göre bu içerik gösterilir.
 * Çeviri sözlüğünü şişirmemek için içerik burada (TR + EN) tutulur.
 */

export type PageHelpStep = { t: string; d: string }
export type PageHelpContent = { title: string; intro: string; steps: PageHelpStep[] }

type Lang = 'tr' | 'en'

// Rota öneki → içerik. En uzun eşleşen önek seçilir.
const HELP: { match: string; tr: PageHelpContent; en: PageHelpContent }[] = [
  {
    match: '/pano',
    tr: {
      title: 'Pano',
      intro: 'Burası ana ekranın. Günün özetini ve hızlı kısayolları burada görürsün.',
      steps: [
        { t: 'Kısayollar', d: 'Karelere dokunarak Listem, Hedefim, Ekibim gibi sayfalara tek tıkla geçebilirsin.' },
        { t: 'Hızlı aday ekle', d: 'Üstteki ⚡ (kıvılcım) butonuyla yeni bir kişiyi saniyeler içinde listene ekleyebilirsin.' },
        { t: 'Arama', d: 'Üstteki arama kutusuna isim yazarak herhangi bir kişiyi/aday hızlıca bulabilirsin.' },
      ],
    },
    en: {
      title: 'Dashboard',
      intro: 'This is your home screen. See today’s summary and quick shortcuts here.',
      steps: [
        { t: 'Shortcuts', d: 'Tap the tiles to jump to My List, My Goal, My Team in one click.' },
        { t: 'Quick add', d: 'Use the ⚡ button at the top to add a new person to your list in seconds.' },
        { t: 'Search', d: 'Type a name in the top search box to quickly find any person/prospect.' },
      ],
    },
  },
  {
    match: '/hedefim',
    tr: {
      title: 'Hedefim',
      intro: 'Burada hedefini belirler ve bugün ne yapman gerektiğini görürsün.',
      steps: [
        { t: 'Hedefini gir', d: 'Kaç kişilik bir ekip istediğini ve kaç ayda ulaşmak istediğini yaz, sistem sana yol haritası çıkarsın.' },
        { t: 'Bu ay özeti', d: 'Hedef cümlesinin altındaki satır, içinde bulunduğun yol haritası ayının aylık hedefini (arama, tanışma, sunum, yeni üye) gösterir.' },
        { t: 'Bugünkü odağım', d: 'Renkli 4 kutu bugünkü tempo hedefini gösterir — aylık hedefin 26 iş gününe bölünmüş halidir; Saha Özetim Günlük sekmesiyle aynı mantıktır.' },
        { t: 'Ay ay plan', d: 'Aşağıdaki listede her ay için hedeflerini görebilirsin; bir satıra dokunarak o ayın Saha Özetim özetine gidebilirsin.' },
      ],
    },
    en: {
      title: 'My Goal',
      intro: 'Set your goal here and see what to do today.',
      steps: [
        { t: 'Enter your goal', d: 'Write how big a team you want and in how many months; the system builds a roadmap for you.' },
        { t: 'This month', d: 'The line under your goal statement shows this roadmap month’s targets (calls, contacts, presentations, new members).' },
        { t: 'Today’s focus', d: 'The 4 colored boxes are today’s pace — monthly targets spread over 26 working days; same logic as Field Summary → Daily.' },
        { t: 'Month-by-month', d: 'See each month’s targets below; tap a row to open that month in Field Summary.' },
      ],
    },
  },
  {
    match: '/saha-ozetim',
    tr: {
      title: 'Saha Özetim',
      intro: 'Kendi sahadaki performansını günlük/haftalık/aylık görürsün.',
      steps: [
        { t: 'Dönem seç', d: 'Üstteki Günlük / Haftalık / Aylık / Yıllık / Tüm Zamanlar sekmeleriyle istediğin dönemi seç. Buradaki Aylık, takvim ayının yol haritası hedefidir — İstatistikler’deki “Son 30 Gün” kayan pencereden farklıdır.' },
        { t: '4 renkli kutu', d: 'Gerçekleşenler boru hattından otomatik sayılır; hedef çizgisi Hedefim yol haritasıyla aynıdır (günlük = tempo, aylık = o takvim ayının satırı).' },
        { t: 'Saha aktivitesi', d: 'Aşağıda WhatsApp, not, arama gibi aksiyon sayılarını görebilirsin.' },
      ],
    },
    en: {
      title: 'My Field Summary',
      intro: 'See your own field performance daily/weekly/monthly.',
      steps: [
        { t: 'Pick a period', d: 'Use the Daily / Weekly / Monthly / Yearly / All-time tabs at the top. Monthly here is the calendar month’s roadmap row — not the rolling “Last 30 days” window on Statistics.' },
        { t: '4 colored boxes', d: 'Actuals come from your pipeline automatically; targets match My Goal’s roadmap (daily = pace, monthly = that calendar month’s row).' },
        { t: 'Field activity', d: 'Below, see action counts like WhatsApp, notes, calls.' },
      ],
    },
  },
  {
    match: '/saha-radar',
    tr: {
      title: 'Saha Radarım',
      intro: 'Bugün ve bu hafta kimleri takip etmen gerektiğini gösterir.',
      steps: [
        { t: 'Takipler', d: 'Zamanı gelmiş ve yaklaşan takiplerini burada görürsün. Sadece kendi listendeki kişiler görünür.' },
        { t: 'Hızlı aksiyon', d: 'Kart üzerindeki WhatsApp/ara butonlarıyla kişiyle anında iletişime geçebilirsin.' },
        { t: 'Aktivite sekmesi', d: 'Ekip üyelerinin aktif mi yoksa sessiz mi olduğunu buradan takip edebilirsin.' },
      ],
    },
    en: {
      title: 'My Field Radar',
      intro: 'Shows who you should follow up today and this week.',
      steps: [
        { t: 'Follow-ups', d: 'See overdue and upcoming follow-ups here. Only people in your own list appear.' },
        { t: 'Quick action', d: 'Use the WhatsApp/call buttons on a card to reach the person instantly.' },
        { t: 'Activity tab', d: 'Track whether your team members are active or quiet.' },
      ],
    },
  },
  {
    match: '/pipeline',
    tr: {
      title: 'Listem',
      intro: 'Tüm adaylarını (kişilerini) burada yönetirsin.',
      steps: [
        { t: 'Aşamalar', d: 'Her kişi bir aşamada durur (Yeni, İletişim, Sunum, Takip, Katıldı...). Kişiyi ilerledikçe bir sonraki aşamaya taşı.' },
        { t: 'Detay', d: 'Bir kişiye dokununca detay sayfası açılır; not ekleyebilir, takip tarihi koyabilir, WhatsApp atabilirsin.' },
        { t: 'Yeni kişi', d: 'Üstteki ekle butonuyla ya da panodaki ⚡ ile yeni aday ekleyebilirsin.' },
      ],
    },
    en: {
      title: 'My List',
      intro: 'Manage all your prospects (people) here.',
      steps: [
        { t: 'Stages', d: 'Each person sits in a stage (New, Contact, Presentation, Follow-up, Joined...). Move them forward as they progress.' },
        { t: 'Detail', d: 'Tap a person to open their detail page; add notes, set follow-up dates, send WhatsApp.' },
        { t: 'New person', d: 'Add a prospect with the add button or the ⚡ on the dashboard.' },
      ],
    },
  },
  {
    match: '/ekip',
    tr: {
      title: 'Ekibim',
      intro: 'Ekip üyelerini ve onların gelişimini buradan takip edersin.',
      steps: [
        { t: 'Ekip Üyeleri', d: 'Üyelerini listeler. Bir üyeye dokunarak aktivite, eğitim ve hedef bilgilerini görebilirsin.' },
        { t: 'Listeye Ekle / Ekipten Çıkar', d: 'Bir üye listende değilse "Listeye Ekle" görünür; "Ekipten Çıkar" ile üyeyi ekibinden çıkarabilirsin.' },
        { t: 'Saha Özeti / Eğitim İlerlemesi', d: 'Sekmelerle ekibinin saha performansını ve eğitim ilerlemesini görebilirsin.' },
      ],
    },
    en: {
      title: 'My Team',
      intro: 'Track your team members and their progress here.',
      steps: [
        { t: 'Team Members', d: 'Lists your members. Tap one to see activity, training, and goal info.' },
        { t: 'Add to List / Remove', d: 'If a member isn’t in your list, “Add to List” appears; “Remove from Team” unlinks the member.' },
        { t: 'Field / Training tabs', d: 'Use the tabs to see your team’s field performance and training progress.' },
      ],
    },
  },
  {
    match: '/egitim',
    tr: {
      title: 'Vaktin Varsa',
      intro: 'İçerik kütüphanesi, video eğitimler ve itiraz bankası tek yerde.',
      steps: [
        { t: 'Sekmeler', d: 'İçerik Kütüphanesi, Video Eğitimler ve İtiraz Bankası arasında üstteki sekmelerle geç.' },
        { t: 'Paylaş', d: 'Her içerik/video/itiraz üzerindeki WhatsApp ikonuyla bir kişiye hazır, kibar bir mesajla gönderebilirsin.' },
        { t: 'Favori & okundu', d: 'Yıldız ile favorile, yuvarlak işaretle okundu olarak işaretle.' },
      ],
    },
    en: {
      title: 'When You Have Time',
      intro: 'Content library, video training and objection bank in one place.',
      steps: [
        { t: 'Tabs', d: 'Switch between Content Library, Video Training and Objection Bank using the top tabs.' },
        { t: 'Share', d: 'Use the WhatsApp icon on any content/video/objection to send it to someone with a ready, kind message.' },
        { t: 'Favorite & read', d: 'Star to favorite, use the circle to mark as read.' },
      ],
    },
  },
  {
    match: '/canli-egitim',
    tr: {
      title: 'Canlı Eğitim',
      intro: 'Crown Team video serisi ve canlı eğitim içeriklerini buradan izlersin.',
      steps: [
        { t: 'Video serisi', d: 'Sıralı eğitim videolarını baştan sona izleyerek ilerleyebilirsin.' },
        { t: 'İzleme takibi', d: 'İzlediğin videolar otomatik işaretlenir; kaldığın yerden devam edebilirsin.' },
        { t: 'Ekiple paylaş', d: 'Faydalı bir bölümü ekip üyelerine önererek onların da izlemesini sağlayabilirsin.' },
      ],
    },
    en: {
      title: 'Live Training',
      intro: 'Watch the Crown Team video series and live training content here.',
      steps: [
        { t: 'Video series', d: 'Progress through the ordered training videos from start to finish.' },
        { t: 'Watch tracking', d: 'Videos you watch are marked automatically; resume where you left off.' },
        { t: 'Share with team', d: 'Recommend a useful section to your team members so they watch it too.' },
      ],
    },
  },
  {
    match: '/istatistikler',
    tr: {
      title: 'İstatistikler',
      intro: 'Adaylarının ve ekibinin sayısal performansını burada incelersin.',
      steps: [
        { t: 'Dönem seç', d: 'Üstten dönem seç; “Son 30 Gün” kayan 30 günlük penceredir. Saha Özetim’deki “Aylık” ise takvim ayının yol haritası hedefidir — ikisi farklıdır.' },
        { t: 'Saha hunisi', d: '4 renkli kutu kendi saha performansını gösterir; hedefler Hedefim yol haritasıyla aynı kaynaktan gelir.' },
        { t: 'Dönüşüm hunisi', d: 'Aşağıdaki grafik adaylarının aşama aşama nasıl ilerlediğini ve nerede takıldığını gösterir.' },
        { t: 'Ekip tablosu', d: 'Aşağıdaki tabloda ekip üyelerinin tek tek performansını görebilirsin.' },
      ],
    },
    en: {
      title: 'Statistics',
      intro: 'Review the numeric performance of your prospects and team.',
      steps: [
        { t: 'Pick a period', d: 'Choose a period at the top; “Last 30 days” is a rolling window. Field Summary’s “Monthly” tab is the calendar month’s roadmap — they differ.' },
        { t: 'Field funnel', d: 'The 4 colored boxes show your field performance; targets come from the same roadmap as My Goal.' },
        { t: 'Conversion funnel', d: 'The chart below shows how prospects progress stage by stage and where they get stuck.' },
        { t: 'Team table', d: 'See each team member’s performance in the table below.' },
      ],
    },
  },
  {
    match: '/takvim',
    tr: {
      title: 'Takvim',
      intro: 'Planlı takiplerini takvim üzerinde görürsün.',
      steps: [
        { t: 'Gün seç', d: 'Bir güne dokununca o gün yapılacak takipler açılır.' },
        { t: 'Ertele / tamamla', d: 'Bir takibi ileri bir tarihe erteleyebilir ya da tamamlandı olarak işaretleyebilirsin.' },
        { t: 'Listeye git', d: 'Bir kişiye dokunarak doğrudan o kişinin liste kaydına gidebilirsin.' },
      ],
    },
    en: {
      title: 'Calendar',
      intro: 'See your scheduled follow-ups on the calendar.',
      steps: [
        { t: 'Pick a day', d: 'Tap a day to open the follow-ups due that day.' },
        { t: 'Defer / complete', d: 'Defer a follow-up to a later date or mark it as done.' },
        { t: 'Go to list', d: 'Tap a person to jump straight to their list record.' },
      ],
    },
  },
  {
    match: '/yazar',
    tr: {
      title: 'Yapay Zeka Koçum',
      intro: 'Yapay zekâ ile mesaj, sunum provası ve uyum içeriği üretirsin.',
      steps: [
        { t: 'Amaç seç', d: 'Davet, takip, tebrik gibi bir amaç ve ton seç; yapay zekâ sana hazır metin çıkarsın.' },
        { t: 'Kişiselleştir', d: 'İstersen kişi adı ve ek bağlam ekleyerek mesajı daha doğal hale getir.' },
        { t: 'Kopyala / gönder', d: 'Üretilen metni kopyalayıp WhatsApp’tan kişiye gönderebilirsin.' },
      ],
    },
    en: {
      title: 'My AI Coach',
      intro: 'Generate messages, presentation practice and onboarding content with AI.',
      steps: [
        { t: 'Pick a goal', d: 'Choose a goal (invite, follow-up, congrats) and a tone; the AI drafts text for you.' },
        { t: 'Personalize', d: 'Add a name and extra context to make the message more natural.' },
        { t: 'Copy / send', d: 'Copy the result and send it via WhatsApp.' },
      ],
    },
  },
  {
    match: '/musteriler',
    tr: {
      title: 'Müşterilerim',
      intro: 'Ürün sattığın müşterileri ve siparişlerini burada takip edersin (adaylardan ayrı).',
      steps: [
        { t: 'Müşteri ekle', d: '“Müşteri Ekle” ile ad, telefon ve not girerek yeni bir müşteri oluştur.' },
        { t: 'Sipariş ekle', d: 'Bir müşterinin kartındaki “Sipariş Ekle” ile tutarı gir; toplam ciro ve son sipariş otomatik güncellenir.' },
        { t: 'Özet', d: 'Üstteki kutular toplam ciroyu, müşteri ve sipariş sayını gösterir.' },
      ],
    },
    en: {
      title: 'My Customers',
      intro: 'Track customers you sell products to and their orders here (separate from prospects).',
      steps: [
        { t: 'Add customer', d: 'Use “Add Customer” to create a new customer with name, phone and a note.' },
        { t: 'Add order', d: 'Use “Add Order” on a customer card to log an amount; revenue and last order update automatically.' },
        { t: 'Summary', d: 'The top boxes show total revenue, customer and order counts.' },
      ],
    },
  },
  {
    match: '/duyurular',
    tr: {
      title: 'Duyurular',
      intro: 'Ekibine tek mesajla ulaş; liderinin duyurularını da burada gör.',
      steps: [
        { t: 'Duyuru yaz', d: '“Duyuru Yaz” ile başlık + mesaj gir, yayınla — alt ekibin görür.' },
        { t: 'Liderinden gelenler', d: 'Üst hattının (liderinin) duyuruları da bu listede görünür.' },
        { t: 'Sil', d: 'Yalnızca kendi yazdığın duyuruları silebilirsin.' },
      ],
    },
    en: {
      title: 'Announcements',
      intro: 'Reach your team with one message; also see your leader’s announcements here.',
      steps: [
        { t: 'Write', d: 'Use “Write Announcement” to add a title + message and publish — your downline sees it.' },
        { t: 'From your leader', d: 'Your upline (leader) announcements also appear in this list.' },
        { t: 'Delete', d: 'You can only delete announcements you wrote.' },
      ],
    },
  },
  {
    match: '/platform-yonetim',
    tr: {
      title: 'Platform Yönetimi',
      intro: 'Tüm kullanıcıları, lisansları ve dış kayıtları yönetirsin.',
      steps: [
        { t: 'Dış Kayıtlar', d: 'Bağımsız kaydolmuş kişileri "Ekibime Bağla" ile kendi ekibine alabilirsin.' },
        { t: 'Lisans yönetimi', d: 'Kullanıcı listesinden lisans paketlerini ve sürelerini düzenleyebilirsin.' },
      ],
    },
    en: {
      title: 'Platform Management',
      intro: 'Manage all users, licenses and external signups.',
      steps: [
        { t: 'External signups', d: 'Use “Link to my team” to bring independent signups into your team.' },
        { t: 'License management', d: 'Edit license tiers and durations from the user list.' },
      ],
    },
  },
]

const GENERIC: Record<Lang, PageHelpContent> = {
  tr: {
    title: 'Yardım',
    intro: 'Bu sayfayı keşfetmekten çekinme — her şey basit ve geri alınabilir.',
    steps: [
      { t: 'Dokun ve keşfet', d: 'Karta/satıra dokunarak detayları açabilirsin.' },
      { t: 'Arama', d: 'Üstteki arama kutusundan aradığını hızlıca bulabilirsin.' },
      { t: 'Soru işareti', d: 'Hangi sayfada olursan ol, bu (?) butonundan o sayfanın anlatımına ulaşırsın.' },
    ],
  },
  en: {
    title: 'Help',
    intro: 'Feel free to explore this page — everything is simple and reversible.',
    steps: [
      { t: 'Tap to explore', d: 'Tap a card/row to open details.' },
      { t: 'Search', d: 'Use the top search box to quickly find what you need.' },
      { t: 'Question mark', d: 'On any page, this (?) button shows how that page works.' },
    ],
  },
}

export function getPageHelp(pathname: string, lang: Lang): PageHelpContent {
  let best: (typeof HELP)[number] | null = null
  for (const h of HELP) {
    if (pathname === h.match || pathname.startsWith(h.match + '/') || pathname.startsWith(h.match)) {
      if (!best || h.match.length > best.match.length) best = h
    }
  }
  return best ? best[lang] : GENERIC[lang]
}
