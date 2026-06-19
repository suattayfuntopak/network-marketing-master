import { Resend } from 'resend'
import { SUPER_ADMIN_EMAIL } from '@/lib/domain/constants'
import { formatEmailDate, formatEmailDateTime } from '@/lib/utils/emailDateTime'
import {
  NMM_APP_URL,
  NMM_REPLY_TO,
  buildPremiumEmail,
  emailCta,
  emailHeading,
  emailHighlight,
  emailParagraph,
  emailPlanBox,
} from '@/lib/infra/emailTemplate'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NMM <onboarding@resend.dev>'

/**
 * Sends a welcome onboarding email to a newly signed up user.
 */
export async function sendWelcomeEmail(email: string, name: string, lang: 'tr' | 'en' = 'tr'): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendWelcomeEmail: RESEND_API_KEY is not defined in environments.')
    return false
  }

  const subject = lang === 'en'
    ? 'Welcome to Network Marketing Master! 🚀'
    : 'Network Marketing Master\'a Hoş Geldiniz! 🚀'

  const content = lang === 'en'
    ? [
        emailHeading(`Welcome, ${name}!`),
        emailParagraph(
          `You joined ${emailHighlight('Network Marketing Master')} — your ${emailHighlight('14-day free trial')} with full Basic features starts now.`
        ),
        emailParagraph('What Basic gives you during the trial:'),
        emailPlanBox([
          '🎯 <strong>Pipeline & candidates</strong> — track every prospect through your stages',
          '🤖 <strong>AI field rehearsal</strong> — practice objection handling before real talks',
          '📅 <strong>Calendar & reminders</strong> — never miss a follow-up',
          '🛡️ <strong>Compliance check</strong> — keep your posts policy-compliant with AI review',
          '📊 <strong>Stats & goal roadmap</strong> — see your daily targets and progress',
        ]),
        emailParagraph(
          `Your trial lasts ${emailHighlight('14 days')}. After that, NMM keeps running — pipeline, calendar, team, and training stay fully open. ${emailHighlight('Only AI tools lock')} on the free plan. Pick a plan anytime to re-enable AI.`
        ),
        emailCta(`${NMM_APP_URL}/odeme`, 'View plans & upgrade'),
        emailParagraph(
          `Or jump straight in: <a href="${NMM_APP_URL}/giris" style="color:#534AB7;font-weight:600;">open your dashboard →</a>`
        ),
      ].join('')
    : [
        emailHeading(`Hoş geldiniz, ${name}!`),
        emailParagraph(
          `${emailHighlight('Network Marketing Master')}'a katıldınız — ${emailHighlight('14 günlük ücretsiz denemeniz')} tüm Basic özellikleriyle şu an başladı.`
        ),
        emailParagraph('Deneme süresince Basic ile neler yapabilirsiniz:'),
        emailPlanBox([
          '🎯 <strong>Liste & adaylar</strong> — her adayı aşamalar boyunca takip edin',
          '🤖 <strong>YZ saha provası</strong> — gerçek görüşmeden önce itiraz provası yapın',
          '📅 <strong>Takvim & hatırlatmalar</strong> — hiçbir takibi kaçırmayın',
          '🛡️ <strong>Uyum denetimi</strong> — paylaşımlarını YZ ile mevzuata uygun tut',
          '📊 <strong>İstatistik & hedef yol haritası</strong> — günlük hedeflerinizi ve ilerlemenizi görün',
        ]),
        emailParagraph(
          `Denemeniz ${emailHighlight('14 gün')} sürer. Süre sonunda NMM çalışmaya devam eder — liste, takvim, ekip ve eğitimler tamamen açık kalır. ${emailHighlight('Yalnızca yapay zeka araçları')} ücretsiz planda kilitlenir. İstediğiniz zaman plan seçerek AI'ı yeniden açabilirsiniz.`
        ),
        emailCta(`${NMM_APP_URL}/odeme`, 'Planları gör ve yükselt'),
        emailParagraph(
          `Ya da hemen başlayın: <a href="${NMM_APP_URL}/giris" style="color:#534AB7;font-weight:600;">panonuza giriş yapın →</a>`
        ),
      ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })

    return true
  } catch (err) {
    console.error('[Resend] Failed to send welcome email:', err)
    return false
  }
}

