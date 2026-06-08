import { redirect } from 'next/navigation'
import { resolveLegacySummaryRedirect } from '@/lib/domain/legacyRouteRedirects'

type Props = { searchParams: Promise<{ offset?: string }> }

export default async function AylikOzetPage({ searchParams }: Props) {
  const { offset } = await searchParams
  redirect(resolveLegacySummaryRedirect('/aylik-ozet', offset ?? null)!)
}
