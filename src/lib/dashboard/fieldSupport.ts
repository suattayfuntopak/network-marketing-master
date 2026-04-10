import type { AcademyContent, ContentCategory, Objection, ObjectionCategory } from '@/lib/academy/types'
import type { DailyFocusMode } from '@/lib/dashboard/dailyFocus'

const ACADEMY_CATEGORY_PRIORITY: Record<DailyFocusMode, ContentCategory[]> = {
  follow_ups: ['follow_up', 'closing', 'mindset'],
  opportunities: ['closing', 'presenting', 'product_knowledge'],
  new_reachouts: ['inviting', 'mindset', 'follow_up'],
}

const OBJECTION_CATEGORY_PRIORITY: Record<DailyFocusMode, ObjectionCategory[]> = {
  follow_ups: ['wait', 'time', 'trust'],
  opportunities: ['money', 'trust', 'product'],
  new_reachouts: ['fear', 'introvert', 'wait'],
}

function getLocalizedItems<T extends { language: string }>(items: T[], language: 'tr' | 'en') {
  const localized = items.filter((item) => item.language === language)
  return localized.length > 0 ? localized : items
}

function sortAcademyContents(items: AcademyContent[]) {
  return [...items].sort((a, b) => {
    if (Number(b.is_favorite) !== Number(a.is_favorite)) {
      return Number(b.is_favorite) - Number(a.is_favorite)
    }

    if (b.view_count !== a.view_count) {
      return b.view_count - a.view_count
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function sortObjections(items: Objection[]) {
  return [...items].sort((a, b) => {
    if (Number(b.is_favorite) !== Number(a.is_favorite)) {
      return Number(b.is_favorite) - Number(a.is_favorite)
    }

    if (b.use_count !== a.use_count) {
      return b.use_count - a.use_count
    }

    if (Number(b.is_system) !== Number(a.is_system)) {
      return Number(b.is_system) - Number(a.is_system)
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export interface FieldSupportTargets {
  academy: AcademyContent | null
  academyCategory: ContentCategory | null
  objection: Objection | null
  objectionCategory: ObjectionCategory | null
}

export function buildFieldSupportTargets({
  mode,
  academyContents,
  objections,
  language,
}: {
  mode: DailyFocusMode
  academyContents: AcademyContent[]
  objections: Objection[]
  language: 'tr' | 'en'
}): FieldSupportTargets {
  const localizedAcademy = getLocalizedItems(academyContents, language)
  const localizedObjections = getLocalizedItems(objections, language)

  for (const category of ACADEMY_CATEGORY_PRIORITY[mode]) {
    const match = sortAcademyContents(localizedAcademy.filter((item) => item.category === category))[0]
    if (match) {
      for (const objectionCategory of OBJECTION_CATEGORY_PRIORITY[mode]) {
        const objectionMatch = sortObjections(
          localizedObjections.filter((item) => item.category === objectionCategory)
        )[0]

        return {
          academy: match,
          academyCategory: category,
          objection: objectionMatch ?? null,
          objectionCategory: objectionMatch ? objectionCategory : null,
        }
      }

      return {
        academy: match,
        academyCategory: category,
        objection: null,
        objectionCategory: null,
      }
    }
  }

  for (const objectionCategory of OBJECTION_CATEGORY_PRIORITY[mode]) {
    const objectionMatch = sortObjections(
      localizedObjections.filter((item) => item.category === objectionCategory)
    )[0]

    if (objectionMatch) {
      return {
        academy: null,
        academyCategory: null,
        objection: objectionMatch,
        objectionCategory,
      }
    }
  }

  return {
    academy: null,
    academyCategory: null,
    objection: null,
    objectionCategory: null,
  }
}
