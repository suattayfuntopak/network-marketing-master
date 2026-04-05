export type StageColor = 'gray' | 'blue' | 'purple' | 'amber' | 'orange' | 'emerald' | 'red' | 'pink'

export const STAGE_COLOR_CLASSES: Record<StageColor, { bg: string; border: string; text: string; badge: string }> = {
  gray:    { bg: 'bg-gray-100 dark:bg-gray-800',     border: 'border-gray-300 dark:border-gray-600',    text: 'text-gray-700 dark:text-gray-300',    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  blue:    { bg: 'bg-blue-100 dark:bg-blue-900/30',  border: 'border-blue-300 dark:border-blue-600',    text: 'text-blue-700 dark:text-blue-300',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  purple:  { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-900/30',  border: 'border-amber-300 dark:border-amber-600',   text: 'text-amber-700 dark:text-amber-300',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  orange:  { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-600', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  red:     { bg: 'bg-red-100 dark:bg-red-900/30',    border: 'border-red-300 dark:border-red-600',      text: 'text-red-700 dark:text-red-300',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  pink:    { bg: 'bg-pink-100 dark:bg-pink-900/30',  border: 'border-pink-300 dark:border-pink-600',    text: 'text-pink-700 dark:text-pink-300',    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
}

export const DEAL_TYPE_COLORS = {
  prospect:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  product_sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  recruitment:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
} as const

export const DEAL_STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  won:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
} as const

export function formatCurrency(value: number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