/**
 * Sends a payment success invoice email.
 */
export async function sendPaymentSuccessEmail(
  email: string,
  name: string,
  plan: 'basic' | 'plus' | 'pro',
  amount: string,
  expiresAt: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendPaymentSuccessEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const planLabel = plan === 'pro'
    ? (lang === 'en' ? 'Diamond Pro Lider Planı' : 'Diamond Pro Lider Planı')
    : plan === 'plus'
      ? (lang === 'en' ? 'Plus Lider Planı' : 'Plus Lider Planı')
      : (lang === 'en' ? 'Basic Partner Planı' : 'Basic Partner Planı')

  const subject = lang === 'en'
    ? `Payment Confirmed! Your ${planLabel} is active 💎`
    : `Ödemeniz Alındı! ${planLabel} lisansınız aktifleşti 💎`

  const dateFormatted = formatEmailDate(expiresAt, lang)

  const receipt = lang === 'en'
    ? emailPlanBox([
        `<strong>Plan:</strong> ${planLabel}`,
        `<strong>Amount:</strong> ${amount} TRY`,
        `<strong>License until:</strong> ${dateFormatted}`,
      ])
    : emailPlanBox([
        `<strong>Plan:</strong> ${planLabel}`,
        `<strong>Ödenen:</strong> ${amount} TRY`,
        `<strong>Lisans bitiş:</strong> ${dateFormatted}`,
      ])

  const content = lang === 'en'
    ? [
        emailHeading('Payment confirmed'),
        emailParagraph(
          `Hi ${name}, your payment was verified. Your workspace is now ${emailHighlight(planLabel)}.`
        ),
        receipt,
        emailParagraph('Premium features and AI credits are active immediately.'),
        emailCta(`${NMM_APP_URL}/giris`, 'Open workspace'),
      ].join('')
    : [
        emailHeading('Ödemeniz onaylandı'),
        emailParagraph(
          `Merhaba ${name}, ödemeniz doğrulandı. Çalışma alanınız ${emailHighlight(planLabel)} planına yükseltildi.`
        ),
        receipt,
        emailParagraph('Premium özellikler ve YZ kredileri anında aktif.'),
        emailCta(`${NMM_APP_URL}/giris`, 'Çalışma alanına git'),
      ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })

    return true
  } catch (err) {
    console.error('[Resend] Failed to send payment success email:', err)
    return false
  }
}

/**
 * Sends a license expiry reminder email (7, 3, or 1 day before expiry).
 */
export async function sendLicenseExpiryEmail(
  email: string,
  name: string,
  plan: 'basic' | 'plus' | 'pro',
  expiresAt: string,
  daysRemaining: number,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendLicenseExpiryEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const planLabel = plan === 'pro'
    ? 'Diamond Pro Lider'
    : plan === 'plus'
      ? 'Plus Lider'
      : 'Basic Partner'

  const dateFormatted = formatEmailDate(expiresAt, lang)

  const subject = lang === 'en'
    ? `Your license expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}! ⏳`
    : `Lisansınız ${daysRemaining} gün içinde sona eriyor! ⏳`

  const daysLabel =
    lang === 'en'
      ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
      : `${daysRemaining} gün`

  const content = lang === 'en'
    ? [
        emailHeading('License renewal reminder'),
        emailParagraph(
          `Hi ${name}, your ${emailHighlight(planLabel)} license expires in ${emailHighlight(daysLabel)} (${dateFormatted}).`
        ),
        emailParagraph('Renew to keep AI credits, pipeline, and team tools without interruption.'),
        emailCta(`${NMM_APP_URL}/odeme`, 'Renew now →'),
      ].join('')
    : [
        emailHeading('Lisans yenileme hatırlatması'),
        emailParagraph(
          `Merhaba ${name}, ${emailHighlight(planLabel)} lisansınız ${emailHighlight(daysLabel)} içinde sona eriyor (${dateFormatted}).`
        ),
        emailParagraph('YZ kredileri, liste ve ekip araçları için kesintisiz erişim için yenileyin.'),
        emailCta(`${NMM_APP_URL}/odeme`, 'Hemen yenile →'),
      ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send license expiry email:', err)
    return false
  }
}

