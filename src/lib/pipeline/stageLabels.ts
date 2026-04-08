import i18n from '@/i18n'
import type { PipelineStage } from './types'

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

export function resolveStageLabel(
  stage: Pick<PipelineStage, 'name' | 'slug' | 'description'>,
  t: (key: string, options?: Record<string, unknown>) => string,
  lang = i18n.language?.startsWith('en') ? 'en' : 'tr'
): string {
  if (BUILT_IN_STAGE_SLUGS.has(stage.slug)) {
    return t(`pipelineStages.${stage.slug}`, { defaultValue: stage.name })
  }

  const labels = parseStageLabelConfig(stage.description)
  const localized = lang === 'en' ? labels.enLabel : labels.trLabel
  const fallback = lang === 'en' ? labels.trLabel : labels.enLabel

  return localized?.trim() || fallback?.trim() || stage.name
}

