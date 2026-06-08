import { redirect } from 'next/navigation'
import { resolveLegacySummaryRedirect } from '@/lib/domain/legacyRouteRedirects'

type Props = { searchParams: Promise<{ offset?: string }> }

export default async function HaftalikOzetPage({ searchParams }: Props) {
  const { offset } = await searchParams
  redirect(resolveLegacySummaryRedirect('/haftalik-ozet', offset ?? null)!)
}
