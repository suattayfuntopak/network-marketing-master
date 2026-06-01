import {
  CANONICAL_OBJECTION_COUNT,
  CANONICAL_TRAINING_COUNT,
} from '@/lib/domain/pulse'

export const LEARNING_EVENT_TYPES = [
  'training_read',
  'training_fav',
  'training_unfav',
  'objection_read',
  'objection_fav',
  'objection_unfav',
  'presentation_sent',
  'appointment_set',
  'appointment_done',
  'training_library_complete',
  'objection_library_complete',
] as const

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[number]

export type ProgressChangeType =
  | 'readTraining'
  | 'favTraining'
  | 'readObjection'
  | 'favObjection'

export function progressChangeToEventType(
  change: ProgressChangeType,
  add: boolean
): LearningEventType {
  switch (change) {
    case 'readTraining':
      return 'training_read'
    case 'favTraining':
      return add ? 'training_fav' : 'training_unfav'
    case 'readObjection':
      return 'objection_read'
    case 'favObjection':
      return add ? 'objection_fav' : 'objection_unfav'
  }
}

export function itemKeyForProgress(change: ProgressChangeType, id: string | number): string {
  return change === 'readTraining' || change === 'favTraining'
    ? String(id)
    : String(id)
}

export function isLibraryComplete(
  readCount: number,
  kind: 'training' | 'objection'
): boolean {
  return kind === 'training'
    ? readCount >= CANONICAL_TRAINING_COUNT
    : readCount >= CANONICAL_OBJECTION_COUNT
}
