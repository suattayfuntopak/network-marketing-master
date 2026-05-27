import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key')
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NMM <onboarding@resend.dev>'

/**
 * Generates the unified premium dark-mode email wrapper.
 */
function getEmailTemplate(contentHtml: string, lang: 'tr' | 'en' = 'tr'): string {
  const footerText = lang === 'en'
    ? '© 2026 Network Marketing Master. All rights reserved.'
    : '© 2026 Network Marketing Master. Tüm hakları saklıdır.'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Network Marketing Master</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #0A0B10;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #E4E4E7;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #0A0B10;
            padding: 40px 0;
          }
          .container {
            max-w: 600px;
            margin: 0 auto;
            background-color: #12131A;
            border: 1px solid rgba(83, 74, 183, 0.2);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #FFFFFF;
            background: linear-gradient(135deg, #A78BFA 0%, #EC4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
          }
          h1 {
            font-size: 24px;
            font-weight: 800;
            color: #FFFFFF;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #A1A1AA;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #534AB7 0%, #7c3aed 100%);
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 14px 30px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 14px;
            box-shadow: 0 10px 20px rgba(83, 74, 183, 0.2);
            transition: all 0.2s ease;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #52525B;
            border-t: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
          }
          .highlight {
            color: #A78BFA;
            font-weight: 700;
          }
          .receipt-box {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 13px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .receipt-row:last-child {
            margin-bottom: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo">
              <span class="logo-text">Network Marketing Master</span>
            </div>
            ${contentHtml}
            <div class="footer">
              ${footerText}
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

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
    ? `
      <h1>Welcome Aboard, ${name}!</h1>
      <p>We are absolutely thrilled to have you in the <span class="highlight">Network Marketing Master</span> family. You have just unlocked the most powerful digital system designed specifically for independent networkers to organize and explode their business.</p>
      <p>Here are your first 3 steps to kickstart your growth:</p>
      <p style="margin-left: 20px; text-indent: -20px;">
        1. 📦 <span class="highlight">Build your Pipeline:</span> Add your active prospects and sort them through the stages (New, Presentation, Follow-up, Joined).<br>
        2. 🤖 <span class="highlight">Rehearse with AI:</span> Run dynamic roleplays in our Field Rehearsal screen to master objections before facing your prospects.<br>
        3. 🤝 <span class="highlight">Invite your Team:</span> Copy your sponsor code from the Ekip Panel and share it with your downlines to sync onboarding steps.
      </p>
      <div class="button-container">
        <a href="https://nmm.suattayfuntopak.com/giris" class="button">Go to Dashboard</a>
      </div>
      <p>To your limitless success,<br>The NMM Team</p>
    `
    : `
      <h1>Aramıza Hoş Geldiniz, ${name}!</h1>
      <p><span class="highlight">Network Marketing Master</span> ailesine katıldığınız için son derece heyecanlıyız! Ağ pazarlaması (MLM) profesyonellerinin saha süreçlerini dijitalleştirmek, aday takibini kurumsallaştırmak ve büyümeyi tetiklemek için tasarlanan en gelişmiş sisteme ilk adımınızı attınız.</p>
      <p>Hemen büyümeye başlamak için ilk 3 önerimiz:</p>
      <p style="margin-left: 20px; text-indent: -20px;">
        1. 📦 <span class="highlight">Boru Hattınızı Kurun:</span> Aday listenizi ekleyin ve onları huni aşamalarına (Yeni, Sunum, Takip, Katıldı) göre yerleştirin.<br>
        2. 🤖 <span class="highlight">Yapay Zeka ile Saha Provası Yapın:</span> Adaylarımızın en sık sorduğu zorlu itirazlara karşı interaktif sohbet provası yapın.<br>
        3. 🤝 <span class="highlight">Ekibinizi Davet Edin:</span> Ekip panelinden sponsor davet kodunuzu kopyalayıp downline arkadaşlarınıza atarak onboarding adımlarını canlı izleyin.
      </p>
      <div class="button-container">
        <a href="https://nmm.suattayfuntopak.com/giris" class="button">Panoya Giriş Yap</a>
      </div>
      <p>Sonsuz başarınız için her zaman yanınızdayız,<br>NMM Ekibi</p>
    `

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html: getEmailTemplate(content, lang),
    })

    console.log('[Resend] Welcome email sent successfully:', data)
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

  const content = lang === 'en'
    ? `
      <h1>Payment Successful!</h1>
      <p>Hi ${name}, your secure payment has been verified by Shopier. Your NMM workspace has been successfully upgraded to <span class="highlight">${planLabel}</span> and your license expiry date has been extended by <span class="highlight">30 days</span>.</p>
      
      <div class="receipt-box">
        <div class="receipt-row"><strong>Product:</strong> <span>NMM ${planLabel}</span></div>
        <div class="receipt-row"><strong>Amount Paid:</strong> <span>${amount} TRY</span></div>
        <div class="receipt-row"><strong>Status:</strong> <span style="color: #34D399;">Completed</span></div>
        <div class="receipt-row"><strong>License Expires On:</strong> <span>${dateFormatted}</span></div>
      </div>

      <p>Thank you for choosing Network Marketing Master to empower your organization. All premium features, higher AI credits, and analytics tools have been instantly unlocked!</p>
      
      <div class="button-container">
        <a href="https://nmm.suattayfuntopak.com/giris" class="button">Go to Workspace</a>
      </div>
      <p>To your limitless success,<br>The NMM Team</p>
    `
    : `
      <h1>Ödemeniz Başarıyla Onaylandı!</h1>
      <p>Merhaba ${name}, Shopier üzerinden gerçekleştirdiğiniz ödemeniz başarıyla doğrulanmıştır. Çalışma alanınız <span class="highlight">${planLabel}</span> seviyesine yükseltilmiş ve lisans süreniz otomatik olarak <span class="highlight">+30 gün</span> uzatılmıştır.</p>
      
      <div class="receipt-box">
        <div class="receipt-row"><strong>Hizmet:</strong> <span>NMM ${planLabel}</span></div>
        <div class="receipt-row"><strong>Ödenen Miktar:</strong> <span>${amount} TRY</span></div>
        <div class="receipt-row"><strong>Durum:</strong> <span style="color: #34D399;">Başarılı</span></div>
        <div class="receipt-row"><strong>Yeni Son Kullanım Tarihi:</strong> <span>${dateFormatted}</span></div>
      </div>

      <p>Network Marketing Master'ı tercih ederek organizasyonunuzu dijitalleştirdiğiniz için teşekkür ederiz. Premium haklarınız, yapay zeka limitleriniz ve analiz araçlarınız anında hesabınıza yüklenmiştir!</p>
      
      <div class="button-container">
        <a href="https://nmm.suattayfuntopak.com/giris" class="button">Çalışma Alanına Git</a>
      </div>
      <p>Sonsuz başarınız için her zaman yanınızdayız,<br>NMM Ekibi</p>
    `

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html: getEmailTemplate(content, lang),
    })

    console.log('[Resend] Payment success email sent:', data)
    return true
  } catch (err) {
    console.error('[Resend] Failed to send payment success email:', err)
    return false
  }
}
