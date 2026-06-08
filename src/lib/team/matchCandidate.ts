/** Turkish-aware normalizer for name matching between team members and pipeline candidates. */
export function cleanMemberName(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/\u0131/g, 'i')
    .replace(/\u011f/g, 'g')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

type LeaderCandidate = { id: string; full_name: string | null; owner_id: string; phone?: string | null }

/** Son 10 hane — `nmm_phone_tail` (063) ile uyumlu. */
export function phoneTail(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : digits
}

/** Telefon + isim birleşik skor — `nmm_match_sponsor_candidate` ile aynı öncelik. */
export function scoreMemberCandidateMatch(
  memberName: string | null | undefined,
  memberPhone: string | null | undefined,
  candidateName: string | null | undefined,
  candidatePhone: string | null | undefined,
): number {
  const mTail = phoneTail(memberPhone)
  const cTail = phoneTail(candidatePhone)
  if (mTail.length >= 10 && cTail.length >= 10 && mTail === cTail) return 110
  return scoreMemberCandidateNameMatch(memberName, candidateName)
}

/** İsim eşleşme skoru — `nmm_match_sponsor_candidate` (063) ile aynı eşikler. */
export function scoreMemberCandidateNameMatch(
  memberName: string | null | undefined,
  candidateName: string | null | undefined,
): number {
  const mf = cleanMemberName(memberName)
  const cf = cleanMemberName(candidateName)
  if (!mf || !cf) return 0

  if (cf === mf) return 100
  if (cf.includes(mf) || mf.includes(cf)) return 85

  const mWords = (memberName ?? '')
    .split(/\s+/)
    .map(w => cleanMemberName(w))
    .filter(w => w.length >= 3)
  const matched = mWords.filter(w => cf.includes(w))
  if (matched.length >= 2) return 70 + matched.length * 5

  return 0
}

/**
 * Finds the best leader-owned candidate row for a team member name.
 * Requires a strong match so shared surnames (e.g. Topak) do not pick the wrong person.
 */
export function findLeaderCandidateForMember(
  candidates: LeaderCandidate[],
  leaderOwnerId: string,
  memberName: string | null,
  memberPhone?: string | null,
): string | null {
  const mf = cleanMemberName(memberName)
  const mTail = phoneTail(memberPhone)
  if (!mf && mTail.length < 10) return null

  const pool = candidates.filter(c => c.owner_id === leaderOwnerId)
  let bestId: string | null = null
  let bestScore = 0

  for (const c of pool) {
    const score = scoreMemberCandidateMatch(memberName, memberPhone, c.full_name, c.phone)
    if (score > bestScore) {
      bestScore = score
      bestId = c.id
    }
  }

  return bestScore >= 80 ? bestId : null
}
