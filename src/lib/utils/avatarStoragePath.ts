const CANDIDATE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function sanitizeCandidateIdForAvatarPath(raw: string): string | null {
  const trimmed = raw.trim()
  if (!CANDIDATE_UUID_RE.test(trimmed)) return null
  return trimmed.replace(/[^a-zA-Z0-9-]/g, '')
}

export function avatarFileExtension(fileName: string): string {
  return (fileName.split('.').pop() ?? 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
}

/** Storage key: `avatars/{scope}_{timestamp}.{ext}` — aday scope her zaman candidate_{uuid} öneki. */
export function buildAvatarStoragePath(input: {
  scope: 'user' | 'candidate'
  userId: string
  candidateId?: string
  fileName: string
  nowMs?: number
}): string {
  const ext = avatarFileExtension(input.fileName)
  const ts = input.nowMs ?? Date.now()

  if (input.scope === 'candidate') {
    const safeId = sanitizeCandidateIdForAvatarPath(input.candidateId ?? '')
    if (!safeId) throw new Error('Geçersiz aday kimliği.')
    const scopePrefix = `candidate_${safeId}`
    if (!scopePrefix.includes(safeId)) {
      throw new Error('Avatar yolu aday kimliği ile eşleşmiyor.')
    }
    return `avatars/${scopePrefix}_${ts}.${ext}`
  }

  return `avatars/${input.userId}_${ts}.${ext}`
}
