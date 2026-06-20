import { describe, it, expect, vi } from 'vitest'
import { surfaceAiQuotaError } from './aiQuotaError'

function makeHandlers() {
  return {
    openUpgrade: vi.fn(),
    toastError: vi.fn(),
    feature: 'ai_field' as const,
    fallbackMessage: 'fallback',
  }
}

describe('surfaceAiQuotaError', () => {
  it('limit → upgrade prompt açar, toast YOK', () => {
    const h = makeHandlers()
    const opened = surfaceAiQuotaError({ error: 'dolu', quotaError: 'limit' }, h)
    expect(opened).toBe(true)
    expect(h.openUpgrade).toHaveBeenCalledWith('ai_field')
    expect(h.toastError).not.toHaveBeenCalled()
  })

  it('feature → upgrade prompt açar', () => {
    const h = makeHandlers()
    expect(surfaceAiQuotaError({ quotaError: 'feature' }, h)).toBe(true)
    expect(h.openUpgrade).toHaveBeenCalledWith('ai_field')
  })

  it('auth/kod yok → toast (mesaj veya fallback), upgrade YOK', () => {
    const h = makeHandlers()
    expect(surfaceAiQuotaError({ error: 'oturum', quotaError: 'auth' }, h)).toBe(false)
    expect(h.toastError).toHaveBeenCalledWith('oturum')

    const h2 = makeHandlers()
    surfaceAiQuotaError({}, h2)
    expect(h2.toastError).toHaveBeenCalledWith('fallback')
    expect(h2.openUpgrade).not.toHaveBeenCalled()
  })
})
