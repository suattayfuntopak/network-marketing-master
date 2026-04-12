import i18n from '@/i18n'
import type { PipelineStage } from './types'

export const CONTACT_STAGE_KEYS = [
  'new',
  'contacted',
  'interested',
  'presenting',
  'thinking',
  'joined',
  'lost',
] as const

export type ContactStageKey = (typeof CONTACT_STAGE_KEYS)[number]

const BUILT_IN_STAGE_SLUGS = new Set([
  'new',
  'contacted',
  'interested',
  'presenting',
  'thinking',
  'joined',
  'lost',
])

export interface StageLabelConfig {
  trLabel?: string
  enLabel?: string
  contactStageKey?: ContactStageKey
}

export interface SyncedPipelineStage extends PipelineStage {
  contactStageKey: ContactStageKey
}

const LEGACY_STAGE_LABELS: Record<string, { trLabel: string; enLabel: string }> = {
  'new': { trLabel: 'Yeni Aday', enLabel: 'New Prospect' },
  'contacted': { trLabel: 'İletişim Kuruldu', enLabel: 'Contacted' },
  'interested': { trLabel: 'İlgileniyor', enLabel: 'Interested' },
  'presenting': { trLabel: 'Sunum Yapıldı', enLabel: 'Presenting' },
  'thinking': { trLabel: 'Düşünüyor', enLabel: 'Thinking' },
  'joined': { trLabel: 'Katıldı', enLabel: 'Joined' },
  'lost': { trLabel: 'Kaybedildi', enLabel: 'Lost' },
  'yeni-aday': { trLabel: 'Yeni Aday', enLabel: 'New Prospect' },
  'iletisim-kuruldu': { trLabel: 'İletişim Kuruldu', enLabel: 'Contacted' },
  'ilgileniyor': { trLabel: 'İlgileniyor', enLabel: 'Interested' },
  'sunum-yapildi': { trLabel: 'Sunum Yapıldı', enLabel: 'Presenting' },
  'dusunuyor': { trLabel: 'Düşünüyor', enLabel: 'Thinking' },
  'katildi': { trLabel: 'Katıldı', enLabel: 'Joined' },
  'kaybedildi': { trLabel: 'Kaybedildi', enLabel: 'Lost' },
  'randevu-verildi': { trLabel: 'Randevu Verildi', enLabel: 'Appointment Scheduled' },
}

export function parseStageLabelConfig(description?: string | null): StageLabelConfig {
  if (!description) return {}

  try {
    const parsed = JSON.parse(description) as StageLabelConfig
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        trLabel: typeof parsed.trLabel === 'string' ? parsed.trLabel : undefined,
        enLabel: typeof parsed.enLabel === 'string' ? parsed.enLabel : undefined,
        contactStageKey: CONTACT_STAGE_KEYS.includes(parsed.contactStageKey as ContactStageKey)
          ? (parsed.contactStageKey as ContactStageKey)
          : undefined,
      }
    }
  } catch {
    return {}
  }

  return {}
}

export function serializeStageLabelConfig(labels: StageLabelConfig): string {
  return JSON.stringify({
    trLabel: labels.trLabel?.trim() || '',
    enLabel: labels.enLabel?.trim() || '',
    ...(labels.contactStageKey ? { contactStageKey: labels.contactStageKey } : {}),
  })
}