/**
 * Sends a registration notification email to the platform administrator.
 */
export async function sendAdminNewUserEmail(
  adminEmail: string,
  newUserEmail: string,
  newUserName: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendAdminNewUserEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const subject = `Yeni Kullanıcı Kaydı: ${newUserName}`
  const content = [
    emailHeading('Platforma yeni kayıt'),
    emailParagraph('Yeni bir lider/ortak kaydoldu:'),
    emailPlanBox([
      `<strong>İsim:</strong> ${newUserName}`,
      `<strong>E-posta:</strong> ${newUserEmail}`,
      `<strong>Zaman:</strong> ${formatEmailDateTime(new Date(), 'tr')}`,
    ]),
    emailParagraph('Detaylar için Platform Yönetimi sayfasını kullanabilirsiniz.'),
  ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
      replyTo: newUserEmail,
      subject,
      html: buildPremiumEmail(content, 'tr'),
    })

    return true
  } catch (err) {
    console.error('[Resend] Failed to send admin signup alert email:', err)
    return false
  }
}

/**
 * KRİTİK: Bir Shopier siparişi (müşteri ödedi) note/productId eşleşmediği için
 * lisansa dönüştürülemediğinde süper admin'i uyarır. Sessiz başarısızlık =
 * müşteri ödemiş ama lisans almamış demektir; manuel müdahale gerekir.
 */
export async function sendUnresolvedOrderAlertEmail(params: {
  orderId: string | null
  note: string | null
  productId: string | null
  reason: string
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendUnresolvedOrderAlertEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const subject = `⚠️ ÇÖZÜLEMEYEN ÖDEME — sipariş ${params.orderId ?? '(id yok)'}`
  const content = [
    emailHeading('Çözülemeyen ödeme — müdahale gerekli'),
    emailParagraph(
      `Bir Shopier siparişi alındı ancak ${emailHighlight('lisansa dönüştürülemedi')}. ` +
      'Müşteri ödemiş olabilir; lütfen el ile kontrol edip lisansı tanımlayın.'
    ),
    emailPlanBox([
      `<strong>Sipariş ID:</strong> ${params.orderId ?? '—'}`,
      `<strong>Not (note):</strong> ${params.note ?? '—'}`,
      `<strong>Ürün ID:</strong> ${params.productId ?? '—'}`,
      `<strong>Neden:</strong> ${params.reason}`,
      `<strong>Zaman:</strong> ${formatEmailDateTime(new Date(), 'tr')}`,
    ]),
    emailParagraph('Müşteriyi Platform Yönetimi sayfasından bulup lisansını el ile tanımlayabilirsiniz.'),
    emailCta(`${NMM_APP_URL}/platform-yonetim`, 'Platform Yönetimini Aç'),
  ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [SUPER_ADMIN_EMAIL, 'info@suattayfuntopak.com'],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, 'tr'),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send unresolved order alert email:', err)
    return false
  }
}

/**
 * Sends a notification email to the Super Admin about a new user-submitted training/objection request.
 */
