/**
 * Sayfa yardımı içeriği — her sayfanın "nasıl kullanılır"ını EN SADE dille anlatır.
 * Header'daki (?) butonu açtığında, bulunulan rotaya göre bu içerik gösterilir.
 * Çeviri sözlüğünü şişirmemek için içerik burada (TR + EN) tutulur.
 */

import { PLAN_PAGE_HELP_PLAN_STEP } from './planFeatureMatrix'

export type PageHelpStep = { t: string; d: string }
export type PageHelpContent = { title: string; intro: string; steps: PageHelpStep[] }

type Lang = 'tr' | 'en'

type TabHelpEntry = { match: string; tab: string; tr: PageHelpContent; en: PageHelpContent }

/** Sekmeli sayfalar — rota + sekme anahtarı (URL ?tab= veya bileşen contextKey). */
const TAB_HELP: TabHelpEntry[] = [
  {
    match: '/ekip',
    tab: 'members',
    tr: {
      title: 'Ekibim — Ekip Üyeleri',
      intro: 'Doğrudan ekibindeki üyeleri listeler; davet, liste bağlantısı ve kart aksiyonları burada.',
      steps: [
        { t: 'Üye kartı', d: 'Bir üyeye dokunarak aktivite, eğitim ve hedef bilgilerine gidebilirsin.' },
        { t: 'Listeye ekle', d: 'Üye henüz senin aday listende değilse tek tıkla pipeline\'a ekleyebilirsin.' },
        { t: 'Davet', d: 'Davet kodun ve WhatsApp paylaşımı ile yeni üyeleri NMM\'e çağır.' },
      ],
    },
    en: {
      title: 'My Team — Members',
      intro: 'Lists your direct team members; invites, pipeline links, and card actions live here.',
      steps: [
        { t: 'Member card', d: 'Tap a member to see activity, training, and goal info.' },
        { t: 'Add to list', d: 'If they are not in your pipeline yet, add them in one tap.' },
        { t: 'Invite', d: 'Share your invite code via WhatsApp to bring new members to NMM.' },
      ],
    },
  },
  {
    match: '/ekip',
    tab: 'summary',
    tr: {
      title: 'Ekibim — Saha Özeti',
      intro: 'Ekibinin saha performansını dönem dönem görürsün (Günlük / Haftalık / Aylık).',
      steps: [
        { t: 'Dönem seç', d: 'Üstteki sekmelerle ekibinin o dönemdeki arama, tanışma, sunum ve yeni üye sayılarını karşılaştır.' },
        { t: 'Sıralama', d: 'Ekip Saha Nabzı tablosu en aktif üyeleri üstte gösterir; zayıf kalanlara dokunarak destek planla.' },
        { t: 'Detay', d: 'Bir satıra dokunarak üyenin kendi saha özetine gidebilirsin.' },
        PLAN_PAGE_HELP_PLAN_STEP.tr,
      ],
    },
    en: {
      title: 'My Team — Field Summary',
      intro: 'See your team\'s field performance by period (Daily / Weekly / Monthly).',
      steps: [
        { t: 'Pick a period', d: 'Use the top tabs to compare calls, contacts, presentations, and new members.' },
        { t: 'Ranking', d: 'Team Field Pulse ranks the most active members first.' },
        { t: 'Drill down', d: 'Tap a row to open that member\'s own field summary.' },
        PLAN_PAGE_HELP_PLAN_STEP.en,
      ],
    },
  },
  {
    match: '/ekip',
    tab: 'training',
    tr: {
      title: 'Ekibim — Eğitim İlerlemesi',
      intro: 'Ekibinin eğitim ve video ilerlemesini takip edersin.',
      steps: [
        { t: 'İlerleme yüzdesi', d: 'Her üyenin tamamladığı eğitim ve video oranını gör.' },
        { t: 'Destek', d: 'Geride kalan üyelere hatırlatma veya içerik paylaşımı planla.' },
        { t: 'Detay', d: 'Üye kartından bireysel eğitim durumuna inebilirsin.' },
        PLAN_PAGE_HELP_PLAN_STEP.tr,
      ],
    },
    en: {
      title: 'My Team — Training Progress',
      intro: 'Track your team\'s training and video completion.',
      steps: [
        { t: 'Progress %', d: 'See each member\'s completed training and video ratio.' },
        { t: 'Support', d: 'Plan reminders or content shares for members who lag behind.' },
        { t: 'Detail', d: 'Open a member card for individual training status.' },
        PLAN_PAGE_HELP_PLAN_STEP.en,
      ],
    },
  },
  {
    match: '/ekip',
    tab: 'tree',
    tr: {
      title: 'Ekibim — Nesil Ağacı',
      intro: 'Ekibinin nesil nesil (kuşak) yapısını görsel ağaç olarak görürsün.',
      steps: [
        { t: 'Kuşaklar', d: '1. nesil doğrudan ekibin; alt kuşaklar onların davet ettikleri.' },
        { t: 'Genişlet', d: 'Dallara dokunarak alt hattı aç/kapat.' },
        { t: 'Kişi detayı', d: 'Bir kişiye tıklayarak o kişinin profil sayfasına git.' },
      ],
    },
    en: {
      title: 'My Team — Generation Tree',
      intro: 'See your team structure as a visual generation tree.',
      steps: [
        { t: 'Generations', d: 'Gen 1 is your direct team; lower generations are their invites.' },
        { t: 'Expand', d: 'Tap branches to open or collapse downlines.' },
        { t: 'Person detail', d: 'Tap a person to open their profile page.' },
      ],
    },
  },
  {
    match: '/saha-ozetim',
    tab: 'daily',
    tr: {
      title: 'Saha Özetim — Günlük',
      intro: 'Bugünkü tempo hedefin ve gerçekleşenlerin (26 iş gününe bölünmüş aylık hedef).',
      steps: [
        { t: '4 kutu', d: 'Arama, tanışma, sunum, yeni üye — Hedefim ile aynı kaynak.' },
        { t: 'Offset', d: 'Ok ile önceki/sonraki güne bakabilirsin.' },
        { t: 'Aktivite', d: 'Alttaki satırlarda WhatsApp, not ve arama sayıları.' },
      ],
    },
    en: {
      title: 'Field Summary — Daily',
      intro: 'Today\'s pace targets vs actuals (monthly goal spread over 26 working days).',
      steps: [
        { t: '4 boxes', d: 'Calls, contacts, presentations, new members — same source as My Goal.' },
        { t: 'Offset', d: 'Use arrows to view previous/next days.' },
        { t: 'Activity', d: 'See WhatsApp, notes, and call counts below.' },
      ],
    },
  },
  {
    match: '/saha-ozetim',
    tab: 'weekly',
    tr: {
      title: 'Saha Özetim — Haftalık',
      intro: 'Bu haftanın toplam saha performansı.',
      steps: [
        { t: 'Hafta seç', d: 'Ok ile önceki/sonraki haftaya geç.' },
        { t: 'Hedef çizgisi', d: 'Yol haritası hedefleriyle karşılaştır.' },
        { t: 'Trend', d: 'Haftalık tempo düşüyorsa Hedefim\'den ay planını gözden geçir.' },
      ],
    },
    en: {
      title: 'Field Summary — Weekly',
      intro: 'This week\'s total field performance.',
      steps: [
        { t: 'Pick a week', d: 'Use arrows for previous/next week.' },
        { t: 'Target line', d: 'Compare against your roadmap targets.' },
        { t: 'Trend', d: 'If pace drops, review your month plan in My Goal.' },
      ],
    },
  },
  {
    match: '/saha-ozetim',
    tab: 'monthly',
    tr: {
      title: 'Saha Özetim — Aylık',
      intro: 'Takvim ayının yol haritası hedefi — İstatistikler\'deki kayan 30 günden farklıdır.',
      steps: [
        { t: 'Ay seç', d: 'Hedefim\'deki ilgili ay satırıyla eşleşir.' },
        { t: '4 metrik', d: 'Ay boyunca biriken gerçekleşmeler.' },
        { t: 'Hedefim bağlantısı', d: 'Ay satırına Hedefim\'den de dokunarak buraya gelebilirsin.' },
      ],
    },
    en: {
      title: 'Field Summary — Monthly',
      intro: 'Calendar month roadmap row — not the rolling 30-day window on Statistics.',
      steps: [
        { t: 'Pick a month', d: 'Matches the corresponding row in My Goal.' },
        { t: '4 metrics', d: 'Accumulated actuals for the month.' },
        { t: 'My Goal link', d: 'You can also jump here from a month row in My Goal.' },
      ],
    },
  },
  {
    match: '/saha-ozetim',
    tab: 'yearly',
    tr: {
      title: 'Saha Özetim — Yıllık',
      intro: 'Yıl bazında toplam performans özeti.',
      steps: [
        { t: 'Yıl seç', d: 'Ok ile farklı yıllara bak.' },
        { t: 'Büyük resim', d: 'Uzun vadeli ivmeni gör.' },
      ],
    },
    en: {
      title: 'Field Summary — Yearly',
      intro: 'Year-level performance overview.',
      steps: [
        { t: 'Pick a year', d: 'Browse other years with arrows.' },
        { t: 'Big picture', d: 'See your long-term momentum.' },
      ],
    },
  },
  {
    match: '/saha-ozetim',
    tab: 'all',
    tr: {
      title: 'Saha Özetim — Tüm Zamanlar',
      intro: 'NMM kullanımın başından beri biriken tüm saha metrikleri.',
      steps: [
        { t: 'Kümülatif', d: 'Tüm dönemlerin toplamı.' },
        { t: 'Karşılaştırma', d: 'Günlük/aylık sekmelerle güncel tempoyu kıyasla.' },
      ],
    },
    en: {
      title: 'Field Summary — All Time',
      intro: 'All field metrics since you started using NMM.',
      steps: [
        { t: 'Cumulative', d: 'Totals across every period.' },
        { t: 'Compare', d: 'Contrast with daily/monthly tabs for current pace.' },
      ],
    },
  },
  {
    match: '/saha-radar',
    tab: 'takipler',
    tr: {
      title: 'Saha Radarım — Takipler',
      intro: 'Gecikmiş ve bu haftaki takiplerini listeler.',
      steps: [
        { t: 'Gecikmiş', d: 'Zamanı geçmiş takipler üstte vurgulanır.' },
        { t: 'WhatsApp / ara', d: 'Kart üzerinden doğrudan iletişime geç.' },
        { t: 'Listeye git', d: 'Kişinin pipeline kaydına tek tıkla geç.' },
      ],
    },
    en: {
      title: 'Field Radar — Follow-Ups',
      intro: 'Lists overdue and this week\'s follow-ups.',
      steps: [
        { t: 'Overdue', d: 'Past-due follow-ups are highlighted at the top.' },
        { t: 'WhatsApp / call', d: 'Reach out directly from the card.' },
        { t: 'Go to list', d: 'Jump to the person\'s pipeline record.' },
      ],
    },
  },
  {
    match: '/saha-radar',
    tab: 'aktivite',
    tr: {
      title: 'Saha Radarım — Aktivite',
      intro: 'Ekip üyelerinin son giriş ve aktivite nabzı.',
      steps: [
        { t: 'Aktif / sessiz', d: 'Kim bugün giriş yaptı, kim uzun süredir yok — bir bakışta gör.' },
        { t: 'Destek', d: 'Sessiz üyelere kısa bir mesaj veya hatırlatma gönder.' },
      ],
    },
    en: {
      title: 'Field Radar — Activity',
      intro: 'Team members\' recent login and activity pulse.',
      steps: [
        { t: 'Active / quiet', d: 'See who logged in today and who has been silent.' },
        { t: 'Support', d: 'Send a quick nudge to quiet members.' },
      ],
    },
  },
  {
    match: '/egitim',
    tab: 'training',
    tr: {
      title: 'Vaktin Varsa — İçerik Kütüphanesi',
      intro: 'Metin eğitim içeriklerini okur, favoriler ve okundu işaretlersin.',
      steps: [
        { t: 'Kategori', d: 'Konuya göre filtrele veya ara.' },
        { t: 'Paylaş', d: 'WhatsApp ile adaya veya ekibe gönder.' },
        { t: 'Katkı', d: 'Kendi içeriğini eklemek için + butonunu kullan.' },
      ],
    },
    en: {
      title: 'When You Have Time — Content Library',
      intro: 'Read text training content; favorite and mark as read.',
      steps: [
        { t: 'Category', d: 'Filter or search by topic.' },
        { t: 'Share', d: 'Send to a prospect or teammate via WhatsApp.' },
        { t: 'Contribute', d: 'Use + to submit your own content.' },
      ],
    },
  },
  {
    match: '/egitim',
    tab: 'videos',
    tr: {
      title: 'Vaktin Varsa — Video Eğitimler',
      intro: 'Video eğitim serisini izler ve ilerlemeni takip edersin.',
      steps: [
        { t: 'Sıra', d: 'Videoları sırayla izlemek ilerlemeyi hızlandırır.' },
        { t: 'Paylaş', d: 'Faydalı videoyu WhatsApp ile paylaş.' },
      ],
    },
    en: {
      title: 'When You Have Time — Video Training',
      intro: 'Watch the video training series and track progress.',
      steps: [
        { t: 'Order', d: 'Watching in order speeds up progress.' },
        { t: 'Share', d: 'Share useful videos via WhatsApp.' },
      ],
    },
  },
  {
    match: '/egitim',
    tab: 'objections',
    tr: {
      title: 'Vaktin Varsa — İtiraz Bankası',
      intro: 'Sık duyulan itirazlara hazır cevapları bulursun.',
      steps: [
        { t: 'Ara', d: 'Anahtar kelimeyle itiraz bul.' },
        { t: 'Paylaş', d: 'Cevabı adayla WhatsApp\'tan paylaş.' },
        { t: 'Katkı', d: 'Yeni itiraz/cevap ekleyebilirsin.' },
      ],
    },
    en: {
      title: 'When You Have Time — Objection Bank',
      intro: 'Find ready answers to common objections.',
      steps: [
        { t: 'Search', d: 'Find objections by keyword.' },
        { t: 'Share', d: 'Share the answer with a prospect on WhatsApp.' },
        { t: 'Contribute', d: 'You can submit new objections/answers.' },
      ],
    },
  },
]

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
        PLAN_PAGE_HELP_PLAN_STEP.tr,
      ],
    },
    en: {
      title: 'My Field Summary',
      intro: 'See your own field performance daily/weekly/monthly.',
      steps: [
        { t: 'Pick a period', d: 'Use the Daily / Weekly / Monthly / Yearly / All-time tabs at the top. Monthly here is the calendar month’s roadmap row — not the rolling “Last 30 days” window on Statistics.' },
        { t: '4 colored boxes', d: 'Actuals come from your pipeline automatically; targets match My Goal’s roadmap (daily = pace, monthly = that calendar month’s row).' },
        { t: 'Field activity', d: 'Below, see action counts like WhatsApp, notes, calls.' },
        PLAN_PAGE_HELP_PLAN_STEP.en,
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
        PLAN_PAGE_HELP_PLAN_STEP.tr,
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
        PLAN_PAGE_HELP_PLAN_STEP.en,
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
        { t: 'Detay sayfası', d: 'Bir müşteri kartına dokunarak profil, sipariş geçmişi ve iletişim butonlarını görebilirsin.' },
        { t: 'Sipariş ekle / düzenle', d: 'Karttan veya detaydan sipariş ekle; kalem ikonu ile müşteri ve sipariş bilgilerini düzenle.' },
        { t: 'Özet', d: 'Üstteki kutular toplam ciroyu, müşteri ve sipariş sayını gösterir.' },
      ],
    },
    en: {
      title: 'My Customers',
      intro: 'Track customers you sell products to and their orders here (separate from prospects).',
      steps: [
        { t: 'Add customer', d: 'Use “Add Customer” to create a new customer with name, phone and a note.' },
        { t: 'Detail page', d: 'Tap a customer card to open their profile, order history, and contact buttons.' },
        { t: 'Add / edit orders', d: 'Add orders from the card or detail page; use the pencil icon to edit customer and order info.' },
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
      title: 'Super Admin',
      intro: 'Tüm kullanıcıları, lisansları ve dış kayıtları yönetirsin.',
      steps: [
        { t: 'Dış Kayıtlar', d: 'Bağımsız kaydolmuş kişileri "Ekibime Bağla" ile kendi ekibine alabilirsin.' },
        { t: 'Lisans yönetimi', d: 'Kullanıcı listesinden lisans paketlerini ve sürelerini düzenleyebilirsin.' },
        { t: 'AI Kullanım Analitiği', d: 'Lisans kademesi ve segment bazında anonim günlük AI üretimi (ort/medyan/p90) — maliyet ve fiyatlama kararına ışık tutar.' },
      ],
    },
    en: {
      title: 'Super Admin',
      intro: 'Manage all users, licenses and external signups.',
      steps: [
        { t: 'External signups', d: 'Use “Link to my team” to bring independent signups into your team.' },
        { t: 'License management', d: 'Edit license tiers and durations from the user list.' },
        { t: 'AI Usage Analytics', d: 'Anonymous daily AI generation (avg/median/p90) by license tier and segment — informs cost and pricing decisions.' },
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

export function resolvePageHelpContext(pathname: string, tab: string | null | undefined): string | undefined {
  if (pathname.startsWith('/ekip')) {
    if (tab === 'summary' || tab === 'training' || tab === 'tree') return tab
    return 'members'
  }
  if (pathname.startsWith('/saha-ozetim')) {
    const valid = ['daily', 'weekly', 'monthly', 'yearly', 'all'] as const
    return valid.includes(tab as (typeof valid)[number]) ? tab! : 'daily'
  }
  if (pathname.startsWith('/egitim')) {
    if (tab === 'videos' || tab === 'objections') return tab
    return 'training'
  }
  if (pathname.startsWith('/saha-radar')) {
    if (tab === 'aktivite') return 'aktivite'
    return 'takipler'
  }
  return undefined
}

function findTabHelp(pathname: string, lang: Lang, tab?: string): PageHelpContent | null {
  if (!tab) return null
  for (const h of TAB_HELP) {
    if (tab === h.tab && (pathname === h.match || pathname.startsWith(h.match + '/'))) {
      return h[lang]
    }
  }
  return null
}

export function getPageHelp(pathname: string, lang: Lang, tab?: string): PageHelpContent {
  const tabContent = findTabHelp(pathname, lang, tab)
  if (tabContent) return tabContent

  let best: (typeof HELP)[number] | null = null
  for (const h of HELP) {
    if (pathname === h.match || pathname.startsWith(h.match + '/') || pathname.startsWith(h.match)) {
      if (!best || h.match.length > best.match.length) best = h
    }
  }
  return best ? best[lang] : GENERIC[lang]
}
