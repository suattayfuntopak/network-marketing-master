/**
 * Sosyal Satış Stüdyosu — amaç/platform/ton bağlamı + kullanıcı prompt'u (SAF, test edilebilir).
 * Sistem prompt'u (rol + uyum + format) action'da; burada yalnız kullanıcı isteği kurulur.
 */

export type SocialGoal = 'urun' | 'firsat' | 'hikaye' | 'etkilesim'
export type SocialPlatform = 'instagram' | 'whatsapp_durum' | 'facebook'

export interface SocialContentInput {
  goal: SocialGoal
  platform: SocialPlatform
  tone: string
  topic: string
  lang: 'tr' | 'en'
}

const GOALS: SocialGoal[] = ['urun', 'firsat', 'hikaye', 'etkilesim']
const PLATFORMS: SocialPlatform[] = ['instagram', 'whatsapp_durum', 'facebook']

export function parseSocialGoal(v: string | null | undefined): SocialGoal {
  return GOALS.includes(v as SocialGoal) ? (v as SocialGoal) : 'urun'
}

export function parseSocialPlatform(v: string | null | undefined): SocialPlatform {
  return PLATFORMS.includes(v as SocialPlatform) ? (v as SocialPlatform) : 'instagram'
}

const GOAL_CTX: Record<SocialGoal, { tr: string; en: string }> = {
  urun: { tr: 'Ürün/hizmet tanıtımı — faydayı öne çıkar, satış baskısı yok', en: 'Product/service highlight — lead with benefit, no hard sell' },
  firsat: { tr: 'İş fırsatı paylaşımı — merak uyandır, kapı arala', en: 'Business opportunity teaser — spark curiosity, open the door' },
  hikaye: { tr: 'Kişisel hikaye/dönüşüm — samimi, ilham veren anlatı', en: 'Personal story/transformation — sincere, inspiring narrative' },
  etkilesim: { tr: 'Etkileşim sorusu — yorum/yanıt çeken, topluluk kuran', en: 'Engagement question — drives comments, builds community' },
}

const PLATFORM_CTX: Record<SocialPlatform, { tr: string; en: string }> = {
  instagram: { tr: 'Instagram gönderisi — akıcı caption + 3-5 ilgili hashtag', en: 'Instagram post — flowing caption + 3-5 relevant hashtags' },
  whatsapp_durum: { tr: 'WhatsApp Durumu — çok kısa, tek bakışta okunan, emojili', en: 'WhatsApp Status — very short, glanceable, with emojis' },
  facebook: { tr: 'Facebook gönderisi — biraz daha uzun, sohbet başlatan', en: 'Facebook post — slightly longer, conversation-starting' },
}

const TONE_CTX: Record<string, { tr: string; en: string }> = {
  samimi: { tr: 'sıcak ve içten', en: 'warm and sincere' },
  profesyonel: { tr: 'profesyonel ama yakın', en: 'professional yet approachable' },
  esprili: { tr: 'hafif esprili ve neşeli', en: 'lightly humorous and cheerful' },
  ilham: { tr: 'ilham veren ve motive edici', en: 'inspiring and motivating' },
}

/** AI'a gönderilecek kullanıcı isteği — seçimleri ve konuyu içerir. */
export function buildSocialContentUserPrompt(input: SocialContentInput): string {
  const lang = input.lang
  const goal = GOAL_CTX[input.goal][lang]
  const platform = PLATFORM_CTX[input.platform][lang]
  const tone = (TONE_CTX[input.tone] ?? TONE_CTX.samimi)[lang]
  const topic = input.topic.trim()

  if (lang === 'en') {
    return `Platform: ${platform}\nGoal: ${goal}\nTone: ${tone}\nTopic/context: ${topic || '(general)'}\n\nWrite 3 distinct content variants.`
  }
  return `Platform: ${platform}\nAmaç: ${goal}\nTon: ${tone}\nKonu/bağlam: ${topic || '(genel)'}\n\n3 farklı içerik varyantı yaz.`
}
