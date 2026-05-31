import { Resend } from 'resend'
import {
  NMM_APP_URL,
  buildPremiumEmail,
  emailCta,
  emailHeading,
  emailHighlight,
  emailParagraph,
  emailPlanBox,
} from '@/lib/infra/emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)
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
          `You joined ${emailHighlight('Network Marketing Master')} — your 14-day trial with full Basic features starts now.`
        ),
        emailParagraph('Your first 3 steps:'),
        emailParagraph(
          '1. <strong>Build your pipeline</strong> — add prospects and move them through stages.<br>2. <strong>AI roleplay</strong> — rehearse objections before real conversations.<br>3. <strong>Invite your team</strong> — share your sponsor code from the Team panel.'
        ),
        emailCta(`${NMM_APP_URL}/giris`, 'Go to dashboard'),
      ].join('')
    : [
        emailHeading(`Hoş geldiniz, ${name}!`),
        emailParagraph(
          `${emailHighlight('Network Marketing Master')}'a katıldınız — 14 günlük denemeniz Basic özelliklerle başladı.`
        ),
        emailParagraph('İlk 3 adım:'),
        emailParagraph(
          '1. <strong>Boru hattını kurun</strong> — adayları ekleyin ve aşamalara taşıyın.<br>2. <strong>YZ saha provası</strong> — gerçek görüşmeden önce itiraz provası yapın.<br>3. <strong>Ekibinizi davet edin</strong> — Ekip panelinden sponsor kodunuzu paylaşın.'
        ),
        emailCta(`${NMM_APP_URL}/giris`, 'Panoya giriş yap'),
      ].join('')

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
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
  plan: 'leader' | 'master' | 'pro',
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
    : plan === 'master'
      ? (lang === 'en' ? 'Plus Lider Planı' : 'Plus Lider Planı')
      : (lang === 'en' ? 'Basic Partner Planı' : 'Basic Partner Planı')

  const subject = lang === 'en'
    ? `Payment Confirmed! Your ${planLabel} is active 💎`
    : `Ödemeniz Alındı! ${planLabel} lisansınız aktifleşti 💎`

  const dateFormatted = new Date(expiresAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
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
  plan: 'leader' | 'master' | 'pro',
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
    : plan === 'master'
      ? 'Plus Lider'
      : 'Basic Partner'

  const dateFormatted = new Date(expiresAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

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
        emailParagraph('YZ kredileri, boru hattı ve ekip araçları için kesintisiz erişim için yenileyin.'),
        emailCta(`${NMM_APP_URL}/odeme`, 'Hemen yenile →'),
      ].join('')

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
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
      `<strong>Zaman:</strong> ${new Date().toLocaleString('tr-TR')}`,
    ]),
    emailParagraph('Detaylar için Platform Yönetimi sayfasını kullanabilirsiniz.'),
  ].join('')

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
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
 * Sends a notification email to the Super Admin about a new user-submitted training/objection request.
 */
export async function sendModerationAlertEmail(
  userEmail: string,
  userName: string,
  contentType: 'training' | 'objection',
  contentTitle: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendModerationAlertEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const typeLabel = contentType === 'training' ? 'İçerik (Vaktin Varsa)' : 'İtirazlara Cevap'
  const subject = `Yeni Moderasyon Talebi: ${contentTitle}`
  const content = [
    emailHeading('Yeni İçerik/İtiraz Ekleme Talebi'),
    emailParagraph(`Platformdaki bir kullanıcı yeni bir ${emailHighlight(typeLabel)} ekleme talebinde bulundu.`),
    emailPlanBox([
      `<strong>Gönderen:</strong> ${userName} (${userEmail})`,
      `<strong>Başlık:</strong> ${contentTitle}`,
      `<strong>Tür:</strong> ${typeLabel}`,
      `<strong>Zaman:</strong> ${new Date().toLocaleString('tr-TR')}`,
    ]),
    emailParagraph('Talebi incelemek, düzenlemek veya onaylamak için Platform Yönetimi paneline gidebilirsiniz.'),
    emailCta(`${NMM_APP_URL}/platform-yonetim`, 'Moderasyon Panelini Aç'),
  ].join('')

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ['info@suattayfuntopak.com'],
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
  contentType: 'training' | 'objection',
  contentTitle: string,
  itemKey: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping sendModerationApprovedEmail: RESEND_API_KEY is not defined.')
    return false
  }

  const typeLabel = contentType === 'training'
    ? (lang === 'en' ? 'Training content' : 'İçerik')
    : (lang === 'en' ? 'Objection handler' : 'İtiraz')

  const subject = lang === 'en'
    ? `Approved! Your content addition is live 🚀`
    : `Tebrikler! İçerik ekleme talebiniz onaylandı 🚀`

  const targetPath = contentType === 'training' ? 'egitim' : 'itirazlar'
  const directLink = `${NMM_APP_URL}/${targetPath}?id=${itemKey}`

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
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      replyTo: 'info@suattayfuntopak.com',
      subject,
      html: buildPremiumEmail(content, lang),
    })
    return true
  } catch (err) {
    console.error('[Resend] Failed to send moderation approved email:', err)
    return false
  }
}
