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
}

export interface SyncedPipelineStage extends PipelineStage {
  contactStageKey: ContactStageKey
}

const LEGACY_STAGE_LABELS: Record<string, Required<StageLabelConfig>> = {
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

export function getSyncedPipelineStages(stages: PipelineStage[]): SyncedPipelineStage[] {
  return [...stages]
    .sort((a, b) => a.position - b.position)
    .slice(0, CONTACT_STAGE_KEYS.length)
    .map((stage, index) => ({
      ...stage,
      contactStageKey: CONTACT_STAGE_KEYS[index],
    }))
}

export function findSyncedStageByContactStage(
  stages: PipelineStage[],
  contactStage: string
): SyncedPipelineStage | null {
  return getSyncedPipelineStages(stages).find((stage) => stage.contactStageKey === contactStage) ?? null
}

export function getStageLabelConfig(stage: Pick<PipelineStage, 'name' | 'slug' | 'description'>): Required<StageLabelConfig> {
  const labels = parseStageLabelConfig(stage.description)
  const legacyLabels = getLegacyStageLabels(stage)

  return {
    trLabel: labels.trLabel?.trim() || legacyLabels.trLabel || stage.name,
    enLabel: labels.enLabel?.trim() || legacyLabels.enLabel || labels.trLabel?.trim() || legacyLabels.trLabel || stage.name,
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