export async function sendModerationAlertEmail(
  userEmail: string,
  userName: string,
  contentType: 'training' | 'objection' | 'video',
  contentTitle: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendModerationAlertEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const typeLabel =
    contentType === 'training'
      ? 'İçerik (Vaktin Varsa)'
      : contentType === 'video'
        ? 'Video Eğitim'
        : 'İtirazlara Cevap'
  const subject = `Yeni Moderasyon Talebi: ${contentTitle}`
  const content = [
    emailHeading('Yeni İçerik/İtiraz Ekleme Talebi'),
    emailParagraph(`Platformdaki bir kullanıcı yeni bir ${emailHighlight(typeLabel)} ekleme talebinde bulundu.`),
    emailPlanBox([
      `<strong>Gönderen:</strong> ${userName} (${userEmail})`,
      `<strong>Başlık:</strong> ${contentTitle}`,
      `<strong>Tür:</strong> ${typeLabel}`,
      `<strong>Zaman:</strong> ${formatEmailDateTime(new Date(), 'tr')}`,
    ]),
    emailParagraph('Talebi incelemek, düzenlemek veya onaylamak için Platform Yönetimi paneline gidebilirsiniz.'),
    emailCta(`${NMM_APP_URL}/platform-yonetim`, 'Moderasyon Panelini Aç'),
  ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [SUPER_ADMIN_EMAIL, 'info@suattayfuntopak.com'],
      replyTo: userEmail,
      subject,
      html: buildPremiumEmail(content, 'tr'),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send moderation alert email:', err)
    return false
  }
}

/**
 * Sends an email notification to the submitter when their training/objection is approved by the admin.
 */
export async function sendModerationApprovedEmail(
  userEmail: string,
  userName: string,
  contentType: 'training' | 'objection' | 'video',
  contentTitle: string,
  itemKey: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendModerationApprovedEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const typeLabel =
    contentType === 'training'
      ? (lang === 'en' ? 'Training content' : 'İçerik')
      : contentType === 'video'
        ? (lang === 'en' ? 'Training video' : 'Video')
        : (lang === 'en' ? 'Objection handler' : 'İtiraz')

  const subject = lang === 'en'
    ? `Approved! Your content addition is live 🚀`
    : `Tebrikler! İçerik ekleme talebiniz onaylandı 🚀`

  const directLink =
    contentType === 'training'
      ? `${NMM_APP_URL}/egitim?id=${itemKey}`
      : contentType === 'video'
        ? `${NMM_APP_URL}/egitim?tab=videos`
        : `${NMM_APP_URL}/egitim?tab=objections&id=${itemKey}`

  const content = lang === 'en'
    ? [
        emailHeading('Content approved!'),
        emailParagraph(`Dear ${userName},`),
        emailParagraph(
          `Your request to add the ${emailHighlight(typeLabel)} has been approved and is now live for you and the entire NMM family.`
        ),
        emailParagraph(`Approved Title: <strong>${contentTitle}</strong>`),
        emailParagraph('Thank you very much for your interest and contribution to our application.'),
        emailCta(directLink, 'View Live Content'),
      ].join('')
    : [
        emailHeading('İçerik talebiniz onaylandı!'),
        emailParagraph(`Sayın ${userName},`),
        emailParagraph(
          `İçerik/İtiraz ekleme talebiniz onaylanmıştır ve aşağıdaki bağlantıdan siz ve tüm NMM ailesinin kullanımına açılmıştır.`
        ),
        emailParagraph(`Onaylanan Başlık: <strong>${contentTitle}</strong>`),
        emailParagraph('Uygulamamıza göstermiş olduğunuz ilgi ve katkıdan dolayı çok teşekkür ederiz.'),
        emailCta(directLink, 'İçeriği Görüntüle'),
      ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send moderation approved email:', err)
    return false
  }
}

/**
 * Sends a polite, professional notification email to the submitter when their training/objection is rejected by the admin.
 */
