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

import type { TrialUserStats } from '@/lib/infra/cronTrialRecipients'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NMM <onboarding@resend.dev>'

export type TrialEmailKind = 'trial_mid' | 'trial_3d' | 'trial_1d' | 'trial_ended' | 'trial_15d'

const PAYMENT_URL = `${NMM_APP_URL}/odeme`

/**
 * Veri-odaklı kişiselleştirme: kullanıcının kurduğu boru hattını hatırlatır
 * (sunk-cost + momentum). Veri yoksa ('' döner) e-postaya hiçbir şey eklenmez —
 * "0 adayınız var" gibi motivasyon kırıcı satır asla gösterilmez.
 */
function statsParagraph(stats: TrialUserStats | undefined, lang: 'tr' | 'en'): string {
  if (!stats || stats.candidateCount < 1) return ''
  const { candidateCount, activeCount, upcomingFollowUps } = stats
  if (lang === 'en') {
    let s = `You've built a pipeline of ${emailHighlight(`${candidateCount} prospect${candidateCount === 1 ? '' : 's'}`)}`
    if (activeCount > 0) s += `, ${activeCount} in active follow-up`
    if (upcomingFollowUps > 0) s += `, with ${upcomingFollowUps} reminder${upcomingFollowUps === 1 ? '' : 's'} scheduled`
    s += '. Keep your momentum going — pick up right where you left off.'
    return emailParagraph(s)
  }
  let s = `Boru hattınızda ${emailHighlight(`${candidateCount} aday`)} var`
  if (activeCount > 0) s += `, ${activeCount} tanesi aktif takipte`
  if (upcomingFollowUps > 0) s += `, ${upcomingFollowUps} planlı hatırlatmanız hazır`
  s += '. Bu emeği boşa harcamayın — kaldığınız yerden devam edin.'
  return emailParagraph(s)
}

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

function contentFor(
  kind: TrialEmailKind,
  name: string,
  lang: 'tr' | 'en',
  stats?: TrialUserStats
): { subject: string; html: string } {
  const hi = lang === 'en' ? `Hi ${name},` : `Merhaba ${name},`
  const cta =
    lang === 'en' ? 'View plans & continue →' : 'Planları incele ve devam et →'
  const utm = `utm_source=nmm_email&utm_campaign=${kind}`
  const personal = statsParagraph(stats, lang)

  switch (kind) {
    case 'trial_mid':
      return {
        subject:
          lang === 'en'
            ? "You're halfway through your trial — your next move"
            : 'Denemenizin yarısındasınız — sıradaki adım',
        html: buildPremiumEmail(
          [
            emailHeading(
              lang === 'en' ? "You're halfway there 🎯" : 'Tam ortadasınız 🎯'
            ),
            emailParagraph(hi),
            personal,
            emailParagraph(
              lang === 'en'
                ? `You've used ${emailHighlight('7 of your 14 trial days')}. The leaders who get the most out of NMM do three simple things in week two — here's your quick checklist:`
                : `${emailHighlight('14 günlük denemenizin 7 günü')} geçti. NMM'den en çok verim alan liderler ikinci hafta üç basit şeyi yapar — işte hızlı kontrol listeniz:`
            ),
            emailBulletList(
              lang === 'en'
                ? [
                    '<strong>Add your first 5 prospects</strong> to the pipeline if you haven’t yet',
                    '<strong>Run one AI roleplay</strong> before your next real conversation',
                    '<strong>Set a follow-up reminder</strong> on your calendar so no one slips away',
                  ]
                : [
                    'Henüz eklemediyseniz <strong>ilk 5 adayınızı</strong> boru hattına ekleyin',
                    'Bir sonraki gerçek görüşmeden önce <strong>bir YZ saha provası</strong> yapın',
                    'Kimse kaybolmasın diye takviminize <strong>bir takip hatırlatması</strong> koyun',
                  ]
            ),
            emailCta(`${NMM_APP_URL}/giris?${utm}`, lang === 'en' ? 'Open your dashboard →' : 'Panona git →'),
            emailParagraph(
              lang === 'en'
                ? `Want to invite your team too? Team features unlock on <a href="${PAYMENT_URL}?${utm}" style="color:#534AB7;font-weight:600;">Plus & Pro</a>.`
                : `Ekibinizi de davet etmek ister misiniz? Ekip özellikleri <a href="${PAYMENT_URL}?${utm}" style="color:#534AB7;font-weight:600;">Plus ve Pro</a>'da açılır.`
            ),
          ].join(''),
          lang
        ),
      }
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
            personal,
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
            personal,
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
            ? 'Your NMM trial has ended — here\'s what changed'
            : 'NMM deneme süreniz bitti — işte değişenler',
        html: buildPremiumEmail(
          [
            emailHeading(
              lang === 'en' ? 'Your trial has ended' : 'Deneme süreniz tamamlandı'
            ),
            emailParagraph(hi),
            personal,
            emailParagraph(
              lang === 'en'
                ? `Your ${emailHighlight('14-day trial')} on Network Marketing Master has ended. Your account has moved to the free tier — here's exactly what changed:`
                : `Network Marketing Master'daki ${emailHighlight('14 günlük denemeniz')} sona erdi. Hesabınız ücretsiz plana geçti — işte tam olarak ne değişti:`
            ),
            emailBulletList(
              lang === 'en'
                ? [
                    '🔒 <strong>AI Coach messages:</strong> 15/day → 5/day',
                    '🔒 <strong>AI Roleplay (field practice):</strong> 10/day → 3/day',
                    '🔒 <strong>Compliance Auditor:</strong> no longer available on free plan',
                    '🔒 <strong>Team Hub (Ekibim):</strong> requires Plus or Pro',
                  ]
                : [
                    '🔒 <strong>YZ Koçu mesajları:</strong> günde 15 → günde 5\'e düştü',
                    '🔒 <strong>Saha Provası (roleplay):</strong> günde 10 → günde 3\'e düştü',
                    '🔒 <strong>Uyum Denetleyicisi:</strong> ücretsiz planda artık kullanılamıyor',
                    '🔒 <strong>Ekibim sayfası:</strong> Plus veya Pro planı gerekli',
                  ]
            ),
            emailParagraph(
              lang === 'en'
                ? '✅ <strong>Everything else stays open:</strong> your pipeline, candidate notes, follow-up reminders, and activity history are fully accessible — no data is lost.'
                : '✅ <strong>Geri kalan her şey açık:</strong> boru hattınız, aday notları, takip hatırlatmaları ve aktivite geçmişi tam erişilebilir — hiçbir veri kaybolmadı.'
            ),
            emailParagraph(
              lang === 'en'
                ? 'Upgrade to restore full AI credits and unlock your team:'
                : 'Tam YZ kredilerinizi geri almak ve ekibinizi açmak için plan seçin:'
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
            personal,
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
  lang: 'tr' | 'en' = 'tr',
  stats?: TrialUserStats
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] Skipping trial email:', kind)
    return false
  }

  const { subject, html } = contentFor(kind, name, lang, stats)

  try {
    await resend.emails.send({ from: FROM_EMAIL, to: [email], replyTo: NMM_REPLY_TO, subject, html })
    return true
  } catch (err) {
    console.error('[Resend] trial email failed:', kind, err)
    return false
  }
}
