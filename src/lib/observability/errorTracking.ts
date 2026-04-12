import { APP_NAME } from '@/lib/constants'

const SESSION_STORAGE_KEY = 'nmm_recent_errors'
const MAX_STORED_ERRORS = 20

export interface TrackedAppError {
  source: 'boundary' | 'route' | 'window.error' | 'window.unhandledrejection'
  message: string
  stack?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
    stack: undefined,
  }
}

function persistTrackedError(entry: TrackedAppError) {
  if (typeof window === 'undefined') return

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    const parsed = existing ? (JSON.parse(existing) as TrackedAppError[]) : []
    const next = [entry, ...parsed].slice(0, MAX_STORED_ERRORS)
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures; reporting should never crash the app.
  }
}

export function reportAppError(
  error: unknown,
  source: TrackedAppError['source'],
  metadata?: Record<string, unknown>
) {
  const normalized = normalizeError(error)
  const entry: TrackedAppError = {
    source,
    message: normalized.message,
    stack: normalized.stack,
    timestamp: new Date().toISOString(),
    metadata,
  }

  console.error(`[${APP_NAME}]`, entry)
  persistTrackedError(entry)
}

let hasRegisteredGlobalErrorHandlers = false

export function registerGlobalErrorHandlers() {
  if (typeof window === 'undefined' || hasRegisteredGlobalErrorHandlers) return

  window.addEventListener('error', (event) => {
    reportAppError(event.error ?? event.message, 'window.error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportAppError(event.reason, 'window.unhandledrejection')
  })

  hasRegisteredGlobalErrorHandlers = true
}