export async function sendModerationRejectedEmail(
  userEmail: string,
  userName: string,
  contentType: 'training' | 'objection' | 'video',
  contentTitle: string,
  reason: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendModerationRejectedEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const typeLabel =
    contentType === 'training'
      ? (lang === 'en' ? 'Training content' : 'İçerik')
      : contentType === 'video'
        ? (lang === 'en' ? 'Training video' : 'Video')
        : (lang === 'en' ? 'Objection handler' : 'İtiraz')

  const subject = lang === 'en'
    ? `Update regarding your content addition request`
    : `İçerik ekleme talebiniz hakkında bilgilendirme`

  const reasonContent = reason.trim() 
    ? (lang === 'en' 
        ? `<p><strong>Feedback from Admin:</strong></p><blockquote style="border-left: 4px solid #ef4444; padding-left: 14px; margin: 16px 0; color: #4b5563; font-style: italic; font-size: 13px; line-height: 1.6;">"${reason}"</blockquote>`
        : `<p><strong>Yönetici Geri Bildirimi:</strong></p><blockquote style="border-left: 4px solid #ef4444; padding-left: 14px; margin: 16px 0; color: #4b5563; font-style: italic; font-size: 13px; line-height: 1.6;">"${reason}"</blockquote>`)
    : ''

  const content = lang === 'en'
    ? [
        emailHeading('Content request update'),
        emailParagraph(`Dear ${userName},`),
        emailParagraph(
          `Thank you for your submission to add "${contentTitle}" to Network Marketing Master.`
        ),
        emailParagraph(
          `Our administration team has reviewed your request. Unfortunately, we cannot add this specific ${typeLabel} to the general database at this time.`
        ),
        reasonContent,
        emailParagraph(
          `If you have any questions or want to make adjustments, you can contact us at info@suattayfuntopak.com.`
        ),
      ].join('')
    : [
        emailHeading('İçerik talebi hakkında'),
        emailParagraph(`Sayın ${userName},`),
        emailParagraph(
          `Network Marketing Master platformuna "${contentTitle}" başlığıyla yapmış olduğunuz ekleme talebi için teşekkür ederiz.`
        ),
        emailParagraph(
          `Yönetici ekibimiz ilgili talebinizi incelemiştir. Yapılan değerlendirme sonucunda, bu ${typeLabel} talebini mevcut haliyle genel veri tabanına ekleyemeyeceğimizi bildirmek isteriz.`
        ),
        reasonContent,
        emailParagraph(
          `Herhangi bir sorunuz varsa veya düzenleme yaparak tekrar iletmek isterseniz info@suattayfuntopak.com adresi üzerinden bizimle iletişime geçebilirsiniz.`
        ),
      ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send moderation rejected email:', err)
    return false
  }
}

/**
 * Havale/EFT ile ödeyen kullanıcı "ödedim" dediğinde super admin'e bildirim gönderir.
 * Müşterinin kayıtlı e-postasını otomatik içerir (kullanıcı açıklamaya yazmayı unutsa bile),
 * admin'i doğrudan Platform Yönetimi'ne yönlendirir. Migration gerektirmez (Resend).
 */
export async function sendBankTransferNotifyEmail(
  userEmail: string,
  userName: string,
  workspaceName: string | null,
  currentPlan: string,
  intendedPlan?: string | null,
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendBankTransferNotifyEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const subject = `Havale/EFT Ödeme Bildirimi: ${userName}`
  const content = [
    emailHeading('Havale/EFT ödeme bildirimi'),
    emailParagraph(
      `Bir kullanıcı ${emailHighlight('havale/EFT ile ödeme yaptığını')} bildirdi. Lütfen banka hesabınızı kontrol edip lisansı aktive edin.`,
    ),
    emailPlanBox(
      [
        `<strong>İsim:</strong> ${userName}`,
        `<strong>Kayıtlı e-posta:</strong> ${userEmail}`,
        workspaceName ? `<strong>Çalışma alanı:</strong> ${workspaceName}` : '',
        `<strong>Mevcut plan:</strong> ${currentPlan}`,
        intendedPlan ? `<strong>Talep edilen plan:</strong> ${intendedPlan}` : '',
        `<strong>Zaman:</strong> ${formatEmailDateTime(new Date(), 'tr')}`,
      ].filter(Boolean),
    ),
    emailCta(`${NMM_APP_URL}/platform-yonetim`, 'Lisansı Aktive Et'),
  ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [SUPER_ADMIN_EMAIL, 'info@suattayfuntopak.com'],
      replyTo: userEmail,
      subject,
      html: buildPremiumEmail(content, 'tr'),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send bank transfer notify email:', err)
    return false
  }
}

