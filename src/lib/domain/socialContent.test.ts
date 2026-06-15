import { describe, it, expect } from 'vitest'
import {
  parseSocialGoal,
  parseSocialPlatform,
  buildSocialContentUserPrompt,
} from '@/lib/domain/socialContent'

describe('parseSocialGoal / parseSocialPlatform', () => {
  it('geçerli değerleri korur', () => {
    expect(parseSocialGoal('firsat')).toBe('firsat')
    expect(parseSocialPlatform('facebook')).toBe('facebook')
  })
  it('geçersiz → varsayılan', () => {
    expect(parseSocialGoal('xyz')).toBe('urun')
    expect(parseSocialGoal(null)).toBe('urun')
    expect(parseSocialPlatform(undefined)).toBe('instagram')
  })
})

describe('buildSocialContentUserPrompt', () => {
  it('TR: seçimleri ve konuyu içerir', () => {
    const p = buildSocialContentUserPrompt({
      goal: 'hikaye', platform: 'instagram', tone: 'ilham', topic: 'sabah rutinim', lang: 'tr',
    })
    expect(p).toContain('Instagram')
    expect(p).toContain('Kişisel hikaye')
    expect(p).toContain('ilham')
    expect(p).toContain('sabah rutinim')
    expect(p).toContain('3 farklı içerik varyantı')
  })

  it('EN: İngilizce bağlam + konu', () => {
    const p = buildSocialContentUserPrompt({
      goal: 'firsat', platform: 'whatsapp_durum', tone: 'profesyonel', topic: 'free webinar', lang: 'en',
    })
    expect(p).toContain('WhatsApp Status')
    expect(p).toContain('opportunity')
    expect(p).toContain('free webinar')
    expect(p).toContain('3 distinct content variants')
  })

  it('boş konu → (genel) yer tutucu', () => {
    const p = buildSocialContentUserPrompt({
      goal: 'urun', platform: 'facebook', tone: 'samimi', topic: '   ', lang: 'tr',
    })
    expect(p).toContain('(genel)')
  })

  it('bilinmeyen ton → samimi fallback (patlamaz)', () => {
    const p = buildSocialContentUserPrompt({
      goal: 'urun', platform: 'instagram', tone: 'bilinmeyen', topic: 'x', lang: 'tr',
    })
    expect(p).toContain('sıcak ve içten')
  })
})
