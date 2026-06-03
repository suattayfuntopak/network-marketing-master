import { Resend } from 'resend'
import {
  NMM_APP_URL,
  NMM_REPLY_TO,
  buildPremiumEmail,
  emailBulletList,
  emailCta,
  emailHeading,
  emailHighlight,
  emailParagraph,
  emailPlanBox,
} from '@/lib/infra/emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NMM <onboarding@resend.dev>'

export type TrialEmailKind = 'trial_3d' | 'trial_1d' | 'trial_ended' | 'trial_15d'

const PAYMENT_URL = `${NMM_APP_URL}/odeme`

function planBox(lang: 'tr' | 'en') {
  return lang === 'en'
    ? emailPlanBox([
        '<strong>Basic</strong> — Individual pipeline, AI coach & roleplay',
        '<strong>Plus</strong> — Team hub + higher daily AI limits',
        '<strong>Pro</strong> — Maximum limits for growing leaders',
      ])
    : emailPlanBox([
        '<strong>Basic</strong> — Bireysel boru hattı, YZ koçu ve saha provası',
        '<strong>Plus</strong> — Ekibim sayfası + yüksek günlük YZ limitleri',
        '<strong>Pro</strong> — Büyüyen liderler için maksimum limitler',
      ])
}

function contentFor(kind: TrialEmailKind, name: string, lang: 'tr' | 'en'): { subject: string; html: string } {
  const hi = lang === 'en' ? `Hi ${name},` : `Merhaba ${name},`
  const cta =
    lang === 'en' ? 'View plans & continue →' : 'Planları incele ve devam et →'
  const utm = `utm_source=nmm_email&utm_campaign=${kind}`

  switch (kind) {
    case 'trial_3d':
      return {
        subject:
          lang === 'en'
            ? 'Your NMM trial ends in 3 days'
            : 'NMM deneme süreniz 3 gün sonra bitiyor',
        html: buildPremiumEmail(
          [
            emailHeading(
              lang === 'en' ? 'Your trial ends in 3 days' : 'Deneme süreniz 3 gün sonra bitiyor'
            ),
            emailParagraph(hi),
            emailParagraph(
              lang === 'en'
                ? `Your ${emailHighlight('14-day free trial')} on Network Marketing Master ends in ${emailHighlight('3 days')}. You still have full Basic features — pipeline, AI coach, and roleplay.`
                : `${emailHighlight('14 günlük ücretsiz denemeniz')} Network Marketing Master'da ${emailHighlight('3 gün')} içinde sona erecek. Basic özelliklerin tamamı hâlâ açık — boru hattı, YZ koçu ve saha provası.`
            ),
            planBox(lang),
            emailCta(`${PAYMENT_URL}?${utm}`, cta),
          ].join(''),
          lang
        ),
      }
    case 'trial_1d':
      return {
        subject:
          lang === 'en'
            ? 'Last day — your NMM trial ends tomorrow'
            : 'Son gün — NMM denemeniz yarın bitiyor',
        html: buildPremiumEmail(
          [
            emailHeading(
              lang === 'en' ? 'Your trial ends tomorrow' : 'Denemeniz yarın sona eriyor'
            ),
            emailParagraph(hi),
            emailParagraph(
              lang === 'en'
                ? `Tomorrow your free trial ends — your Basic features close and daily AI credits drop to a limited free tier. Pick the plan that fits your team today.`
                : `Yarın ücretsiz denemeniz bitecek; Basic özellikleriniz kapanacak ve günlük YZ krediniz sınırlı ücretsiz seviyeye düşecek. Ekibinize uygun planı bugün seçin.`
            ),
            planBox(lang),
            emailCta(`${PAYMENT_URL}?${utm}`, cta),
          ].join(''),
          lang
        ),
      }
    case 'trial_ended':
      return {
        subject:
          lang === 'en'
            ? 'Your NMM trial has ended'
            : 'NMM deneme süreniz tamamlandı',
        html: buildPremiumEmail(
          [
            emailHeading(
              lang === 'en' ? 'Your trial has ended' : 'Deneme süreniz tamamlandı'
            ),
            emailParagraph(hi),
            emailParagraph(
              lang === 'en'
                ? `Your ${emailHighlight('14-day trial')} on Network Marketing Master has ended. We hope you explored the pipeline, AI coach, and roleplay tools.`
                : `Network Marketing Master'daki ${emailHighlight('14 günlük denemeniz')} sona erdi. Boru hattı, YZ koçu ve saha provasını keşfetme fırsatınız olduğunu umuyoruz.`
            ),
            emailParagraph(
              lang === 'en'
                ? 'Choose a plan to continue with full features and daily AI credits:'
                : 'Tüm özelliklere ve günlük YZ kredilerine devam etmek için bir plan seçin:'
            ),
            planBox(lang),
            emailCta(`${PAYMENT_URL}?${utm}`, cta),
          ].join(''),
          lang
        ),
      }
    case 'trial_15d':
      return {
        subject:
          lang === 'en'
            ? 'Keep growing your team with NMM'
            : 'NMM — Ekibinizi büyütmeye devam edin',
        html: buildPremiumEmail(
          [
            emailHeading(
              lang === 'en'
                ? 'Keep growing your team'
                : 'Ekibinizi büyütmeye devam edin'
            ),
            emailParagraph(hi),
            emailParagraph(
              lang === 'en'
                ? `It's been ${emailHighlight('15 days')} since your trial ended. The tools to run your network marketing business systematically are still here — pipeline tracking, AI coaching, and team visibility on Plus/Pro.`
                : `Deneme sürenizin bitmesinin üzerinden ${emailHighlight('15 gün')} geçti. Network marketing işinizi sistematik yönetmek için ihtiyaç duyduğunuz araçlar burada — boru hattı, YZ koçluğu ve Plus/Pro ile ekip görünürlüğü.`
            ),
            emailBulletList(
              lang === 'en'
                ? [
                    'Structured follow-ups so prospects don’t slip away',
                    'AI roleplay before difficult conversations',
                    'Team onboarding on Plus and Pro plans',
                  ]
                : [
                    'Adayların kaybolmaması için yapılandırılmış takip',
                    'Zor görüşmelerden önce YZ ile saha provası',
                    'Plus ve Pro’da ekip onboarding takibi',
                  ]
            ),
            emailParagraph(
              lang === 'en'
                ? "It's not too late to start today."
                : 'Bugün başlamak için geç değil.'
            ),
            planBox(lang),
            emailCta(`${PAYMENT_URL}?${utm}`, cta),
          ].join(''),
          lang
        ),
      }
  }
}

export async function sendTrialLifecycleEmail(
  email: string,
  name: string,
  kind: TrialEmailKind,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping trial email:', kind)
    return false
  }

  const { subject, html } = contentFor(kind, name, lang)

  try {
    await resend.emails.send({ from: FROM_EMAIL, to: [email], replyTo: NMM_REPLY_TO, subject, html })
    return true
  } catch (err) {
    console.error('[Resend] trial email failed:', kind, err)
    return false
  }
}
