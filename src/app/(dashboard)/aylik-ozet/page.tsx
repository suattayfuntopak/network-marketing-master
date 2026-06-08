import { redirect } from 'next/navigation'

type Props = { searchParams: Promise<{ offset?: string }> }

export default async function AylikOzetPage({ searchParams }: Props) {
  const { offset } = await searchParams
  const q = new URLSearchParams({ tab: 'monthly' })
  if (offset) q.set('offset', offset)
  redirect(`/saha-ozetim?${q.toString()}`)
}