export function slugifyStageLabel(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getLegacyStageLabels(stage: Pick<PipelineStage, 'name' | 'slug'>): StageLabelConfig {
  return LEGACY_STAGE_LABELS[stage.slug] || LEGACY_STAGE_LABELS[slugifyStageLabel(stage.name)] || {}
}

function inferContactStageKey(stage: Pick<PipelineStage, 'name' | 'slug' | 'description' | 'is_won_stage' | 'is_lost_stage'>): ContactStageKey | null {
  const labels = parseStageLabelConfig(stage.description)
  if (labels.contactStageKey && CONTACT_STAGE_KEYS.includes(labels.contactStageKey)) {
    return labels.contactStageKey
  }

  if (stage.is_lost_stage) return 'lost'
  if (stage.is_won_stage) return 'joined'

  const normalizedSlug = slugifyStageLabel(stage.slug)
  if (CONTACT_STAGE_KEYS.includes(normalizedSlug as ContactStageKey)) {
    return normalizedSlug as ContactStageKey
  }

  const fromLegacy = LEGACY_STAGE_LABELS[stage.slug] || LEGACY_STAGE_LABELS[slugifyStageLabel(stage.name)]
  if (!fromLegacy) return null

  const matchedKey = (Object.entries(LEGACY_STAGE_LABELS).find(([, value]) =>
    value.trLabel === fromLegacy.trLabel && value.enLabel === fromLegacy.enLabel
  )?.[0] ?? '').trim()

  if (CONTACT_STAGE_KEYS.includes(matchedKey as ContactStageKey)) {
    return matchedKey as ContactStageKey
  }

  return null
}

export function getSyncedPipelineStages(stages: PipelineStage[]): SyncedPipelineStage[] {
  const sortedStages = [...stages].sort((a, b) => a.position - b.position)
  const assignedKeys = new Set<ContactStageKey>()
  const explicit = new Map<string, ContactStageKey>()

  for (const stage of sortedStages) {
    const key = inferContactStageKey(stage)
    if (!key || assignedKeys.has(key)) continue
    explicit.set(stage.id, key)
    assignedKeys.add(key)
  }

  const remainingKeys = CONTACT_STAGE_KEYS.filter((key) => !assignedKeys.has(key))
  const explicitStageIds = new Set(explicit.keys())
  const selectedStages = [
    ...sortedStages.filter((stage) => explicitStageIds.has(stage.id)),
    ...sortedStages.filter((stage) => !explicitStageIds.has(stage.id)),
  ].slice(0, CONTACT_STAGE_KEYS.length)

  return selectedStages
    .map((stage) => {
      const explicitKey = explicit.get(stage.id)
      const nextAvailableKey = remainingKeys.shift() ?? CONTACT_STAGE_KEYS[CONTACT_STAGE_KEYS.length - 1]

      return {
        ...stage,
        contactStageKey: explicitKey ?? nextAvailableKey,
      }
    })
}

export function findSyncedStageByContactStage(
  stages: PipelineStage[],
  contactStage: string
): SyncedPipelineStage | null {
  return getSyncedPipelineStages(stages).find((stage) => stage.contactStageKey === contactStage) ?? null
}

export function getStageLabelConfig(stage: Pick<PipelineStage, 'name' | 'slug' | 'description'>): {
  trLabel: string
  enLabel: string
  contactStageKey?: ContactStageKey
} {
  const labels = parseStageLabelConfig(stage.description)
  const legacyLabels = getLegacyStageLabels(stage)

  return {
    trLabel: labels.trLabel?.trim() || legacyLabels.trLabel || stage.name,
    enLabel: labels.enLabel?.trim() || legacyLabels.enLabel || labels.trLabel?.trim() || legacyLabels.trLabel || stage.name,
    contactStageKey: labels.contactStageKey,
  }
}

export function resolveStageLabel(
  stage: Pick<PipelineStage, 'name' | 'slug' | 'description'>,
  t: (key: string, options?: Record<string, unknown>) => string,
  lang = i18n.language?.startsWith('en') ? 'en' : 'tr'
): string {
  if (BUILT_IN_STAGE_SLUGS.has(stage.slug)) {
    return t(`pipelineStages.${stage.slug}`, { defaultValue: stage.name })
  }

  const labels = getStageLabelConfig(stage)
  const localized = lang === 'en' ? labels.enLabel : labels.trLabel
  const fallback = lang === 'en' ? labels.trLabel : labels.enLabel

  return localized?.trim() || fallback?.trim() || stage.name
}

export function resolveContactStageLabel(
  stages: PipelineStage[],
  contactStage: string,
  t: (key: string, options?: Record<string, unknown>) => string,
  lang = i18n.language?.startsWith('en') ? 'en' : 'tr'
): string {
  const syncedStage = findSyncedStageByContactStage(stages, contactStage)

  return syncedStage
    ? resolveStageLabel(syncedStage, t, lang)
    : t(`contactStages.${contactStage}`, { defaultValue: contactStage })
}
