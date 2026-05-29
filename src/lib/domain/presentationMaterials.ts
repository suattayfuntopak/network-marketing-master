export const MAX_PRESENTATION_MATERIALS = 5

export const SUPER_ADMIN_GREENLEAF_URL = 'https://www.suattayfuntopak.com/greenleaf-sunumu'

export const FALLBACK_MATERIAL_ID = '__greenleaf_fallback__'

export interface PresentationMaterial {
  id: string
  workspace_id: string
  title: string
  url: string
  whatsapp_template: string
  sort_order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export function defaultWhatsappTemplate(lang: 'tr' | 'en'): string {
  return lang === 'en'
    ? 'Hi {name}, you can view my presentation here:\n\n{url}\n\nQuestions? Reach out to {sender}.'
    : `Merhaba {name} Bey / Hanım,

Greenleaf'in global vizyonunu, ürün ekosistemini ve sunduğu harika iş fırsatını detaylıca inceleyebileceğiniz bağlantıyı aşağıda sizinle paylaşıyorum:

{url}

Merak ettiğiniz noktalar veya üzerine konuşmak istediğiniz detaylar olursa, bana dilediğiniz zaman ulaşabilirsiniz.

Görüşmek dileğiyle.`
}

export function renderPresentationMessage(
  template: string,
  vars: { name: string; url: string; sender: string }
): string {
  return template
    .replace(/\{name\}/g, vars.name)
    .replace(/\{url\}/g, vars.url)
    .replace(/\{sender\}/g, vars.sender)
}

export function buildGreenleafFallbackMaterial(
  lang: 'tr' | 'en',
  workspaceId: string
): PresentationMaterial {
  const now = new Date().toISOString()
  return {
    id: FALLBACK_MATERIAL_ID,
    workspace_id: workspaceId,
    title: lang === 'en' ? 'Greenleaf Presentation' : 'Greenleaf Sunumu',
    url: SUPER_ADMIN_GREENLEAF_URL,
    whatsapp_template: defaultWhatsappTemplate(lang),
    sort_order: 0,
    is_default: true,
    created_at: now,
    updated_at: now,
  }
}

export function normalizePresentationUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('URL must start with http:// or https://')
  }
  return trimmed
}
