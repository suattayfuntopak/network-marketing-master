import { redirect } from 'next/navigation'
import { resolveIlgilenRedirect } from '@/lib/domain/legacyRouteRedirects'

type Props = { searchParams: Promise<{ tab?: string }> }

export default async function IlgilenPage({ searchParams }: Props) {
  const { tab } = await searchParams
  redirect(resolveIlgilenRedirect(tab ?? null))
}