/**
 * Sends an overdue follow-up digest email to a user listing all overdue candidates.
 */
export async function sendOverdueDigestEmail(
  email: string,
  name: string,
  candidates: Array<{ name: string; daysOverdue: number }>,
  lang: 'tr' | 'en' = 'tr',
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendOverdueDigestEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const subject =
    lang === 'en'
      ? `You have ${candidates.length} overdue follow-up${candidates.length > 1 ? 's' : ''} ⏰`
      : `${candidates.length} gecikmiş takibiniz var ⏰`

  const rows = candidates
    .map(c =>
      lang === 'en'
        ? `<li style="padding:4px 0;font-size:13px;color:#374151;"><strong>${c.name}</strong> — ${c.daysOverdue} day${c.daysOverdue > 1 ? 's' : ''} overdue</li>`
        : `<li style="padding:4px 0;font-size:13px;color:#374151;"><strong>${c.name}</strong> — ${c.daysOverdue} gün gecikmiş</li>`,
    )
    .join('')

  const content =
    lang === 'en'
      ? [
          emailHeading('Overdue follow-ups'),
          emailParagraph(`Hi ${name}, the following candidates have overdue follow-ups in your pipeline:`),
          `<ul style="padding-left:20px;margin:12px 0;">${rows}</ul>`,
          emailParagraph('Open your pipeline to schedule new follow-ups and keep your momentum going.'),
          emailCta(`${NMM_APP_URL}/pipeline`, 'Open Pipeline'),
        ].join('')
      : [
          emailHeading('Gecikmiş takipler'),
          emailParagraph(`Merhaba ${name}, listenizde aşağıdaki adaylar için planlanan takipler geçti:`),
          `<ul style="padding-left:20px;margin:12px 0;">${rows}</ul>`,
          emailParagraph('Yeni tarih belirlemek ve hızınızı korumak için listenizi açın.'),
          emailCta(`${NMM_APP_URL}/pipeline`, 'Listeyi Aç'),
        ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send overdue digest email:', err)
    return false
  }
}

/** Şifre sıfırlama — NMM logo + premium şablon (Supabase varsayılan N harfi yerine). */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  lang: 'tr' | 'en' = 'tr',
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendPasswordResetEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const subject =
    lang === 'en'
      ? 'Reset your password — Network Marketing Master'
      : 'Şifreni Sıfırla — Network Marketing Master'

  const content =
    lang === 'en'
      ? [
          emailHeading('Reset your password'),
          emailParagraph(
            'We received a password reset request. Click the button below to set a new password.',
          ),
          emailCta(resetLink, 'Reset my password'),
          emailParagraph(
            'This link is valid for 1 hour. If you did not request this, you can ignore this email.',
          ),
        ].join('')
      : [
          emailHeading('Şifreni sıfırla'),
          emailParagraph(
            'Bir şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifreni belirleyebilirsin.',
          ),
          emailCta(resetLink, 'Şifremi Sıfırla'),
          emailParagraph(
            'Bu bağlantı 1 saat geçerlidir. Talebi sen yapmadıysan bu e-postayı yok say.',
          ),
        ].join('')

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: NMM_REPLY_TO,
      subject,
      html: buildPremiumEmail(content, lang),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send password reset email:', err)
    return false
  }
}

