import { redirect } from 'next/navigation'

type Props = { searchParams: Promise<{ offset?: string }> }

export default async function HaftalikOzetPage({ searchParams }: Props) {
  const { offset } = await searchParams
  const q = new URLSearchParams({ tab: 'weekly' })
  if (offset) q.set('offset', offset)
  redirect(`/saha-ozetim?${q.toString()}`)
}
