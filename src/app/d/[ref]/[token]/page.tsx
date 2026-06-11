import { redirect } from 'next/navigation'
import { resolveInviteCandidateFromShortToken } from '@/lib/domain/inviteSignup'

type Props = {
  params: Promise<{ ref: string; token: string }>
}

/** Kısa davet URL → tam kayıt sayfası yönlendirmesi. */
export default async function ShortInvitePage({ params }: Props) {
  const { ref, token } = await params
  const aday = await resolveInviteCandidateFromShortToken(ref, token)

  if (!aday) {
    redirect('/kayit')
  }

  const q = new URLSearchParams({
    ref: ref.trim().toUpperCase(),
    aday,
  })
  redirect(`/kayit?${q.toString()}`)
}
