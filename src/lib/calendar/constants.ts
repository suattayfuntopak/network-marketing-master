import type { AppointmentType, FollowUpActionType, FollowUpPriority } from './types'

export const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  meeting:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  call:         'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  video_call:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  presentation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  coffee:       'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  event:        'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  other:        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export const APPOINTMENT_DOT_COLORS: Record<AppointmentType, string> = {
  meeting:      'bg-blue-500',
  call:         'bg-green-500',
  video_call:   'bg-purple-500',
  presentation: 'bg-orange-500',
  coffee:       'bg-amber-500',
  event:        'bg-pink-500',
  other:        'bg-gray-400',
}

export const PRIORITY_COLORS: Record<FollowUpPriority, string> = {
  low:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export const PRIORITY_DOT: Record<FollowUpPriority, string> = {
  low:    'bg-gray-400',
  medium: 'bg-blue-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-500',
}

export const ACTION_TYPE_ICONS: Record<FollowUpActionType, string> = {
  call:      'Phone',
  message:   'MessageCircle',
  email:     'Mail',
  visit:     'MapPin',
  send_info: 'Send',
  check_in:  'Eye',
  other:     'MoreHorizontal',
}

// Quick follow-up date offsets (days from today)
export const QUICK_FOLLOW_UP_OFFSETS = [
  { key: 'tomorrow',  days: 1 },
  { key: 'in3Days',   days: 3 },
  { key: 'in1Week',   days: 7 },
  { key: 'in2Weeks',  days: 14 },
  { key: 'in1Month',  days: 30 },
] as const
